---
name: gamedev-town-chatter
description: >-
  Use when adding or debugging Walklings town chatter and NPC barks picked by
  matching facts (time slot, place, quest flags) against rules in the browser
  vanilla-JS game; walklings-* skills win on conflict.
---
# Town chatter: rule-matched barks

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No game engine, no library, no bundler, no dialogue tool.
- Mobile-first: chatter reads and dismisses with taps alone at phone widths of 320, 375 and 390 px. A bubble never covers the tap target the holder needs next. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. No new save fields, no migrator, no `v` bump. What an NPC "remembers" is either in memory (gone on reload) or derived from flags that already exist on `S.flags`. A new story flag is a quest change and goes through walklings-quests.
- No franchise or brand names, and nothing copied from other games. Every line is our own.
- The player is the "holder" in all copy, comments and specs. Never use another title.
- "Keeper" is the faction and is always written with a capital K. Never write it in lowercase.
- Money is Acorns. Never use the banned currency word from walklings-wording-check.
- Design's packets, walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- Core-mechanic ideas this skill inspires are welcome, but raise them as a red decision to Vincent (walklings-decision) and build nothing before he approves.

**This skill defers on format.** walklings-quests owns the step format (`say`, `choice`, `if`, `setFlag`, `inc`, `give`, `bond`, `sfx`), the line limits and the test recipe. gamedev-dialogue-systems owns authored, branching conversations. Chatter is the light layer on top: short one-off lines an NPC says when tapped or when the holder walks by. When a chatter rule needs more than one line, it hands off to an existing scene in the walklings-quests format; it never invents a step type.

## The idea

Instead of if/else chains per NPC, every line is a **rule** with **criteria**. When an NPC needs something to say, the game builds a **query** of current facts, finds every rule whose criteria all pass, and plays the **most specific** one (the rule with the most criteria). General lines cover the ordinary case; a special case just adds a rule with more criteria and wins automatically. No code changes to add a line.

## Core workflow

1. **List the facts.** Decide which facts a query carries: speaker, map, place, in-game slot and weekday, weather if any, quest flags, "has the holder already heard X this session".
2. **Write rules in data.** Rules live in `data/chatter.json`. Add the new file to the `names` tuple in `tools/gen_mapdata.py` and regenerate; never hand-edit `data/mapdata.js`.
3. **Match.** Filter rules whose criteria all pass; sort by specificity; break ties with the seeded `rng()`.
4. **Remember in memory.** Record what was said in a session `Map` so lines don't repeat. Nothing is saved.
5. **Respect limits.** Chatter and toasts are at most 40 characters; longer speech is a `say` step (at most 110) inside a scene per walklings-quests.
6. **Verify.** Unit-check the matcher with fixed facts, add a Playwright spec per walklings-quests, put guessed copy in an OPEN_DECISIONS row, and run walklings-wording-check.

## Facts: build them, don't store them

```js
// Rebuilt on every query from existing state. Clock is the 42-minute in-game day, never Date.
function chatterFacts(npc) {
  const c = clock.now();                          // { day, hour } in game time
  return {
    who: npc.id,                                  // 'lizzy'
    map: S.map,                                   // existing save key, read only
    place: npc.placeTag,                          // 'diner', 'court', '5B', 'shop'
    slot: c.hour < 12 ? 'morning' : c.hour < 18 ? 'afternoon' : 'evening',
    day: c.day,                                   // in-game weekday
    flags: S.flags,                               // read only: quest progress
    heard: session.heard,                         // in-memory Set of rule ids
    holderNear: npc.distToHolder <= 2,
  };
}
```

## Rules as data

```json
{ "rules": [
  { "id": "lizzy_any",      "who": "lizzy", "line": "Busy day. Busy, busy." },
  { "id": "lizzy_evening",  "who": "lizzy", "slot": "evening",
    "line": "Long day of lessons." },
  { "id": "lizzy_diner",    "who": "lizzy", "place": "diner", "slot": "evening",
    "line": "The pie here is worth it." },
  { "id": "lizzy_thanks",   "who": "lizzy", "flag": "story.lizzy_walk_done",
    "not": ["lizzy_thanks"], "line": "Thanks for walking me home!" },
  { "id": "shop_greet",     "who": "shop_clerk", "place": "shop",
    "line": "Welcome in. Look around." },
  { "id": "lizzy_scene",    "who": "lizzy", "flag": "story.lizzy_quest_on",
    "scene": "lizzy_followup" }
]}
```

