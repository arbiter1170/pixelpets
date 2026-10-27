---
name: walklings-cutscene
description: >-
  Use when a Walklings scene should play as a staged cutscene (people walk in or
  out, a pause, curtain bars, portraits in the text box), or when building or
  reviewing a cutscene packet. Covers the order of work, the gates, the data
  file the game reads and what every cutscene must keep.
---
# Walklings cutscene

A cutscene is an existing scene (`SCENES`, the `say` / `choice` step lists) with staging spliced in: people walk, pause, enter and leave, and curtain bars frame the staged stretch. The first one is the Warden's Lodge scene (INTRO_CUTSCENE). Design's cutscene kit and the full process map live in the private design repo; this skill is the public outline.

## Order of work

1. **Read the scene as the game builds it**, not from the data file alone: lines pushed in `game.js` and STARTER_MOMENT-style inserts change it. Read the room's real walk grid too (a `=` can be a walkable rug).
2. **Brief first** (AGENTS.md rule 9 spirit, and rule 9 itself for any room change): a sub-agent writes the mood, references in words and poses. Reference only; pixels come from `PAL` in `sprites.js`.
3. **Reserve ids** with `walklings-decision-ids`. Staging a scene every player sees is red (rule 3); step kinds, camera, curtain and box layout are yellow; the rest green (`walklings-decision`).
4. **Beat sheet**: each beat names its anchor (an existing step, matched exactly), its steps, auto or tap, and what reduced motion does. Design's kit compiles it into the data file and the packet's tables, checks every anchor sits once, every walk has a path and every line passes `walklings-wording-check`.
5. **Previews** at 320, 375 and 390 from a patched copy of main (never a mock-up drawn by hand), plus a storyboard. Vincent sees them before anything builds.
6. **Packet** in Design's specs with its checker; then the Supervisor, then Vincent for the red rows.
7. **Build** (engineer): copy `specs/cutscene_<name>.json` to `data/cutscene_<name>.json`, run `python3 tools/gen_mapdata.py`, add the packet's tests, `python3 tools/bump_build.py`, PR via `walklings-pr-handback` with the spec-match table.

## The data file (once the INTRO_CUTSCENE runtime is on main)

`data/cutscene_<name>.json`: `{ "spec", "version", "scene": "<scene id>", "vars": {...}, "portraits": {...}, "inserts": [{ "before" | "after": <step>, "steps": [...] } | { "end": true, "steps": [...] }] }`. Every `cutscene_*.json` is read by `gen_mapdata.py` and spliced into the scene it names after STARTER_MOMENT's inserts. A missed anchor is skipped and listed in `cutsceneMiss`. No game code changes for a new cutscene.

Staging steps: `["walkTo", who, x, y, {with, drop}]` (who: an object id or `player`; x may be a `"$var"`), `["wait", ms]`, `["curtain", "on" | "off"]`, `["castAt", id, x, y, facing]` (name and look from `SCENE_CAST`), `["prop", id, sprite]`. None takes a tap.

## Every cutscene keeps

- No new lines unless the packet lists them (`say` <= 110 chars, choices <= 30, single tap, D268); no new sounds (iPhone audio is red); no new flags unless they are CHAIN or `NOT_STEPS` flags; no forced battle.
- Save stays `pixelpets.save.v2`, `v` 2, no new field.
- Auto beats hide the text box but keep the tap layer: one tap doubles the pace, a second ends the beat. SKIP snaps every walk and wait and still stops at choices, names and pickers.
- Reduced motion (and SKIP): walks land in one frame, waits are skipped, the curtain cuts. Emotes and portraits still show (D477).
- Tests: actor tiles after each auto beat, tap and SKIP timing, no fractional positions under reduced motion, `cutsceneMiss` empty, no console errors at 320, 375 and 390, save unchanged.
- Cite another packet by name, never by its decision ids.
