---
name: 'Gamedev: RPG systems'
description: >-
  Use when designing or tuning Walklings pet stats, leveling, battle damage,
  items/equipment or reward pacing in the browser vanilla-JS game; walklings-*
  skills (esp. walklings-quests) win on conflict.
---
# RPG systems

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

Covers the systems that make growth feel earned: stats and leveling, items and gear, turn-based battle math, and reward pacing. Quest step shapes, flags and line limits belong to walklings-quests, so read that before touching quests.

## Core loop

Explore → encounter (battle, talk, find) → reward (XP, Acorns, items, bond, story) → grow (level, gear, unlocks) → harder content. Every system should feed that loop.

## Stats: base, derived, modifiers

Base attributes are the only truth. Derived battle stats are recomputed from them every time and never saved. Buffs and gear live in a separate modifier layer.

```js
// Derived stats are a pure function. Never store maxHp etc. as truth.
function derive(base, mods) {
  const s = applyMods(base, mods);   // base -> flat adds -> percent -> clamp
  return {
    maxHp:   20 + s.vit * 8,
    attack:  s.str * 2,
    defense: s.vit + s.agi * 0.5,
    crit:    Math.min(0.05 + s.agi * 0.005, 0.5),
    speed:   s.agi,
  };
}
// Equip pushes a modifier, unequip pops the same one. Never edit base for a buff.
```

## Damage formulas (pick one family, stay consistent)

```js
// Subtractive: simple and tactical at small numbers. Floor at 1.
const sub = Math.max(1, atk.attack - def.defense);
// Ratio: diminishing mitigation, scales to big numbers. K ~ 100.
const ratio = atk.attack * (1 - def.defense / (def.defense + K));
// Then: variance (about ±10%), crit (about 1.5x), type multiplier (0.5 / 1 / 2).
```

Use a seeded RNG for variance and crits so Playwright battles are reproducible.

## Leveling curves

```js
function xpToNext(level, base = 100, kind = 'quadratic', growth = 1.3) {
  if (kind === 'linear') return base * level;
  if (kind === 'quadratic') return base * level * level;
  return Math.floor(base * growth ** level);   // exponential: steep
}
function gainXp(pet, amount) {
  pet.xp += amount;
  while (pet.xp >= xpToNext(pet.level)) {
    pet.xp -= xpToNext(pet.level);
    pet.level += 1;
    onLevelUp(pet);   // stat gains, heal, unlock, toast (40 chars or fewer)
  }
}
```

Keep early levels fast (minutes) and stretch later ones. Telegraph the next unlock.

## Turn-based battles

- Turn order comes from speed. Sort once per round, or fill a speed gauge each tick and let whoever is full act. Ties break deterministically, not by `Math.random`.
- Keep the battle state as plain data separate from drawing, so tests can step a battle without rendering.
- Status effects are timed modifiers: they push on apply and pop on expiry.

## Design knobs

| Knob | Effect |
|---|---|
| XP curve shape | Pacing of power |
| Stat → derived scaling | One attribute must not dominate |
| Damage family | Tactical feel versus scaling |
| Variance and crit | Swinginess (±10% and 1.5x are safe defaults) |
| Drop rates and Acorn prices | Reward cadence; loot must not trivialize shops |
| Gating | By level, region or story flag |

## Pitfalls

- Editing base stats for buffs or gear makes values drift and corrupt on reload. Use the modifier layer.
- Storing derived stats in the save desyncs them after a balance change. Recompute on load.
- Runaway numbers come from an uncapped exponential curve or a subtractive formula at huge values.
- Content as code: define pets, moves, items and enemies in `data/*.json`, not inline in `game.js`.
- Save shape: new progress goes in as new keys that load with defaults. Keep the save at v2. No migrator.
- Choices without consequence: set flags that change later scenes, following walklings-quests.
- Quest progress that isn't persisted mid-quest. Save step state, not just completion.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/genres/rpg), Apache-2.0. Changes: trimmed and adapted for Walklings.