- `who`, `place`, `slot`, `day`, `map`: exact matches.
- `flag` / `noFlag`: an existing `S.flags` key is truthy / falsy. Never add a flag for chatter alone.
- `not`: rule ids already heard this session; the rule is skipped if any were.
- `once: "session"`: skip once said this session.
- `scene`: instead of a line, start an existing scene in the walklings-quests format.

The ids above are illustrative. Use the real NPC ids and flags from `data/*.json`; for a Keeper NPC, use its real id and avoid the lowercase faction word in ids too.

## The matcher (about 40 lines)

```js
const EXACT = ['who', 'place', 'slot', 'day', 'map'];

function passes(rule, f) {
  for (const k of EXACT) if (rule[k] !== undefined && rule[k] !== f[k]) return false;
  if (rule.flag && !f.flags[rule.flag]) return false;
  if (rule.noFlag && f.flags[rule.noFlag]) return false;
  if (rule.not && rule.not.some(id => f.heard.has(id))) return false;
  if (rule.once === 'session' && f.heard.has(rule.id)) return false;
  return true;
}

function specificity(rule) {
  let n = 0;
  for (const k of EXACT) if (rule[k] !== undefined) n++;
  if (rule.flag) n++; if (rule.noFlag) n++; if (rule.not) n++;
  return n + (rule.bonus ?? 0);   // Design can nudge a rule with a small bonus
}

function pickChatter(npc, rules = DATA.chatter.rules) {
  const f = chatterFacts(npc);
  let best = [], top = -1;
  for (const r of rules) {
    if (!passes(r, f)) continue;
    const s = specificity(r);
    if (s > top) { top = s; best = [r]; } else if (s === top) best.push(r);
  }
  if (!best.length) return null;                 // silence is fine
  const r = best[Math.floor(rng() * best.length)];   // seeded tie-break
  session.heard.add(r.id);
  return r;
}
```

Pre-index rules by `who` at load if the list grows; the match itself stays the same.

## Showing it

```js
function onNpcTap(npc) {
  const r = pickChatter(npc);
  if (!r) return;
  if (r.scene) return playScene(r.scene);        // existing runner and step format
  ui.bubble(npc, r.line, { maxChars: 40, tapToClose: true });
}
```

- Tapped chatter: a bubble over the NPC, closed by a tap anywhere. Walk-by chatter: a short toast with a cooldown so the street doesn't shout.
- Bubbles stay inside the safe area at 320 px; wrap, never shrink text below the UI minimum.
- Pause walk-by chatter during scenes and battles.

## Memory, in memory

```js
const session = { heard: new Set(), lastBark: new Map() };   // reset on reload, never saved
function canBark(npc, nowGameSec, gap = 60) {
  const t = session.lastBark.get(npc.id) ?? -Infinity;
  if (nowGameSec - t < gap) return false;
  session.lastBark.set(npc.id, nowGameSec);
  return true;
}
```

Anything that should survive a reload must already be a quest flag (for example a quest's `done` flag). Chatter reads it; it never writes it.

## Authoring tips

- Start each NPC with one rule that has only `who`. That NPC is never silent.
- Add layers by specificity: place, then slot, then quest flags.
- Schedules decide where an NPC is (the D378 rows); chatter only reacts to it. A line like "See you at the court Saturday" must match the real schedule.
- Keep lines in character, short and our own. Guessed copy goes in an OPEN_DECISIONS row.

## Pitfalls

- Saving "already said" state. It is in memory only.
- Two rules at the same specificity that contradict each other. Add a criterion or a `bonus`.
- A chatter rule that sets a flag. Effects belong in scenes, per walklings-quests.
- A new step type or second runner for chatter. Use `scene` to hand off.
- Lines over 40 characters in a bubble.
- Reading `Date` for slot facts. Use the in-game clock.
- Unseeded tie-breaks, which make tests flaky.

## Credits

The rule-and-criteria matching idea comes from a 2012 GDC talk on rule-based dynamic dialog. This skill describes the technique in our own words; no text, examples or code were copied from the talk.
