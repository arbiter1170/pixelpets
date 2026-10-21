# Walklings quests: reference
Full detail for `SKILL.md` in this folder (moved verbatim). Read the section you need.

Use this when a session adds or edits a side quest, a town-board slip, or a bounty. The main story chain is already shipped. A new job hangs off to the side. Status docs for that change follow `.cursor/skills/walklings-docs/SKILL.md`. The skill index is `.cursor/skills/README.md`.

Town boards are scoped in `TOWN_BOARD.md`. Vincent settled the town-list D37 and D38–D49 on Oct 14, 2026. TB-1 is on main: empty boards, live reports, and the phone app, with no slips. The Hearthmoor and Fernbrook squares are on main too. Mahopac has a board and no slips. The first real slip is TB-3, Cald's gate count, and it is on this branch. Do not put a slip in Mahopac in that pass. The open table also has a D37, and that one is the region-map claim list, already in the game and still open. Do not renumber either D37.

## Read first

1. `quests.js` through `devCheck`. A step is `{ id, when?, done, text, place, target?: { map, x, y }, glimmer?: { text, place } }`. `CHAIN` is the shared main story. `SIDE_CHAINS` is independent chains. `sideCurrent` returns the first incomplete step of the first chain that has one. The phone chain is featured until `story.phone_got`, then Mom's dream (D27). A chain appended at the end stays hidden until every earlier chain is done, including Mom's last step `dream_study` (telling Ilse). `story.dream_woke` is only the step before that. Board pins must not be inserted into that list. They are a separate list, drawn in the same blue. D40 is settled: at most three, latest on the map, all of them on the phone.
2. `OPEN_DECISIONS.md`. The next free D id is named in the OPEN_DECISIONS.md header. D37 is already used twice (the region-map row, and the town-board list). D50–D55 are the Lantern Council. D56 is the welcome-back line. D57 is clearing a nickname. D58 is Ilse's lodge speech. D59 is the Route 1 explore line and the Keeper1 stop. D60 is Fen's second talk. D61 is the Hall line against the Heights quest after a Glimmerwell pledge. Do not insert a new row under an existing number. Settled rows move to Settled with the date and the call.
3. `TOWN_BOARD.md` if the work touches a board, a square, the Town Board app, a slip, or a bounty.
4. One real side quest before inventing a shape. Phone grant: `data/civic.json` `phone_grant`. Officer Ness stands on Route 1 and the scene runs when you talk to him, or after a few steps that do not close the distance (`catch` on `r1_ness`). Mom: `mom` in `data/interiors.json` and `mom_hello` in `data/mahopac.json`. Copy Mom for a new accept. Ness's catch is the shipped exception. New accepts are conversations.
5. `game.js` `execStep` and `drawObjectiveCue`. A quest does not need edits there. Main chevron is `PAL.y` (`#ffcd75`). Side and board chevrons are `PAL.c` (`#41a6f6`). Same tile shifts 7px.
6. `tests/README.md`, `tests/helpers.js` (`starterSave`, `installSave`, `playScene`, `trackErrors`), and `tests/civic.spec.js` or `tests/mahopac.spec.js`.
7. `tools/gen_mapdata.py`. After any `data/*.json` edit, run `python3 tools/gen_mapdata.py`. Do not hand-edit `data/mapdata.js`. A new JSON file joins the `names` tuple or the game never sees it. Merge order is maps_slice, interiors, act1_route2, cobblecrest, glimmer_path, mahopac, highcharity, heights, civic. A town-board file, when it exists, is last.
8. `save.js`. Format stays `pixelpets.save.v2` with `v: 2`. New story flags are keys on `S.flags`. `normalizeV2` keeps them. Do not add a migrator or a new localStorage key. `tools/bump_build.py` stamps the site cache id, which is not the save. `npm test` runs `bump_build.py --check`. A JSON-and-spec quest does not need a new build id unless `index.html` or a script tag changed.

## Steps a quest may use

| Step | Shape |
|---|---|
| `say` | `["say", speaker, text]`. `""` is narration. |
| `choice` | `["choice", prompt, [[label, steps, tag?, when?], ...]]`. Label ≤ 30. `when` hides the option. |
| `if` | `["if", cond, thenSteps, elseSteps]` |
| `setFlag` | `["setFlag", "story.flag", true]` |
| `inc` | `["inc", "story.flag", n]` |
| `give` | `["give", itemId, n]` |
| `bond` | `["bond", n]` |
| `sfx` | `["sfx", name]` |
| `warp` | `["warp", map, x, y, facing]` |
| `run` | `["run", sceneId]` |
| `battle` | `["battle", trainerId]` only when that trainer already exists |
| `rest`, `respawnHere` | only when the quest is a rest |

