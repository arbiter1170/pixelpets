---
name: gamedev-game-ai
description: >-
  Use when building Walklings NPC routines, wandering creatures, followers,
  battle opponent move choice or tile pathfinding in the browser vanilla-JS
  game; walklings-* skills win on conflict.
---
# Game AI: decide, path, move

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No game engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. AI adds no save fields: NPC state, paths and walks live in memory or are derived from existing flags. A new story flag is a quest change and goes through walklings-quests.
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- The player is a "holder" in all copy, comments and specs. Never use another title.
- "Keeper" is the faction and is always written with a capital K. Never write it in lowercase.
- Money is Acorns. Never use the banned currency word from walklings-wording-check.
- Design's packets, walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- Core-mechanic ideas this skill inspires are welcome, but raise them as a red decision to the PixelPets Supervisor, who takes it to Vincent (walklings-decision), and build nothing before he approves.

Keep three layers separate:
- **decide** what to do (state machine or scoring; see gamedev-npc-decisions for utility scoring and small trees)
- **path** how to route across the tile map
- **move** step along the path

On a top-down tile map with turn-based battles, the light versions are the right weight. Reach for a full behavior tree only if a state machine clearly stops scaling.

## Core workflow

1. **Pick the decision model by size.** Two to five clear states (idle, wander, walk-to, talk, sleep) call for a finite state machine. Picking a battle move from several options calls for weighted scoring.
2. **Separate decision from motion.** The decision outputs an intent (a target tile, a move id). The pathfinder and mover carry it out.
3. **Path on the tile grid.** Use A* over walkable tiles with 4-direction moves and Manhattan distance. Respect NPC and holder occupancy. This is for local movement (wander, follow, short walks within one map), not schedule moves.
4. **Follow the cached path** one tile at a time, and advance when the current tile is reached.
5. **Repath sparingly:** on a timer, or when the goal moves to a new tile or the next tile is blocked. Never every frame.
6. **Drive routines from the world clock, using our schedule rows.** NPC schedules are the D378 rows on the 42-minute in-game day, never `Date` or real-world hours. When a schedule changes, the NPC is simply placed at its new spot while the holder can't see it (on map load or while off-screen). **A schedule move is never shown on screen**: no walking across the map and no visible teleport. The one exception is a holder-triggered walk (below).
7. **Verify by watching with a debug overlay** (path tiles, current state). Check for agents stuck on corners, flipping between states, or blocking doors. Use a seeded RNG so Playwright runs are repeatable.

## Schedules and the holder-triggered walk

### Schedules from the world clock (shape only; the D378 rows are the real format)

```js
// Hours here are IN-GAME hours on the 42-minute day, read from the clock, never Date().
function scheduledSpot(rows, day, hour) {
  return rows.find(r => r.days.includes(day) && hour >= r.from && hour < r.to)?.at ?? rows.default;
}
// On map load, place each NPC at scheduledSpot(...). If the spot changes while the holder
// is on the same map, wait until the NPC is off-screen (or the next map load) to move it.
```

### The single on-screen exception: a walk the holder triggers

When the holder sets it off (for example sending Lizzy home to 5B), the NPC may walk on screen and the quest marker follows her. The rules:
- The walk lives **in memory only**. Nothing about it is saved.
- **Map change (D411):** if the holder follows her through a door, she carries on along her route on the next map; she snaps to the destination only when the holder goes somewhere off her route.
- **Blocked:** if her next tile is blocked, wait and re-route after 2 blocked steps; snap to the destination only when no route exists.
- It **pauses** during scenes and battles and resumes after.
- A **reload resets** it: she is placed by the schedule or quest state as usual.
- The marker reads her live tile each frame (including an edge arrow when she is off-screen); it stores nothing.

