---
name: gamedev-npc-decisions
description: >-
  Use when choosing what a Walklings NPC, wandering creature or battle opponent
  does next with utility scoring or a small behavior tree in the browser
  vanilla-JS game; walklings-* skills win on conflict.
---
# NPC decisions: utility scoring and small behavior trees

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No game engine, no library, no bundler. Never add a dependency to get an idea from this skill.
- Mobile-first: everything works at phone widths of 320, 375 and 390 px with taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. No new save fields, no migrator, no `v` bump. NPC memory and decision state live in memory or are derived from flags that already exist on `S.flags`. A new story flag is a quest change: it goes through walklings-quests and Design, never through this skill.
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words.
- The player is the "holder" in all copy, comments and specs. Never use another title.
- "Keeper" is the faction and is always written with a capital K. Never write it in lowercase.
- Money is Acorns. Never use the banned currency word from walklings-wording-check.
- Design's packets, walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- Core-mechanic ideas this skill inspires are welcome, but raise them as a red decision to Vincent (walklings-decision) and build nothing before he approves.

This skill is the decide layer from gamedev-game-ai, built out. gamedev-game-ai says *which* model to use and owns pathfinding, movement and schedule rules. Read this one when a state machine stops being enough and you need graded choices ("how much does this creature want to nap vs. follow the holder?") or a short priority list with steps that take several ticks.

## Rules that never bend

- **Decisions never move an NPC across a schedule.** Where an NPC is comes from the D378 rows on the 42-minute in-game day (see gamedev-game-ai). Scoring may only pick *what to do inside the current slot and map*: which bench, wander or sit, which line to bark.
- **Read the game clock, never `Date`.** Facts like "evening" come from the in-game hour.
- **Seeded randomness only.** Use the game's seeded `rng()` so Playwright runs repeat.
- **Tuning lives in data.** Curve shapes and weights go in a `data/*.json` file Design can edit. A new data file joins the `names` tuple in `tools/gen_mapdata.py`; never hand-edit `data/mapdata.js`.

## Core workflow

1. **Pick the model.** Two to five clear states: a state machine (gamedev-game-ai). Several options with trade-offs: utility scoring. A fixed priority list where some steps run over several ticks: a small behavior tree. Both: a tree whose leaf asks the scorer.
2. **Build the facts object first.** One plain object per decision, rebuilt from current state (clock, map, holder distance, flags, HP). Leaves and scorers read facts; they never reach into each other.
3. **Normalize every fact to 0..1** through a curve before it is scored. Mixed ranges make weights meaningless.
4. **Score, then select** with argmax plus a small stickiness bonus, or seeded weighted-random for variety.
5. **Decide on a slow tick** (2 to 4 times a second, or on events), not every frame. Low-end phones matter.
6. **Verify on screen.** A debug overlay shows each option's live score and the active tree path. Mis-shaped curves are obvious there.

## Curves (0..1 in, 0..1 out)

```js
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
// Map a raw value into 0..1; a gives 0, b gives 1 (a > b inverts).
const norm = (x, a, b) => a === b ? (x >= b ? 1 : 0) : clamp01((x - a) / (b - a));

const CURVES = {
  linear:    (t, p = {}) => clamp01((p.slope ?? 1) * t + (p.y0 ?? 0)),
  quad:      t => t * t,                                  // only matters near the top
  easeOut:   t => 1 - (1 - t) * (1 - t),                  // rises fast, then levels
  exp:       (t, p = {}) => { const k = p.k ?? 4; return (Math.exp(k * t) - 1) / (Math.exp(k) - 1); },
  sigmoid:   (t, p = {}) => 1 / (1 + Math.exp(-(p.k ?? 8) * (t - (p.mid ?? 0.5)))),
  smooth:    t => t * t * (3 - 2 * t),                    // soft threshold
};
const curve = (name, t, p) => clamp01(CURVES[name](clamp01(t), p));
// Invert any curve with 1 - curve(...): "want to rest" rises as energy falls.
```

Pick by intent: linear for proportional wants, quad/exp for "only at the extreme", sigmoid/smooth for a soft threshold.

## Considerations and options as data

```json
{
  "creature_wander": {
    "options": [
      { "id": "nap",    "weight": 1.0, "cons": [
        { "fact": "tired",      "curve": "sigmoid", "p": { "k": 8, "mid": 0.6 } } ] },
      { "id": "follow", "weight": 0.9, "cons": [
        { "fact": "holderNear", "curve": "smooth" },
        { "fact": "bond",       "curve": "easeOut" } ] },
      { "id": "sniff",  "weight": 0.6, "cons": [
        { "fact": "bored",      "curve": "linear" } ] }
    ]
  }
}
```

```js
// Facts are rebuilt each decision from existing state; nothing here is saved.
function creatureFacts(c, world) {
  const d = Math.abs(c.tile.x - world.holder.x) + Math.abs(c.tile.y - world.holder.y);
  return {
    tired:      norm(world.clock.hour, 16, 22),   // in-game hour, never Date
    holderNear: norm(d, 8, 1),                    // 1 tile away -> 1
    bond:       norm(c.bond ?? 0, 0, 100),        // existing pet value, read only
    bored:      norm(c.idleTicks, 0, 20),         // in-memory counter
  };
}

function scoreOption(opt, facts) {
  const n = opt.cons.length;
  if (!n) return opt.weight;
  let prod = 1;
  for (const c of opt.cons) prod *= curve(c.curve, facts[c.fact] ?? 0, c.p);
  // Compensation: more considerations should not drag the score down on their own.
  const make = (1 - prod) * (1 - 1 / n);
  return opt.weight * clamp01(prod + make * prod);
}
```