Leave `nameEntry`, `showBasket`, `givePet`, `pledge`, `standing`, `payRest`, `lookPick`, `play`, `push`, `spot`, `encounter`, `seal`, and `chirp` to the systems that own them.

Scene conditions (`game.js` `cond()`): `flag`, `!flag`, `flag=value`, `flag>=n` and the other inequalities (unset is 0), `seal:id`, `has:name`, `talked`. `standing.keepers>=2` compares tier, not points. Quest `when` / `done` go through `PPQuests.evalCond` only: `!flag`, `pets>=N`, `seal:id`, `flag=value`, and a truthy flag. A side-chain `when` of `story.x>=2` does not work.

NPC lines: first matching key wins. `"!story.flag": "@sceneId"` runs the scene. `"else"` is the fallback. Chatter and toasts ≤ 40 characters. A `say` body ≤ 110, no double space, straight quotes, `...` for a trailing beat. Tokens allowed in scenes: `{name}` `{player}` `{pet}` `{species}` `{type}` `{suggest}` `{rival}` `{rivalType}`. Quest `text` and `place` allow no tokens. `text` ≤ 110, `place` ≤ 24 (`LINE_MAX`, `PLACE_MAX`).

Flags: `story.<snake_case>`. One sentence in that file's `flags` object. Every `story.*` a scene writes is a `done` flag on `CHAIN` or `SIDE`, or listed in `NOT_STEPS`. Otherwise `PPQuests.devCheck` fails boot. Do not rename a flag that already ships.

## Side quests and board slips

Optional story work is a new array inside `SIDE_CHAINS`, or a later step on an existing side chain. Implication runs only inside that array. `CHAIN` is one shared list for both pledges. The last row `end` has `done: []` and stays last.

A board slip, once D39 and D40 are settled, follows Mom:

- The posting and the phone row set `story.board_<id>_pinned` only. The button says "Go see them."
- The NPC `lines` key `!story.board_<id>_yes` is `@sceneId`.
- The yes branch is the only writer of `story.board_<id>_yes`. The decline branch sets nothing.
- The blue marker points at the NPC until they have asked. A later step may move it.
- The slip's words are the NPC's. They do not become a Keepers contract or a Glimmerwell contract when the town's sleeve changes. Cobblecrest after `story.quarry_bought` may sticker the frame. The ask stays.
- Rewards are Acorns, a snack, bond, or a journal line. No Standing grant.

A bounty is a slip whose later step is a creature. The first marker is still the poster. Do not add a battle-end hook as part of an ordinary slip. D47 owns that.

`@glimmer` scene variants must `setFlag` every `story.*` flag the base scene sets. Prefer one sentence that is true on both pledges for board slips. The board's propaganda follows town control, not `story.side`.

## Tests

Add `tests/<feature>.spec.js`. `trackErrors(test, expect)`. Seed with `starterSave()`, `installSave`, `gotoGame(page, '?debug=1')`. Set the flags that make the step reachable. Assert the side row or the board pin, play the scene with `playScene`, assert the new flag, and assert `PixelPets.quest.id` did not change. Assert `PixelPets.state.v === 2` and `PixelPets.questCheck` is `[]`. Add a row to `tests/README.md`. One viewport is enough unless the panel layout changed. `npm test` is the full gate.

## Done

- Every new `story.*` flag is in the data file's `flags` map, and is a `done` condition or a `NOT_STEPS` entry with a reason.
- `PixelPets.questCheck` is `[]` after `python3 tools/gen_mapdata.py`.
- The yellow and blue chevrons are unchanged in color.
- Acceptance is the NPC's yes. A sign, a phone row, or a board posting does not set the yes-flag.
- KeeperUAV's jobs pane still ends with "No jobs are open. The desk is warming up." The two lines above it stay the Fernbrook lantern check and the Route 2 lamp count. Botnet still says the shelf is empty, the augment slot is empty, and "Jobs: none posted. Come back later." `hq_lumen` still says KeeperUAV's board is blank.
- `CHAIN` ids, order, `done` flags, glimmer overrides, and `end.done === []` are unchanged.
- The spec passes, `tests/README.md` has a row, and the spec asserts save `v` is 2.
- Guessed copy has an Open row: number, area, the decision, what the build does today, and the file to edit.

## Refuse

- Rewriting `CHAIN` because a side quest is nearby.
- Inventing faction jobs, KeeperUAV listings, Botnet listings, or Standing grants to fill a board.
- Bumping save `v`.
- Shipping guessed dialogue with no `OPEN_DECISIONS` row.
- Hand-editing `data/mapdata.js`.
- Accepting a new quest from a walk trigger. `phone_grant` is Officer Ness's talk, plus his `catch` if the player walks past. New accepts follow Mom.
- Wiring a slip, a bounty, or a square while the blocking D-row is still open.