```js
let walk = null;   // { npc, path, dest } in memory only; never written to S
function startWalk(npc, destTile) {
  const path = findPath(npc.tile, destTile);
  if (!path) return snapTo(npc, destTile);          // blocked from the start
  walk = { npc, path, dest: destTile, blocked: 0 };
  questMarker.follow(npc);
}
function tickWalk(dt) {
  if (!walk || sceneOpen() || inBattle()) return;    // paused, not cancelled
  if (!followPath(walk.npc, dt, walk.path)) {
    if (isBlocked(nextTile(walk.npc))) {
      if (++walk.blocked < 2) return;                    // wait a step
      const p = findPath(walk.npc.tile, walk.dest);      // re-route after 2 blocked steps
      if (!p) return finishWalk(true);                   // no route at all: snap
      walk.path = p; walk.blocked = 0;
    }
    return;
  }
  finishWalk(false);
}
function finishWalk(snap) { if (snap) snapTo(walk.npc, walk.dest); questMarker.stop(); walk = null; }
onMapChange((map) => {                                  // D411: follow across maps
  if (!walk) return;
  if (routeContinuesOn(walk, map)) placeOnRouteEntry(walk, map);
  else finishWalk(true);                               // holder left her route: snap
});                                                    // reload: walk is simply gone
```

## Patterns

### Finite state machine

```js
const NPC_STATES = {
  idle:   { update(n, dt) { if ((n.idle -= dt) <= 0) return 'wander'; } },
  wander: { enter(n) { n.path = findPath(n.tile, randomNearbyTile(n, 3)); },
            update(n, dt) { if (followPath(n, dt)) { n.idle = 2 + rng() * 3; return 'idle'; } } },
  talk:   { update(n) { if (!dialogOpen(n)) return 'idle'; } },
};
function tickNpc(n, dt) {
  const next = NPC_STATES[n.state].update(n, dt);
  if (next && next !== n.state) { NPC_STATES[n.state].exit?.(n); n.state = next; NPC_STATES[next].enter?.(n); }
}
```

Transitions live inside states. Don't scatter `if (n.state === ...)` checks across `game.js`.

### Battle move choice by scoring

```js
function pickMove(foe, target, moves) {
  const scored = moves.map(m => ({ m, s: m.power * effectiveness(m, target)
                                     + (foe.hp < foe.maxHp * 0.3 && m.heals ? 50 : 0) }));
  scored.sort((a, b) => b.s - a.s);
  return rng() < 0.8 ? scored[0].m : scored[1]?.m ?? scored[0].m;   // seeded rng, slight variety
}
```

For curve-based scoring and opponent tiers, use gamedev-npc-decisions.

## Tile pathfinding notes

All of this is local movement inside one map. None of it is used to carry an NPC between schedule spots.

### The grid is the graph

Each walkable tile is a node; its neighbours are the 4 tiles up, down, left and right that are walkable and not occupied. Write one `neighbors(tile)` function and every search below reuses it.

```js
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const key = (x, y) => y * map.w + x;   // numbers, not strings: cheaper on phones
function neighbors(x, y) {
  const out = [];
  // Flip direction order on alternating tiles so ties zigzag instead of making one big L.
  const order = (x + y) & 1 ? DIRS : [...DIRS].reverse();
  for (const [dx, dy] of order) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < map.w && ny < map.h && walkable(nx, ny)) out.push([nx, ny]);
  }
  return out;
}
```

### Which search for which job

- **BFS**: every step costs the same, and you want distances from one tile to *every* tile. Cheap and simple.
- **Dijkstra**: like BFS but tiles have costs (sidewalk 1, grass 2, flower bed 5). Use it when NPCs should prefer paths.
- **A***: one start, one goal. Dijkstra plus a guess of the remaining distance so it searches toward the goal. The default for "walk to that tile".
- **Distance or flow field**: many walkers heading to the same tile. Run BFS or Dijkstra once *from the goal*; each walker then steps to the neighbour with a lower distance. One field per destination (the diner door, the court), shared by every walker going there.

### A* with tile costs and early exit