Multiplying lets one near-zero factor veto an option. The compensation step stops options with many considerations from always losing.

## Selecting

```js
// Argmax with stickiness so the creature commits instead of flip-flopping on ties.
function pickBest(options, facts, current, sticky = 0.05) {
  let best = null, bestS = -Infinity;
  for (const o of options) {
    const s = scoreOption(o, facts) + (o.id === current ? sticky : 0);
    if (s > bestS) { bestS = s; best = o; }
  }
  return best;
}

// Seeded weighted-random among the top few: variety without silly picks.
function pickWeighted(options, facts, rng, topN = 3) {
  const scored = options.map(o => ({ o, s: scoreOption(o, facts) }))
                        .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, topN);
  let roll = rng() * scored.reduce((t, x) => t + x.s, 0);
  for (const x of scored) if ((roll -= x.s) <= 0) return x.o;
  return scored[0]?.o ?? null;
}
```

## Battle opponents

Score each move on facts the holder can read off the screen: own HP %, target HP %, type match, whether a heal is available. Keep the opponent fair and readable.

```js
function battleFacts(foe, target, move) {
  return {
    hurt:     1 - foe.hp / foe.maxHp,
    finisher: norm(target.hp, target.maxHp * 0.5, 0),       // low target HP -> 1
    match:    norm(effectiveness(move, target), 0.5, 2),
    isHeal:   move.heals ? 1 : 0,
  };
}
// Options = the foe's moves; cons come from data per opponent tier (easy, normal).
// Easy tier: pickWeighted with topN 3. Normal tier: pickBest. Same seeded rng.
```

Telegraph intent where Design asks for it (a short line before a big move). Never let a tier read hidden state the holder cannot see.

## Small behavior trees

Status is one of three strings. Nodes are plain objects built once at spawn; ticks allocate nothing.

```js
const OK = 'ok', FAIL = 'fail', RUN = 'run';

const seq = (...kids) => ({ i: 0, tick(n, f) {            // AND: stop at first non-ok
  for (; this.i < kids.length; this.i++) {
    const s = kids[this.i].tick(n, f);
    if (s !== OK) { if (s === FAIL) this.i = 0; return s; }
  }
  this.i = 0; return OK;
}});
const sel = (...kids) => ({ i: 0, tick(n, f) {            // OR: first non-fail wins
  for (; this.i < kids.length; this.i++) {
    const s = kids[this.i].tick(n, f);
    if (s !== FAIL) { if (s === OK) this.i = 0; return s; }
  }
  this.i = 0; return FAIL;
}});
const cond = test => ({ tick: (n, f) => test(n, f) ? OK : FAIL });
const act  = run  => ({ tick: (n, f) => run(n, f) });    // returns OK, FAIL or RUN
const cooldown = (secs, kid) => ({ until: 0, tick(n, f) {
  if (f.now < this.until) return FAIL;
  const s = kid.tick(n, f); if (s === OK) this.until = f.now + secs; return s;
}});
```

Example: a Keeper NPC who runs a shop counter inside a building.

```js
// Stays at the counter; greets once per visit; otherwise tidies nearby shelves.
const shopCounterTree = sel(
  seq(cond((n, f) => f.dialogOpen), act(() => RUN)),                 // talking: hold still
  seq(cond((n, f) => f.holderJustEntered),
      cooldown(30, act((n) => { bark(n, 'greet'); return OK; }))),   // chatter skill picks the line
  act((n, f) => tidyStep(n, f)),                                      // RUN while walking, OK when done
);
```

`f.now` is in-game seconds from the clock. A `RUN` leaf resumes next tick; don't restart it from the root. Reset a branch only when a higher branch takes over.

## Hybrid: a tree leaf asks the scorer

```js
const chooseIdle = act((n, f) => {
  const opt = pickBest(DATA.creature_wander.options, creatureFacts(n, f.world), n.doing);
  if (opt && opt.id !== n.doing) { n.doing = opt.id; startDoing(n, opt.id); }
  return RUN;   // the chosen activity runs; the tree re-asks on the next decision tick
});
```

## Schedules: choose inside a slot, never across

The D378 row decides *where* (diner, court, school, 5B). Scoring may choose *what* inside that spot.

```js
// row.at = 'diner' from the schedule; options are spots inside the diner only.
function pickSpotInSlot(npc, row, facts, rng) {
  const spots = DATA.spots[row.at].filter(s => !s.taken);  // occupancy check
  return pickWeighted(spots, facts, rng) ?? DATA.spots[row.at].fallback;  // never stall
}
```

Always keep a fallback spot or routine so an NPC never freezes when every option scores zero.

## Pitfalls

- Letting a score move an NPC to another map or schedule spot. That is the schedule's job, off-screen.
- Un-normalized facts. Every consideration returns 0..1.
- Jitter on near-ties. Add stickiness to the current option.
- Restarting a `RUN` leaf every tick from the root.
- Building nodes, closures or arrays inside `tick`. Build at spawn.
- Saving decision state "so it persists". It doesn't: in memory or derived only.
- Unseeded `Math.random()`. Tests stop repeating.
- Deciding every frame on a slow phone. Use a slow tick or events.
- Opponents that read hidden state, or no variety at all on the easy tier.

## Credits

Based on the `ai-behavior-trees-utility-ai` skill (SKILL.md and `references/utility-ai-system.md`) from awesome-gamedev-agent-skills, https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/ai-behavior-trees-utility-ai. Copyright 2026 Abhishek Barali and the awesome-gamedev-agent-skills contributors. Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0); keep the upstream LICENSE and NOTICE with this file. Modified: rewritten in JavaScript for Walklings (C# replaced with plain JS, engine sections removed, examples replaced with Walklings creature, battle, Keeper NPC and schedule-slot cases).
