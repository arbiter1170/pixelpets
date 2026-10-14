# Branch log

Recorded when the split lines were brought onto `main` (Oct 14, 2026). GitHub had marked several pull requests merged because each merged into the previous feature branch, not into `main`. Squash merges also mean the original commit ids are not ancestors of `main` even when the work is there.

The remote branches were left in place. This file is the map of what each one held.

## Landed onto `main` in this pass

These commits were only on `origin/cursor/keeper-hq-phone-0bb2` (tip `46113b2`). Earlier pulls in that stack had merged into each other.

| Branch | Tip | What it held | Where it is now |
|---|---|---|---|
| `cursor/keeper-hq-phone-0bb2` | `46113b2` | Keeper House, town officers, Keeper1 phone, Ribbit, the open east gate, and everything below it | `main` |
| `cursor/export-save-before-start-over-0bb2` | `4a8837e` | Save a copy before Start over, plus the Act 1 stack under it. PR #14 merged into the feature line. PR #16 (Keeper House) was opened from a later tip | `main` |
| `cursor/builds-4-6-glimmer-act1-0bb2` | `d21ffb3` | Glimmer Route 2, Cobblecrest Sacrifice stub, Rook's closer, Heights. PR #13 merged into the feature line | `main` |
| `cursor/next-builds-after-b3-0bb2` | `6296026` | The same Builds 4–6 chain, plus the "name the next three builds" note. PR #10's doc-only squash is also on `main` as `abe0487` | `main` |
| `cursor/heights-group-tests-0bb2` | `c292a6e` | Group-battle tests and Standing on Heights beats. PR #12 merged into the feature line | `main` |
| `cursor/fernbrook-heights-quests-0bb2` | `71747dc` | Fernbrook Heights quests, art, and the story bible. PR #11 merged into the feature line | `main` |

Decision ids D27–D31 on that line were renumbered to D32–D36 so they would not overwrite Mahopac (D27) or the lantern rest (D28). The mapping is in `OPEN_DECISIONS.md`.

## Already on `main` by squash merge

The branch commits are still "ahead" of `main` in `git log` because the pull request was squash-merged. The playable work is the squash on `main`.

| Branch | Pull request | Squash on `main` | What it held |
|---|---|---|---|
| `cursor/pass-phone-hall-games-441b` | #22 | `d12047e` | Three pass-the-phone Event Hall games with Brin |
| `cursor/settings-debug-gate-5cd3` | #21 | `35d0a2a` | Password-gated debug panel in Settings |
| `cursor/queue-next-builds-d4b1` | #20 | `b5d1b3f` | Queue note: land the Act 1 stack, then the box, then the app |
| `cursor/high-charity-city-441b` | #19 | `47c8bda` | High Charity and five Event Hall games |
| `cursor/lantern-rest-after-wipe-2acb` | #18 | `75589b9` | After a wipe, hold the party in the Lantern House until they rest |
| `cursor/character-mahopac-dreams-47c6` | #17 | `a19d121` | Keeper looks and the Mahopac dream side quest |
| `cursor/faction-music-loyalty-1747` | #15 | `2783fef` | Dark Glimmerwell music, wild combat loops, loyalty-keyed faction talk |
| `cursor/build3-glimmer-fernbrook-7c80` | #9 | `5aceaf1` | Build 3: Glimmerwell path in Fernbrook and the Bright Pavilion Tour |
| `cursor/build2-standing-quest-copy-0c27` | #8 | `392ae6b` | Build 2: Standing meter, switching, real quest copy and icon |
| `build1-stabilise-verify` | #7 | `9e3cda0` | Build 1: doc accuracy and smoke tests |
| `cursor/designer-prompt-a308` | #6 | `fc5031d` | Designer-bot prompt |
| `cursor/clear-wary-line-a308` | #5 | `278cfd6` | Clear the befriend wary line when leaving the bar |
| `cursor/fainted-party-switch-a308` | #4 | `25f134f` | A fainted lead no longer ends the battle while the party still has HP |
| `cursor/next-plan-wp-c-quest-indicator-a308` | #3 | `7a5a717` | Quest indicator, level-scaled befriending, faction fork engine |
| `cursor/next-steps-scope-630f` | #2 | `fbb983b` | Scope note for the next work packages |

## Open work brought in Oct 14, 2026

These pull requests were left conflicting with `main` because each one still carried an older copy of the status docs, and two of them reused numbers `main` had already given to town boards. The playable code was ported. The old pull requests were not merged as branches.

| Source | What landed | Number on this landing |
|---|---|---|
| Look and listen (PR #25) | Tier 2 lanyard, Imogen, Hollis, Rook's lanyard, `town_glimmer`, `quarry`, `grove` | Q20, the number it already had |
| Lantern Council (PR #26) | Keepers council in Sky-Dock Command after Cobblecrest | Q21. Its draft Q19 belongs to town boards. Its draft D37–D42 are D50–D55 |
| Planning and QA (PR #23) | `mapTrack` and `tests/qa_gaps.spec.js` | No new queue row. The doc draft that restated the collision was not imported |
| Party board (PR #30) | Six party slots, the Walkling sheet, held items, and battle calls | Q17, replacing the earlier card list. LEFT BEHIND still shows the raw orphan data |

Town boards stay Q19 and D37–D49, scoped and not built. The Capital Partnership Briefing is Q22 and is not built.

## Left on their branches

| Branch | Tip | Why it stayed off `main` |
|---|---|---|
| `cursor/build3-glimmer-fernbrook-7c80` | `bf5119f`, `e07ec09` | Two commits after PR #9. `e07ec09` re-arms trainer sight lines after a loss. `NEXT_PLAN` still holds that off (`canSpot` requires `!spotted.<id>`). `bf5119f` is an earlier Lantern rest; PR #18 is the rest that shipped |
| `music-wip` | `659fc7c` | Untested music scheduler from before MUSIC v0.1 (`4922ae7`). Shipped music, including PR #15, is already on `main` |
