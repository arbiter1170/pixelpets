---
name: walklings-dialog-camera
description: >-
  Use when a Walklings scene should feel framed or "zoomed in" while people talk
  (ROOM_ZOOM interiors, the D171 speaker nudge, curtain bars, 4x portraits), and
  before proposing any new camera move during dialogue.
---
# Walklings dialogue camera

**What exists today.** No step zooms the camera mid-line. A talk looks zoomed in because four pieces work together:
1. **ROOM_ZOOM** (D231-D239, PRs #102, #110): interiors draw at a bigger whole-number scale.
2. **Speaker nudge** (D171, b7ffb5a): the camera slides a short way so the speaker is never under the text box.
3. **Curtain bars** (INTRO_CUTSCENE D803, PR #213): 24 px `PAL.k` bars ease in top and bottom of the drawn room.
4. **Big portraits** (D800): the speaker's own sprite drawn 4x (72x72 CSS) in the text box.
Use these before building anything new. A true zoom during a line is a new feature (last section).

## Where it lives (game.js)
- `fitAll()` sizes `#mapCanvas`, calls `roomZoomFor(W, H, s)`, then `syncWalkCam()`.
- `roomZoomFor`: `S = max(s, min(2s, floor(W / ((MW - slack) * 16)), floor(Heff / (MH * 16))))`. Whole numbers via `floor`; rooms with `fitWidth` skipped; in Modern `Heff` subtracts the 112 px HUD (`ROOM_ZOOM_HUD`); `hc_apt_in` capped at 2 at 320.
- Scale changes only in `arriveAt` -> `fitAll`, at the black midpoint of the 250 ms warp fade (`warpTo`, D235). The player never sees a scale tween.
- `chooseSceneBox(who)` per line: `findSpeaker`, measure `speakerScreenRect`; if the box covers the speaker try `#ovScene.top`; if still covered `setCamBias(biasForSpeaker(o))`, putting the speaker's feet 40% down the clear band.
- `tickCamBias(t)` eases `walk.camBias.y` over 150 ms, ease-out quad `e = 1 - (1-k)^2`. `syncWalkCam` adds the bias **before** the map clamp, so no void shows. `clearCamBias()` at scene end; reduced motion jumps straight there.
- Curtain: `cutCurtain(on, snap)` sets `from/to/t0`; `cutCurtainK()` is the same ease-out quad over 250 ms; `drawCurtain()` runs inside `drawMap` **under the actors**, so walkers cross in front.
- Portraits: `sbRender(who, text, box, asHolder)` reads `PORTRAIT_FOR[scene.id]` (cutscene file `"portraits"`), draws `keeperFrames(look).right[0]` on the 18x18 canvas; `.sbox.has-big` scales it with CSS.

## Recipe: frame a talk
1. **Pick the room.** Indoors gets ROOM_ZOOM free. Check the scale at 320/375/390 (`mapZoom`). Actors stand on tiles the room draws; the door mat is in the dark bottom wall row (D871).
2. **Let the nudge work.** Place the speaker where the box can clear them. Never add a fixed per-scene camera offset.
3. **Curtain bars** for a staged stretch, in the cutscene file:
```json
{ "before": ["say", "", "The door bangs open. Rook skids in, out of breath."],
  "steps": [["curtain", "on"], ["castAt", "rook_lodge", 5, 7, "up"], ["sfx", "notice"], ["wait", 200]] }
```
   Turn off with `["curtain", "off"]` after the last staged line; `cutReset` also clears them.
4. **Big portraits:** `"portraits": { "Warden Ilse": "sprite", "Rook": "sprite", "$player": "sprite" }`. The holder's follows `shownLook()`. Hand-drawn busts need Vincent first (earlier ones were turned down as off-style).
5. **Test** at 320/375/390: speaker rect never overlaps `#sbox`; read `cutCurtainK()` after each beat; no fractional camera values under reduced motion; no console errors; save still `pixelpets.save.v2`, `v` 2.

## Checklist
- [ ] Scale is a whole number or a crisp Map zoom step, changed only behind a fade.
- [ ] Camera stays clamped; no void except where the room is smaller than the view (black, D236).
- [ ] Every tween 150-250 ms ease-out quad; snaps under reduced motion or SKIP.
- [ ] Tap hit-test correct: canvas bitmap px plus camera at room scale (D239).
- [ ] 44 px buttons clear; bed and walls clear the Modern button column at 320.

## A new zoom during dialogue (not built)
A push-in on a line (e.g. `["camera", "zoom", 3]`) is a new step kind and needs a decision: staging every player sees is red, camera is yellow (walklings-decision). It must:
- change scale behind a cut or fade like `warpTo`, or in whole steps only (a scale tween on canvas px shimmers);
- recompute `fitAll` so tap hit-test, `hudFree` and `syncWalkCam` agree (D239);
- restore in `cutReset`; SKIP and reduced motion jump to the end; respect the Map zoom setting and never save it;
- be prototyped on a patched copy of main with previews at 320/375/390 before building.

## Pitfalls
- Bias added after the clamp shows the void; add it before, as `syncWalkCam` does.
- 1 px camera flakes: HUD pads re-measure when the clock chip changes width (46f0b73). Tests allow 1 px or wait for `document.fonts.ready` -> `fitAll`.
- Scaling a `fitWidth` room (Arbiter Bay keeps width fit); skipping the Your Room cap at 320.
- Shake on the map camera. Battle shake is a draw offset in `drawBattle` only.
