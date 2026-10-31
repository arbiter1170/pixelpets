---
name: walklings-dialog-npc-walk
description: >-
  Use when an NPC, cast member, Walkling or the holder should walk, enter, leave
  or carry someone during a Walklings scene (walkTo, castAt, wait, prop, spot,
  approach); the engineer recipe for the data-driven cutscene runtime in
  game.js.
---
# Walklings: NPCs walking during dialogue

INTRO_CUTSCENE (PR #213, D799-D810, D871 fix in #218) staged the Warden's Lodge: Ilse steps forward and waves, the holder walks up the rug, Rook bursts in, runs to a basket and out with his Walkling. **A new cutscene is a data file; game code does not change.** If the repo's walklings-cutscene skill is present, it owns the process and gates and wins on conflict.

## Where it lives
- Data: `data/cutscene_<name>.json`. `tools/gen_mapdata.py` reads every `cutscene_*.json` (sorted) into `data/mapdata.js`.
- Splice at load: `game.js` loops `MD['cutscene_*']` and calls `applyStarterInserts(SCENES[C.scene], C.inserts, cutsceneMiss)`.
  - Each insert finds its anchor with `findAnchor`: the exact `say` / `choice` step, inside `if` and `choice` branches too.
  - Steps go `before` or `after` the anchor, or at `end`. A miss warns and lands in `cutsceneMiss`.
  - `vars` go to `CUT_VARS`, `portraits` to `PORTRAIT_FOR`.
- Runner: `execStep` dispatches `walkTo`, `wait`, `curtain`, `castAt`, `prop`. None is in `INTERACTIVE`.
- Runtime (`cutRT`, near "INTRO_CUTSCENE (D801-D809)"):
  - `cutPath(from, to, selfId, withId)`: 4-way BFS; walls and blockers stop it, the walker and its `with` partner don't; non-player walkers avoid the holder's tile.
  - `cutWalkTo(sc, who, x, y, {with, drop})`: calls `fxStop()` first, hides the box (`cutHold(true)`), steps tile by tile. NPCs move with `glideCast(moves, 120 / speed)`; the `with` partner follows one tile behind; `drop` removes both at the end (`dropCastIds`).
  - `cutStepPlayer(p, ms)`: the holder's own tween at `STEP_MS` (170 ms), needed because `frameBody` skips `updateWalk` while an overlay is open. It drives `walk.prog` and `walkLerp()`, so the camera follows.
  - `cutWait(ms)`: rAF loop on scaled time. `cutTap()` runs first in the scene tap handler: first tap `speed = 2`, second `end = true`.
  - `cutCastAt` uses `pushCast` with name and look from `SCENE_CAST[scene.id]`; `cutProp` swaps a sprite; `cutReset` restores props, curtain and box at scene end.
- Rendering: walkers are ordinary map objects. `drawMap` reads `mapRT.pos[id].fx/fy` every frame, so animation is just changing `fx/fy`; no separate render path.
- Older movers: `["spot", id]` (`!` for 600 ms then a straight walk at 255 ms a tile) and `["approach", id]` (BFS walk beside the holder, `pathBeside`). Both hide `#ovScene` and show it again on arrival. New movers build on `cutPath`/`cutWalkTo`; never add another tween.

## Data format (real, data/cutscene_intro.json)
```json
{ "spec": "INTRO_CUTSCENE", "version": "0.1", "scene": "starter",
  "portraits": { "Warden Ilse": "sprite", "Rook": "sprite", "$player": "sprite" },
  "vars": { "rivalBasket": { "key": "rival", "map": { "ember": [3,3], "tide": [5,3], "bloom": [7,3] } } },
  "inserts": [
    { "before": ["say", "Warden Ilse", "There you are. Come in. The baskets do not all stay still."],
      "steps": [["curtain","on"], ["walkTo","ilse_lodge",5,4], ["emote","ilse_lodge_any","emote_wave"], ["wait",300]] },
    { "after": ["say", "Warden Ilse", "There you are. Come in. The baskets do not all stay still."],
      "steps": [["walkTo","player",5,5], ["curtain","off"]] } ] }
```
- Steps: `["walkTo", who, x, y, opts]` (who = object id or `player`; x may be `"$var"` resolving to `[x,y]`), `["wait", ms]`, `["curtain", "on"|"off"]`, `["castAt", id, x, y, facing]`, `["prop", id|"$var", sprite]`, plus `emote` and `sfx`.
- `$var` maps key by the starter line, or its counter-pick when `"key": "rival"`. That key is an internal id only; player-facing text calls Rook a competitor.

## Recipe
1. Read the scene **as the game builds it** (lines pushed in game.js; STARTER_MOMENT inserts come first) and the real walk grid (a `=` can be a walkable rug). Copy each anchor exactly.
2. Write a beat sheet: per beat the anchor, steps, auto or tap, and what reduced motion does. Design compiles it.
3. Put every speaker and waiting actor on a tile the room draws. The door mat is only for arriving and leaving.
4. Keep walks short: 120 ms a tile NPCs, 170 ms the holder, a 200-300 ms `wait` after an entrance or emote.
5. `castAt` anyone not on the map yet and add them to `SCENE_CAST`; use `drop` on the exit.
6. `python3 tools/gen_mapdata.py`, load the game, check `cutsceneMiss` is empty.
7. Test in the scene's own spec at 320/375/390: actor tiles after each auto beat and on every line they speak; first tap x2, second ends; SKIP snaps walks but stops at choices, names and pickers; no fractional positions under reduced motion; no console errors; save unchanged. Take walk lengths from the compiled beat table.
8. `python3 tools/bump_build.py`, PR via walklings-pr-handback with the spec-match table.

## Checklist
- [ ] No new lines, sounds or flags unless the packet lists them; `say` <= 110 chars, choices <= 30.
- [ ] No staging step needs a tap; the tap layer stays; the text box hides during auto beats.
- [ ] SKIP and reduced motion: walks land in one frame, waits skipped, curtain cuts; emotes and portraits still show.
- [ ] Every path exists (`walkTo: no path` warns) and `cutsceneMiss` is empty.
- [ ] Save `pixelpets.save.v2`, `v` 2, no new field; tap only at 320/375/390.

## Pitfalls
- **Hop-in race:** a cast hopping in (castPartner, 280 ms) whose `settle()` fires mid-walk snaps the walker back. `cutWalkTo` calls `fxStop()` first; keep that in any new mover.
- **Speaking from the dark:** Rook first spoke from the door mat (5,8) in the dark bottom wall row (D871). Use (5,7).
- **Stale anchor:** an edited line silently skips its insert. Re-check `cutsceneMiss` after any text change.
- Moving the holder with `S.world` alone teleports them and jumps the camera; use `cutStepPlayer`.
- Hard-coding walk lengths in tests (the D871 fix made Rook's walk one tile shorter).
