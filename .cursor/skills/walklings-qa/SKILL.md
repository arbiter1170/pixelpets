---
name: walklings-qa
description: |
  Use after a Walklings feature lands, or when asked to play the game and look for broken dialog, missing quest info, pacing, phone layout, or missing art.
  Play the new path on a phone width, then add a Playwright check for each break you fix.
  Leave save v at 2. Do not renumber a Q or D id.
---

# Walklings QA

Use this after a feature is in the game, and when a session is asked to play from a point in the story and take notes. The specs in `tests/` are the checks that stay. This skill is how a new check gets added. Status docs for a fix follow `.cursor/skills/walklings-docs/SKILL.md`.

## Play

1. Serve the repo (`python3 -m http.server 8080 --bind 127.0.0.1`) and open `/?debug=1` in Chromium at 390×844 and at 320×568 (`isMobile`, `hasTouch`). Debug is only for ending a battle (`PixelPets.winBattle`) and reading `PixelPets.quest`. Walk, talk, and open panels yourself.
2. Start from a new game when the change is in the opening, the phone, the bag, or the faction pick. Otherwise seed a v2 save that stops one step before the new beat, then walk in.
3. For a Glimmerwell pass, pledge with Tobin at the orchard gate (`side_pick`). Play the scene that follows, open NEXT STEP and the walk tip, open the bag, open PHONE (CRACK//HAND), then try the Hall door and one Heights beat (Kit, or Nia in the RegenX lobby).
4. Write down every line you see. Flag `PLACEHOLDER`, a leftover `{token}`, a double space, a line over 110 characters, a speaker named `unnamed`, and a quest line that disagrees with the last thing an NPC said.
5. On each screen, check that the primary button is inside the viewport without scrolling, taps are at least 44 CSS px, and the console has no error. A toast sitting on a choice or a CLOSE button is a note.

## Add a check

When a break is fixed, add the assertion to `tests/qa_play.spec.js` or the spec that already owns that screen. Use `starterSave`, `installSave`, `gotoGame(page, '?debug=1')`, and `trackErrors`. Assert `PixelPets.state.v === 2`. Assert `PixelPets.questCheck` is `[]` when the change touched quest flags. One width is enough unless the layout changed; the look picker and the phone shell are checked at every project width.

Name the new row in `tests/README.md`. A player-visible fix also updates the README section that already describes that screen, `CHANGELOG.md`, and `OPEN_DECISIONS.md` when the words are still a guess. The next free decision id is one past the highest row. Do not reuse D60 or D61.

## What to watch

| Surface | Check |
|---|---|
| Walk tip | It matches `PixelPets.quest.text` once the story has moved past the first wild. Skipping that wild must not freeze the tip on the east gate. |
| NEXT STEP | MAIN and SIDE agree with the NPC you just left. SIDE stays Mom's chain after the phone is issued. It does not name Keeper1 (D59). |
| Bag | Opening it with Keeper1 and a Cracked Handset does not throw. Key items show their note and have no USE button. |
| Phone | Hidden until `story.phone_got`. After a glimmer pledge the shell is CRACK//HAND, jobs say BOTNET, and Notes are signed Handset. The shell fits 320 and 390. |
| Look picker | DONE is on screen at 320×568. The name row stays hidden. Ilse asks the name. |
| Glimmer pledge | `know_us@glimmer` runs the orchard in the same scene. Tobin then points at the Hall. The Hall says the tour waits. The quest points at the Heights. That split is D61. Do not rewrite it in a QA pass. |
| Fen | A second talk before the orchard is cleared is one line, not her intro again. The line is D60. |
| Art | RegenX lobby is a bare brick room. Tour stops and board reports are still marked placeholder (D26, D49). Phone icons for the two handsets are stand-in grids. |

## Done

- The new spec passes under `npm test`.
- A fixed player-facing line is named in `tests/README.md` and `CHANGELOG.md`.
- Guessed copy has an Open row.
- Save `v` is still 2.
