---
name: walklings-quests
description: |
  Use when adding or changing a Walklings side quest, town-board slip, bounty, or phone job pointer in this repo.
  Read quests.js SIDE_CHAINS, the matching data JSON, TOWN_BOARD.md, and OPEN_DECISIONS before writing.
  Keep the work off the main CHAIN, accept it by talking to an NPC, and leave the save at v2.
  Regenerate mapdata, add a Playwright spec, and put guessed copy in an OPEN_DECISIONS row.
---

# Walklings quests

Side quests, town-board slips and bounties hang off `SIDE_CHAINS`; the main `CHAIN` is shipped and stays untouched. Full detail (step shapes, conditions, line limits, D ids, slip rules, test recipe): `REFERENCE.md` in this folder. Status docs: `walklings-docs`.

## Before writing
- Read `quests.js` (through `devCheck`), the matching `data/*.json`, `OPEN_DECISIONS.md` (next free id is in its header; D37 is used twice, never renumber), and `TOWN_BOARD.md` for board work.
- Copy Mom (`mom` in `data/interiors.json`, `mom_hello` in `data/mahopac.json`) for a new accept. Accepts are conversations, never walk triggers (Ness's `catch` is the one shipped exception).
- Don't wire a slip, bounty or square while its blocking D-row is open. TB-3 (one slip, Cald's gate count) is the first real slip; no Mahopac slip in that pass.

## Must hold
- Save stays `pixelpets.save.v2`, `v: 2`; new flags are `story.<snake_case>` keys on `S.flags`, each listed in the file's `flags` map and a `done` flag or a `NOT_STEPS` entry, or `devCheck` fails boot.
- Only the NPC's yes branch sets `story.board_<id>_yes`; a posting or phone row sets `_pinned` only. Rewards: Acorns, a snack, bond or a journal line; no Standing grants, no invented faction/KeeperUAV/Botnet jobs.
- Lines: `say` <= 110, chatter/toasts <= 40, choice labels <= 30, quest `text` <= 110, `place` <= 24, no tokens in quest text. Run `walklings-wording-check`.
- Single tap only (Vincent's rule, D268): accepting, advancing each line, picking a choice and opening a phone or board pointer each take one tap. Nothing needs a hold, drag, swipe, pinch or double-tap. Choice buttons stay at least 44 px tall at 320, 375 and 390, and a decline such as "Not right now" leaves the step open, with no dead end.
- `@glimmer` variants set every flag the base scene sets. An untracked main cue stays `PAL.y` (`#ffcd75`). A slip stays `PAL.c` (`#41a6f6`). The tracked quest, main or side, is `PAL.l` (`#a7f070`) with a `PAL.k` edge and pennant (D436). Untracked chains stay dim blue.
- After any `data/*.json` edit: `python3 tools/gen_mapdata.py` (new files join its `names` tuple); never hand-edit `data/mapdata.js`.

## Done
New `tests/<feature>.spec.js` (seeded save, `playScene`, asserts the new flag, `PixelPets.quest.id` unchanged, `state.v === 2`, `questCheck` `[]`), a `tests/README.md` row, `npm test` green, and an Open row for any guessed copy.