```js
function findPath(start, goal, maxNodes = 2000) {
  const g = new Map([[key(start.x, start.y), 0]]), from = new Map();
  const open = [{ x: start.x, y: start.y, f: manhattan(start, goal) }];
  let seen = 0;
  while (open.length) {
    open.sort((a, b) => a.f - b.f);                 // small maps: a sorted array is fine
    const cur = open.shift();
    if (cur.x === goal.x && cur.y === goal.y) return rebuild(from, cur);   // early exit
    if (++seen > maxNodes) return null;             // budget guard on slow phones
    for (const [nx, ny] of neighbors(cur.x, cur.y)) {
      const k = key(nx, ny), cost = g.get(key(cur.x, cur.y)) + tileCost(nx, ny);
      if (cost < (g.get(k) ?? Infinity)) {
        g.set(k, cost); from.set(k, cur);
        open.push({ x: nx, y: ny, f: cost + manhattan({ x: nx, y: ny }, goal) });
      }
    }
  }
  return null;   // no path: treat as blocked, never loop
}
```

Stop as soon as the goal comes off the open list; there is no need to explore the rest of the map. If maps grow, swap the sorted array for a small binary heap written in-house.

### Heuristics

```js
const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);  // 4-direction grids
// f = g + h. An h larger than the true remaining cost gives fast but non-shortest paths.
```

- With tile costs, scale the heuristic by the *cheapest* tile cost (usually 1) so it never overestimates.
- Manhattan is for 4-way moves. Only switch heuristic if Design adds diagonal moves.
- Many equal-cost routes exist on open ground. The alternating neighbour order above, or a tiny tie nudge (`h * 1.001`), makes paths look natural instead of hugging one edge.

### Tile costs

```js
// Costs come from data so Design can tune them; 0 or missing = not walkable.
const tileCost = (x, y) => DATA.tileCosts[map.tile(x, y)] ?? 1;
```

Keep costs small integers. Huge costs make A* explore widely before giving up.

### Flow field for crowds

```js
function flowField(goal) {             // BFS from the goal; rebuild only when the map changes
  const dist = new Int16Array(map.w * map.h).fill(-1), q = [[goal.x, goal.y]];
  dist[key(goal.x, goal.y)] = 0;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [nx, ny] of neighbors(x, y))
      if (dist[key(nx, ny)] < 0) { dist[key(nx, ny)] = dist[key(x, y)] + 1; q.push([nx, ny]); }
  }
  return dist;   // walker steps to any neighbour with dist one lower
}
```

### Reachability: no soft-locks

Label connected walkable regions once per map (a flood fill). If a quest target tile and the holder's spawn are in different regions, fail loudly in `devCheck` or a test: a quest target must always be reachable.

## Pitfalls

- Using real-world time (`Date`, wall-clock hours) for schedules. Read the game clock.
- Showing a schedule move on screen (an NPC walking across town or popping away in view). Only a holder-triggered walk may be seen.
- Saving anything about a holder-triggered walk, or resuming it after reload.
- Using A* to carry an NPC between schedule spots. A* is for local movement only.
- Pathfinding every frame. Cache the path and repath on events or a timer.
- No stuck check, so an NPC grinds into a wall forever. Add a timeout that forces a repath or idle.
- NPCs standing in doorways or on the only path. Reserve those tiles, or step aside when the holder approaches.
- Wrong heuristic for the move set, which returns non-shortest paths.
- No search budget, so one unreachable goal freezes a slow phone.
- Transition spaghetti: flags everywhere instead of states.
- Unseeded randomness in AI, which makes battles and wander paths impossible to test.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/game-ai), Apache-2.0. Changes: trimmed and adapted for Walklings; tile pathfinding notes added.
Pathfinding notes are written in our own words after the articles at Red Blob Games, https://www.redblobgames.com/pathfinding/a-star/introduction.html (credit: Amit Patel, redblobgames.com). No text or code was copied from them.
