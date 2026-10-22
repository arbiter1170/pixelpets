---
name: 'Gamedev: Save systems'
description: >-
  Use when touching Walklings save/load, autosave timing, Firestore save writes
  or corrupt-save handling in the browser vanilla-JS game; the save stays at v2,
  and walklings-* skills win on conflict.
---
# Save systems

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

**Our save stays at v2.** The format is `pixelpets.save.v2` with `v: 2`. This skill gives no versioning or migration advice. Do not add a version field, a migrator or a new save key. New state is new keys that `normalizeV2` fills with defaults.

The hard parts are deciding what to save, writing it so a crash can't corrupt it, and loading defensively.

## Core workflow

1. **Save data, not objects.** Save numbers, ids, flags and positions. Rebuild runtime objects from that data on load. Never save canvas objects, functions, DOM nodes or derived stats.
2. **Write whole and validated.** Build the full state object, `JSON.stringify` it, parse it back once as a sanity check, then write it in a single call. Never write partial objects key by key.
3. **Load defensively.** Parse inside try/catch, check the shape, then fill missing keys with defaults (via `normalizeV2`).
4. **Autosave on safe boundaries.** Throttle it and never save mid-action.
5. **Verify.** Save, reload the page, load, and inspect that the state matches. Also check that a truncated or garbage save is handled without losing the good one.

## Crash-safe writes in the browser

- **localStorage:** one `setItem` of a complete string is all-or-nothing. The risk is writing a half-built state object, so serialize everything first and then write once. Catch `QuotaExceededError` and report it; don't swallow it.
- Don't add a backup key. If a backup slot seems needed, raise an OPEN_DECISIONS row first.
- **Firestore:** write the save doc with one `set()` (or a batch or transaction when several docs must change together). Don't spread one save across many `update()` calls that can half-apply. Know whether you are merging or replacing the doc.
- **Offline and flaky networks:** Firestore queues writes. Show save state honestly ("saving…" / "saved") and never claim a cloud save that hasn't been acknowledged.
- **Two devices:** decide conflicts deliberately (for example newest `updatedAt` wins) and surface it. Never silently merge two progress trees.

```js
function saveNow(state) {
  const raw = JSON.stringify(state);   // whole state, plain data
  JSON.parse(raw);                     // throws here, not after a half write
  localStorage.setItem(SAVE_KEY, raw); // single all-or-nothing write
}
```

## Autosave timing

- **Save at safe boundaries:** after a scene or dialog ends, on map or door change, after a battle resolves, and after a reward is granted.
- **Save when the tab may die:** on `visibilitychange` to hidden and on `pagehide`. Mobile browsers kill background tabs without warning. Don't rely on `beforeunload` on phones.
- **Throttle timed saves** (for example at most once a minute).
- **Never save mid-battle or mid-scene.** Restoring an inconsistent half-step is worse than losing a minute.

```js
let lastSave = 0;
function autosaveIfDue(now) {
  if (inBattle || sceneRunning) return;
  if (now - lastSave < 60_000) return;
  saveNow(S); lastSave = now;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !inBattle && !sceneRunning) saveNow(S);
});
```

## Corruption handling (without touching the version)

- On a parse or shape failure, **do not overwrite the stored save with a fresh default.** Keep the raw string, log it, show a clear message, and let the holder retry or start fresh deliberately.
- Fill missing or unknown keys with defaults and ignore extras. Never delete keys you don't recognise.
- Clamp out-of-range numbers (negative Acorns, a level of 0) on load.
- Save integers where possible. Don't depend on float precision in saved values.
- Treat co-op (RTDB) data as untrusted client input. A local save is never authoritative for shared state.

## Pitfalls

- Serializing runtime objects or derived values ties saves to code layout. Save data only.
- Writing state piecemeal leaves a half-updated save after a crash or tab kill.
- Trusting the stored blob: validate it and default the gaps.
- Autosave firing mid-action saves an inconsistent state.
- Treating a load failure as "new game" and overwriting progress.
- Adding a version bump or migrator "to be safe". That is not allowed here; the save stays v2.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/save-systems), Apache-2.0. Changes: trimmed and adapted for Walklings.
