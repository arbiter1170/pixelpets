---
name: walklings-battle-anim
description: >-
  Use when adding or tuning a Walklings battle move animation or hit feel
  (MOVE_FX rows, charge, travel, hit-stop, shake, white frame, damage number) in
  mv_fx.js and drawBattle; covers the data rows, four-beat timing, step queue
  and FULL/CALM/OFF rules.
---
# Walklings battle animation (MOVE_FX)

Built in three waves: MOVES_V2 punch (per-type timing, 334410a), MOVE_FX_2 pilot (12 starter moves, PR #225, D825-D832), MOVE_FX_3 (32 more moves, Answerer hum, Echo flourishes, PR #227, D903-D909). Read before touching `mv_fx.js` or the battle parts of `game.js`. General juice theory: gamedev-game-feel (this skill wins on conflict).

## When to use
- Giving a move its own look, or retuning a type's hit (stop, shake, knock, squash, white frame).
- Adding a new effect shape or a flourish beat (signature, Echo).
- Not for walk-map effects (AURA_FX) or cutscenes (walklings-dialog-npc-walk / walklings-cutscene).

## Where it lives
- `mv_fx.js`: all data and pure maths, no DOM.
  - `MV_PUNCH`: shared timing (`common`), `calm` and `off` rules, one row per type (`types.EMBER`...).
  - `MV_ANIM`: type look (`go`, `hit`, `mark`). `MV_MOVE`: bespoke rows by move id. `MV_ECHO`: flourishes by species.
  - `mvState(type, ms, variant, mode)`: pure time-to-pose (lunge px, squash, knock, shake, white).
  - `mvShape(seg, k, t, S, T, put)` draws one segment via `put()` into a fixed 24-slot `MV_POOL`.
  - Also `mvEndMs`, `mvScaled`, `mvVariant`, `mvFlashOk`, `mvYield`, `mvPose`, `mvHitRows`, `mvNum*`.
- `game.js`:
  - A move queues steps with `step(k, o)`: `go`, `text`, `windup`, `contact`, `sfx`, `stop`, `hp`, `num`, `knock`.
  - `play()` drains `battle.q`; `show(s, mode)` turns steps into `B.fx` entries and `B.punch` / `B.shake` / `B.white`.
  - `stepMs()`: windup 140 ms in FULL; stop = the type's `stop` (40 ms CALM, 0 OFF).
  - `drawBattle(t, dt)` reads `B.punch` via `mvState`, offsets sprites, draws live `B.fx` into the pool, then `mvPoolDraw` and `mvNumDraw`.
- Mode: `auraMode()` returns `full`, `calm` (Effects setting or prefers-reduced-motion) or `off`.

## The four beats (why it reads well)
1. **Charge** (`go`) on the user while "X tries Y!" shows. A bespoke charge lasts 1600 ms and `mvYield` cuts it when the wind-up starts, so it fills the line at any text speed.
2. **Travel** flies S to T inside the 140 ms wind-up and lands exactly at contact (ms 140); drawBattle rescales age `ta = age * 140 / dur`.
3. **Impact** (`hit`): the impact frame holds still through the hit-stop (`show('stop')` sets `hold0`/`hold1` and extends `dur`).
4. **Aftermath**: remaining hit rows (rise, fall, pillar, wave), knock-back and return, number rises 6 px.
- Anticipation: -2 px pull-back over 0-80 ms, strike to +6 px by 140 ms (per-move lunge 6-8 px); stretch [2,-1] on the attacker, squash on the target easing back over `squash.ms`.
- Shake: linear decay, sign flips every 40 ms, one axis per type (STONE y, EMBER x), whole pixels, max 4 px, applied as one `g.translate` around the battle draw only.
- One flash clock: `mvFlashOk` allows one white frame per 334 ms; super hit 80 ms, others the type's `white_ms`.
- Variety without random logic: `B.mvN` rotates three variants (`MV_ROT`). Every bespoke rect gets a 1 px `PAL.k` shadow (D826). PLAIN stays smallest so typed moves stand out.

## Data row (real, from MV_MOVE)
```js
"flick_flame": {"tier":2,"verb":"flicker","pose":{"lunge":7},
  "go":[{"ms":[0,240],"at":"user","shape":"orbit","n":3,"r":5,"turns":1,"b":2,"col":["o","y"]}],
  "travel":[{"ms":[0,140],"at":"path","shape":"flicker","n":4,"arc":3,"b":2,"col":["y","o","r"]}],
  "hit":[{"ms":[0,90],"at":"target","shape":"flare","r":4,"b":3,"col":["y","o"]},
         {"ms":[60,400],"at":"target","shape":"rise","n":5,"b":2,"col":["o","h"]}],
  "look":"a quick flame darts in low, a small flare, embers rise off the foe"}
```
Segment: `{ms:[a,b], at:'user'|'target'|'path'|'above', shape, n, r, arc, b (block px), col}`. Colours are `PAL` keys only (`sprites.js`), never hex. Status moves use `status` rows and `pose.lift` (max 1 px).

## Recipe
1. **Spec first.** Design writes `specs/MOVE_FX_<n>.md` with rows, look line and a checker (`move_fx_2_check.py`: peak slots <= 24, travel heads land within 0.7 px of T, every punch ends inside 700 ms). Reserve ids (walklings-decision-ids). Get Vincent's yes on **real-motion previews** (GIF/MP4, today beside new) before building.
2. Copy rows into `MV_MOVE` verbatim from the packet. Reuse a shape if possible; a new shape goes in `mvShape` and draws only through `put()`.
3. Caps: lunge 6-8 px, hop <= 2, lift <= 1 (`mvPose` clamps), shake <= 4, 24 pool slots, 700 ms per punch. Signature beat 200 ms; Echo flourish 240 ms, <= 8 rects, draws first.
4. In `doMove` change nothing except passing `mid` and `st`. Damage, rolls and text log stay.
5. FULL only. CALM keeps `mvMark` plus a 0.35 tint fade, no shake/knock/white. OFF keeps the old lunge, shake and one white frame. Fast-forward (`B.ff`) calls `snapAnim()`.
6. Test in `tests/move_fx_<n>.spec.js` at 320/375/390: read `battle.fxLog` (`mvGo:<id>`, `mvTravel:<id>`, `mvHit:<id>`) and `battle.view.sc/tc`; pin `B.rng`; use the game clock; no console errors; save still `pixelpets.save.v2`, `v` 2.
7. `python3 tools/bump_build.py`, PR via walklings-pr-handback with the spec-match table and checker line.

## Checklist
- [ ] Rows match the packet byte for byte; every colour is a PAL key.
- [ ] Travel lands at contact; impact holds through the stop; number and HP ghost start after it.
- [ ] Peak slots <= 24, no per-frame allocation (reuse `MV_SQ`, `MV_SH`, `MV_PTS`).
- [ ] At most one white frame per 334 ms; nothing strobes; reduced motion = CALM.
- [ ] Tap-to-skip works (`stepWait` -> `B.ff` -> `snapAnim`); animation never blocks input or changes state.
- [ ] 320/375/390 pass, no console errors, save unchanged.

## Pitfalls
- Moving code into a branch that never runs (P6k moved the crit spark into travel and crits lost it). Check each `fxLog` entry and each variant (normal, super, weak, crit).
- Stacking moves: without `mvYield` a new charge draws over an old hit and overflows the pool. One move draws at a time.
- Negative age: a number queued for next frame has `age < 0`; skip that frame, don't drop it (4c5d041).
- Timing flakes: read inside the solid window or freeze `battle.animMs`, not 300 ms in.
- Round every dx/dy (sub-pixel shimmers). Never shake the HUD or cards.
- No new sounds in a pilot (iPhone audio is red); reuse `chirp_<type>`, `notice`, `hit*`.
