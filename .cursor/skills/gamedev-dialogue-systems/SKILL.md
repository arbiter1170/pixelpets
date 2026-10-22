---
name: 'Gamedev: Dialogue systems'
description: >-
  Use when designing or debugging Walklings NPC conversations, branching choices
  or dialog flags in the browser vanilla-JS game; reference only, since
  walklings-quests owns the step format and wins on conflict.
---
# Dialogue systems

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

Model conversations as a graph: lines, choices that branch, conditions that gate options, and variables (flags) that remember what happened. **Walklings already has its runner and format.** The steps `say`, `choice`, `if`, `setFlag`, `inc`, `give`, `bond` and `sfx`, along with the line limits, are defined in walklings-quests. Use this skill to design good branches inside that format. Don't add an external dialogue tool, a new scripting language, or a second runner.

## Core workflow

1. **Know the node contract.** Each step is a line (speaker + text), a choice set, a condition, a side effect (flag, item, bond, sfx), or an end. The runner advances one step and hands lines and choices to the dialog UI.
2. **Keep variables apart from flow.** State lives in `S.flags` (story flags). Conditions read it and side effects write it. The UI never owns narrative state.
3. **Keep text in data.** Lines live in `data/*.json` scene data, not in `game.js`, so copy changes don't touch code. Respect the limits: `say` ≤ 110, choice labels ≤ 30, chatter and toasts ≤ 40.
4. **Gate, don't hide intent.** A condition can hide an option (`when`). Decide deliberately whether a locked option should show as unavailable or stay hidden.
5. **Make choices matter.** Set a flag that changes a later scene, reward or line. Branches that reconverge right away feel hollow.
6. **Verify by walking every branch.** Each choice path should reach an end, write the expected flags, and never stall. Cover new branches with a Playwright spec, per walklings-quests.

## Patterns

### Branch in our step shape (illustrative, not a real scene)

```js
["say", "Mom", "Heading up Route 1 today?"],
["choice", "Answer Mom", [
  ["Yes, with my pet", [["setFlag", "story.mom_route1", true], ["say", "Mom", "Stay on the path."]]],
  ["Not yet",          [["say", "Mom", "Come back when you are."]]]
]]
```

### Runner step, conceptually

```js
// The runner holds the current step list and an index; the UI calls next() or choose(i).
function present(step) {
  if (step[0] === 'say') ui.showLine(step[1], step[2]);
  if (step[0] === 'choice') ui.showChoices(step[2].filter(o => passes(o[3])));  // when-gated
}
```

## Pitfalls

- **A new format or tool for a simple tree.** Lines, choices and flags are already covered. Extend the existing step set only through walklings-quests and OPEN_DECISIONS.
- **State coupled to the UI.** Keep it in `S.flags` so the same scene works in tests and replays.
- **Dead ends.** A branch with no closing step stalls the dialog. Every path must terminate.
- **Double-applied effects on revisit.** A scene the holder can replay must not grant an item or `inc` a counter twice. Guard with a done flag.
- **Variants that drift.** Alternate versions of a scene must set every flag the base scene sets.
- **Guessed copy shipped as final.** Put guessed lines in an OPEN_DECISIONS row and run walklings-wording-check.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/dialogue-systems), Apache-2.0. Changes: trimmed and adapted for Walklings.
