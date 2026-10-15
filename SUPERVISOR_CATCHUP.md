# Walklings supervisor catch-up

**Oct 11–15, 2026.** Source: `origin/main` at ec2267d, plus four open draft PRs (#37 navigation, #39 phone contacts, #40 RegenX lab and Bitlet, #41 partner kit). Live stamp in `version.json` is **20261014-1314**. Site: https://arbiter1170.github.io/pixelpets/. Save key stays `pixelpets.save.v2` with `v: 2`.

> **Assign from this, not from the middle of NEXT_PLAN §2.** Act 1 is in the game. The cleared next build is **TB-3** (Cald's gate count, one slip only). Standing numbers **D14–D17** are due Oct 15. Four drafts are open; three (#39, #40, #41) were cut before PR #36 merged and all claim decision **D60**, which Fen's second talk already owns on main. None of the three is in the cleared queue.

| Metric | Value |
|---|---|
| PRs Vincent merged, Oct 13–14 | 33 |
| Open draft PRs (all conflicting or docs-only) | 4 |
| Drafts claiming D60 | 3 |
| Next cleared engineering build | TB-3 |
| Agent skills | 3 (`.cursor/skills/`) |

---

## Open PR triage

All four are drafts opened Oct 14 night–Oct 15 04:04 UTC. Only **#37** is docs-only. **#39**, **#40**, and **#41** change game code; each branched before PR #36. Verification below used Playwright at **320** in separate worktrees and `git merge-tree` for merge prediction. PR bodies and this doc do not replace a QA playthrough.

| PR | What it is | Size | Merge state | Priority | Verdict |
|---|---|---|---|---|---|
| [#39](https://github.com/arbiter1170/pixelpets/pull/39) phone-contacts-bag-c35b | Keeper1 icon home, Contacts with FAV and QUEST cards, `phoneBook` save field. Bag icon fix (duplicate of #36). | 15 files, +559 −60 | Conflicts: docs, `index.html`, `version.json`, `game.js` (2 hunks) | 1 of 3 | Ask Vincent (**yellow**). Rebase; drop duplicate bag fix. |
| [#41](https://github.com/arbiter1170/pixelpets/pull/41) partner-kit-accessories-9335 | Partner tab: STATS and KIT above FEED. BAG leaves partner tab. Five adornments on the body. | 18 files, +405 −88 | Conflicts: docs and stamp only; `game.js` merges clean with main | 2 of 3 | Ask Vincent (**yellow**, button move). Rebase; renumber D60. |
| [#40](https://github.com/arbiter1170/pixelpets/pull/40) regenx-byte-lab-f06e | RegenX rooms and people redone; six scenes rewritten; new `rx_bitlet`; VOLT line `byte` (Bitlet, Hoverbyte, Archivolt). | 26 files, +710 −91 | Conflicts: docs, stamp, `mapdata.js` (regenerate) | 3 of 3 | **Hold** for Vincent (**red**). New species and story copy. |
| [#37](https://github.com/arbiter1170/pixelpets/pull/37) modern-arcade-controls-5eb8 | Docs-only scope for modern and arcade controls (Q26). Claims D62–D64. | 6 files, +145 −14 | Docs only | Independent | **Red** until Vincent says build. |

### PR #39 — Give the Keeper1 an icon home and a real contact list

**What it does**

- Keeper1 (and Cracked Handset shell) opens on an icon grid: Contacts, Notes, Walklings, Friends, KeeperUAV, Ribbit, BOARD. Thin shell still reads Botnet for KeeperUAV. Walklings icon opens the WALKLINGS tab.
- Contacts: one card per person after talk or a finished scene names them. Quest dialog marked QUEST. FAV sorts first; FAVORITES filters. Saved in `phoneBook` `{ met, fav }`; save stays v 2.
- Bag fix: Keeper1 and Cracked Handset had no item art; drawing the bag threw.

**Advice**

- Bag fix is **already on main** (PR #36). Conflict hunks are `drawItemIcon(ico, id)` vs main's `ITEM_ART[id]` in bag and shop. On rebase keep one path; prefer main's art entries; keep `drawItemIcon` only if the phone grid needs it.
- Phone layout is player-facing (**yellow**). QA should play on a Glimmerwell save at 320 and 390.
- Confirm `save.js` cleans `phoneBook` names like other maps (`cleanNames`).

### PR #41 — Partner tab: STATS and KIT above FEED

**What it does**

- STATS and KIT above FEED (same care-button chrome). KIT opens Customize & Gear (adornments, held items, call, opener, relief, line, note). BAG leaves partner tab; stays on Walk map.
- Five free adornments (`bell`, `ribbon`, `scarf`, `leaf`, `star`) drawn on every form, including faded grey.
- `tests/partner_kit.spec.js`; screenshots under `screenshots/partner/` (320 and 390, not 375).

**Advice**

- Cheapest to land: code merges cleanly with main; conflicts are status docs and stamp only.
- Moving BAG and adding KIT overlaps **Q26** (#37), which also moves PARTNER. Get Vincent's yes/no on KIT before Q26 is built.
- Ask for 375 screenshots if merging (project widths are 320, 375, 390).

### PR #40 — Dress the RegenX lab and add Bitlet

**What it does**

- Lobby, Focus Wing, Records, Arbiter bay: distinct floors, props, plaques; new NPC looks.
- New species id `byte`, type VOLT, three stages; five moves; `labOnly` (no wild roll). Bitlet in Arbiter bay → befriend battle; `story.rx_bitlet`; does not gate Heights quest. Journal count → 45 forms.

**Advice**

- **Hold.** No queue row. New species, moves, and implementer story copy = **red**. Older branch `cursor/regenx-copy-draft-193c` (no PR) was already marked hold; this PR supersedes that intent with code.
- Six rewritten scenes + Bitlet lines need designer review or placeholders + open rows (not D60).
- Checked on branch: `know_us@glimmer` still runs `orchard` (D61 intact). `story.rx_bitlet` in `NOT_STEPS`. Rebase: run `python3 tools/gen_mapdata.py`, never hand-merge `mapdata.js`.

### Where the three collide

| Collision | Detail | Fix |
|---|---|---|
| Decision id D60 | Main has D60 Fen, again (+ D61). #39, #40, #41 each add a different D60. #37 claims D62–D64 on its branch. | You assign ids. If #37 rejected: #39 → D62, #41 → D63, #40 → D64. If #37 stays: D65, D66, D67. Write reservations into `OPEN_DECISIONS.md` on main first. |
| Build stamp | #39: 20261014-2346; #40: 20261014-2349; #41: 20261015-0000; main: 20261014-1314. | Rebase each onto main; take main's `index.html`/`version.json`; apply code; run `python3 tools/bump_build.py` once. |
| Status docs | BACKLOG, CHANGELOG, NEXT_PLAN, OPEN_DECISIONS, README edited by every PR. | Merge one PR at a time; next agent rebases and refreshes its own changelog/decision rows. |
| Skill files | #39/#40 edit quests + docs skills; #41 edits docs skill. | Feature PRs should not edit skills. One docs pass after merges. |
| Code | #39 and #41 both touch `game.js`/`index.html`; pairwise merge-tree shows `game.js` clean between drafts. Only #39 has hunks vs main (bag icons). | Order by risk, not by code conflict count. |

### Recommended order

1. **You:** Write id reservations into `OPEN_DECISIONS.md` on main. Fix quest skill "next free id" sentence (still says D61; D61 is taken; next on main is D62).
2. **Vincent:** Yes/no on #39, #41 (**yellow**), #40 (**red**), #37 (**red**).
3. **Engineer:** Rebase #39 → merge (drop duplicate bag fix; QA phone play).
4. **Engineer:** Rebase #41 onto main with #39 → merge.
5. **TB-3** on independent branch from current main anytime after step 1 (do not block on drafts).
6. **#40** only after Vincent approves species; designer reviews scenes → rebase, `gen_mapdata`, merge.
7. **#37** build only after TB-3 and #39/#41 merged (Q26 moves the same buttons).

### Verification (Oct 15, cloud agent)

| Check | Result |
|---|---|
| `main`, full suite, 320 | 139 passed |
| #39, phone-related specs, 320 | 20 passed |
| #40, heights-related specs, 320 | 40 passed |
| #41, partner/party specs, 320 | 25 passed |
| `git merge-tree` vs main and pairwise | No code conflicts except #39 bag hunks and #40 `mapdata.js` |
| Not done | Full suite per branch at 375/390; live playthroughs |

---

## Navigation PR #37 — Scope modern and arcade controls

Draft on `cursor/modern-arcade-controls-5eb8`, updated 03:49 UTC Oct 15. **Docs only** until cleared. Link: https://github.com/arbiter1170/pixelpets/pull/37

**Arcade** = today's walk screen (header, HUD, d-pad with Talk, PARTNER / WALK / WALKLINGS / QUEST bar). Old saves with no `settings.controls` stay arcade without a prompt.

**Modern** hides walk chrome; map gets the height. At 320×568, map ~150 px tall today; acceptance requires `#mapWrap` at least **300 px taller** than arcade at that width.

New game asks after look picker, still in house, before exit mat. Settings can switch later. Save v 2. `settings.controls` = `"arcade"` \| `"modern"`. `settings.joystick` boolean, default false (**D63**).

| Corner (modern only) | Buttons | Source |
|---|---|---|
| Top left column | QUEST, BAG, MAP | questBtn leaves tab bar; bag/map leave d-pad |
| Top centre | Area name | envBadge → location card |
| Top right column | Settings, PHONE | gearFloat; phone leaves d-pad |
| Bottom right row | WALKLINGS, PARTNER | New; sub-screens get MAP back |
| Bottom strip | Partner name, Lv, FOOD/JOY/NRG | petStrip → stats card |
| Above strip | Walk tip | Same quest text; modern drops "Hold the pad" (**D62**) |
| Bottom left optional | Four-way joystick | Off by default; writes `walk.dpad` |

**Your call:** Big interface change = **red** until Vincent builds. If draft stays, stamp D62–D64 on main same day. If rejected, next free id on main is D62. One approved exception if built: add `["controlPick"]` after `["lookPick"]` in intro in `data/maps_slice.json` (otherwise verbatim). Landscape out of scope (**D64**). Implementing PR adds `tests/controls.spec.js` and must stamp build.

Commits: dfebe5f (smaller float layout) → d0bc37a (full-screen sketch). **Overlap:** land #39 and #41 before Q26 implementation.

---

## Skills

Three skills under `.cursor/skills/`. Same bodies copied into `AGENTS.md`, `CLAUDE.md`, `.clinerules` (PR #38). **Prefer the skill file on the branch** over the AGENTS copy if they disagree; then one docs pass to sync.

| Skill | Hand to | Forces | Known drift |
|---|---|---|---|
| `walklings-quests` | Engineer on TB-3, side quest, slip, bounty, phone job | Off CHAIN; talk accepts; Ness catch exception; board pin vs yes-flag; flags in data + NOT_STEPS/done; `gen_mapdata`; spec; open row for guessed copy; save v 2 | Read-first says next id **D61**; D61 is Hall vs Heights. Main next id **D62**. #39/#40 rewrite sentence differently. |
| `walklings-docs` | Anyone touching status in same PR as code | BACKLOG, CHANGELOG, NEXT_PLAN §3, OPEN_DECISIONS, README, tests/README; no renumber Q/D; no false "built"; bump only if `index.html` scripts change | Correct on main (D62). Does not know #37 D62–D64 or draft D60 claims. |
| `walklings-qa` | After player-visible feature; playthroughs | 390×844 and 320×568 touch; line/token/length checks; 44px taps; clean console; fix → assertion in tests/README | PR #36 model: bag throw, walk tip, Fen repeat, DONE off-screen at 320. #39/#41 need play before merge. |

**Brief a worker:** Name one skill in line one; quests jobs also name docs skill. Base = **main**, one PR, one Q/TB id. **You** name the next D id. Feature agents must not edit `.cursor/skills/`.

---

## Quality and effort (observations)

| Observation | Cost | Change |
|---|---|---|
| Four id collisions in three days | Docs PRs each time | Publish next Q and D before agent starts; reserve in OPEN_DECISIONS same day or ids are not reserved |
| Unrequested scope at PR stage | #39–#41 not in queue; #40 = species + story | Assignment names Q/TB id; PR template: "Cleared by" + date |
| Feature PRs edit skills + status in parallel | Every draft conflicts in status + stamp | One merge at a time; skills edited in one docs pass only |
| Status copied in seven places | Drift within a day | BACKLOG "Next work" + OPEN_DECISIONS header are canonical; others link |
| NEXT_PLAN §2 | Dead Rook bond tree (D23 replaced) | Stop line at §2 top; designer prompt → §3 + Settled |
| Implementer story before designer | Builds 4–6; #40 adds Heights copy | Placeholders + open rows; designer F, H, S before more story |
| Playthroughs vs specs | #36; #39 re-found bag on stale branch | QA skill on every player-visible job; consider GitHub Actions `npm test` at 320 |
| `game.js` ~7,386 lines | #39 ~+300, #41 ~+270, Q26 adds more | Keep phone/partner in one place each; no "split game.js" project |
| Stale branches | Squash merges; agents rebuild fixed work | Assignment: main + one branch; fix BRANCH_LOG boards sentence |
| No CI | Cannot verify "405 passed" on PR | `pull_request` workflow: `bump_build.py --check` + Playwright 320 |

**Spend effort on:** TB-3 (quests skill); docs pass on stale lines; designer D26, D24, D19; you on D14–D17, id reservation, four PR yes/no; one-at-a-time rebases for #39 then #41.

**Stop:** Daily Standing until D18 cap; Q22; Brinewick; #40 without Vincent; Q26 until TB-3 + #39/#41; music-wip; sight-line re-arm; two agents editing BACKLOG while a PR is open.

---

## How to get oriented (read order)

1. `BACKLOG.md` — Next work + queue Q1–Q25 (Q26 only on #37).
2. `NEXT_PLAN.md` **§3 only** — Q19 = TB-3; Q22 not built.
3. `OPEN_DECISIONS.md` — Open then Settled; next free id on main = **D62**.
4. `TOWN_BOARD.md` — TB-3 next slip.
5. `AGENTS.md` — roles, colours, skills.
6. `.cursor/skills/README.md` — read assigned SKILL.md.
7. `DESIGNER_PROMPT.md` — Tour, Sacrifice page, desk letters.
8. `BRANCH_LOG.md` — branch history (boards line stale).
9. PRs **#37, #39, #40, #41** — triage above.
10. `tests/README.md` — 27 specs on main; no GitHub Actions yet.

---

## Where the game stands

**Playable:** Keepers path through Cobblecrest Seal → Lantern Council. Glimmerwell orchard, Tour, Route 2, Sacrifice stub, Rook stays. Both set `story.cobble_end`. Heights gates first trial unless Seal 1. Brinewick, Hall #3, Seal 3 closed.

**On main (do not rebuild):** Quest panel, befriend, side pick, Standing/desks, Tour, Sacrifice stub, Rook paths, Heights, group battles, save copy, Keeper House, Keeper1/cracked handset, Ribbit, High Charity + 8 hall games, Mahopac dreams, lantern rest, faction music, debug password, region map, party board, installable app, look/listen, Lantern Council, rename, volume, welcome back, empty town boards.

---

## Worker lanes

| Lane | Skill | Do | Hold |
|---|---|---|---|
| Engineer A | quests + docs | TB-3 only; you assign D id; spec + status | Q26, Q22, Brinewick, daily Standing, second Tour/slip |
| Engineer B | docs (rebase) | #39 then #41 rebase one at a time; drop #39 bag dup; no skill edits; bump once | Merge own PR; #40 until Vincent |
| Designer | DESIGNER_PROMPT F, H, S | D26 Tour; D24 Sacrifice page; D19 desks; review #40 scenes if approved | Engine files; new maps |
| QA | walklings-qa | #39 phone + #41 partner on Glimmerwell 320/390; then TB-3 | Rewriting D61; issue #1 (private flake) |
| Docs-only | walklings-docs | Stale lines + §2 stop line + quest skill D61 sentence | Renumber Q/D; stamp |
| You | — | Four PR yes/no; id reservation; #37 after TB-3 + #39/#41 | Build #37 from draft; merge #40 without Vincent |

---

## Decisions needing a person

| Id | Due / note | Today | Who |
|---|---|---|---|
| D14–D17 | Oct 15 | Standing tiers 0/10/25/45/70; half on leave; chapter = Seal count | Vincent |
| D18 | Blocks feature | Daily Standing unbuilt (no cap) | Vincent |
| D24 | Blocks real Hall 2 | Sacrifice stub cost | Designer → Vincent |
| D26, D19 | Copy | Tour + desk placeholders | Designer |
| D25 | After Act 1 | Rook ally/stays; no post-cart | Vincent |
| D37 region | Playing | Region parchment list (≠ settled town-list D37) | Vincent |
| D56–D61 | Open | Welcome, nickname, Ilse, Route 1 phone, Fen again, Hall vs Heights | Vincent when locking copy |
| D62–D64 | PR #37 only | Control prompt, joystick default, landscape out | You + Vincent (#37 yes/no) |
| Reassign #39/#41/#40 | Now | Each wrote **D60**; see triage for suggested D62–D67 | You assign; Vincent answers content |

---

## What changed by day

| When | What | PR / commit |
|---|---|---|
| Oct 11 | Journal album / east-path backlog note | d981d01 |
| Oct 13 PM | Quest/befriend/faction scope; designer prompt; fixes | #2–#6 |
| Oct 13 eve | Builds 1–3 Standing, glimmer Tour | #7–#10 |
| Oct 13 night | Heights, group battles | #11 #12 |
| Oct 14 early | Builds 4–6, save, Keeper House, Ribbit, Mahopac, lantern, High Charity, debug, hall games | #13–#22 |
| Oct 14 10:21 UTC | Stack on main; Heights ids → D32–D36 | #24 |
| Oct 14 midday | Region map, boards scope, box, app, party, look/listen, Council Q21 | #27–#31 |
| Oct 14 PM | Rename, volume, welcome Q23–Q25; boards; quest cards; phone QA | #32–#36 |
| Oct 14 22:09 UTC | AGENTS / CLAUDE / .clinerules + skills | #38 |
| Oct 15 03:49 UTC | Navigation scope draft | #37 |
| Oct 15 03:58–04:04 UTC | Phone contacts, RegenX/Bitlet, partner kit drafts (all claim D60) | #39 #40 #41 |

---

## New systems (hooks on `window.PixelPets`)

| System | Where | Hook |
|---|---|---|
| Quest chain (26 rows, 10 glimmer overrides) | `quests.js` | `quest`, `sideQuest`, `questCheck` |
| Standing / pledge desks | `standing.js` | `standing`, `standingCheck()` |
| Glimmer scenes | `data/glimmer_path.json` | `side`, `sceneFor`, `glimmerCheck` |
| Heights / group battles | `data/heights.json` | `heights`, `heightsCheck` |
| Phone, boards, Ribbit | civic, town_board, `ribbit.js` | `townBoard`; `PPRibbit` |
| Event Hall (8 games) | `minigames.js` | Lanterns, Shells, Chirp, Dash, Pairs, Hop, Relay, Seek |
| Region claims | `game.js` | `mapHold`, `mapCheck` |
| Party / box / sheet / held | WALKLINGS tab | `reorderParty`, `depositPet`, `releasePet`; `holdItem` |
| Save copy / lantern rest | Settings, `game.js` | `exportSave`, `importSave`, `lanternRest` |
| Installable shell | `manifest.json`, `sw.js` | `version.json` on network |

Debug: `?debug=1` or Settings → Debug → password Larson. `cloud_config.js` null.

---

## Off main on purpose

| Item | Where | Move |
|---|---|---|
| Q26 navigation | PR #37 | Yes/no; after TB-3 + #39/#41 |
| Phone contacts | PR #39 | First of three; rebase + QA + merge |
| Partner kit | PR #41 | Second |
| RegenX / Bitlet | PR #40 + old `regenx-copy-draft-193c` | Hold for Vincent |
| Sight-line re-arm | build3 branch | Leave; PR #18 rest shipped |
| music-wip | tip 659fc7c | Leave; music on main |

---

## Stale lines (fix before next agents)

| Stale | Truth |
|---|---|
| `walklings-quests` Read-first | Says D61 next; use **D62** on main |
| `BRANCH_LOG.md` | Boards built (TB-1 + squares) |
| `TOWN_BOARD.md` catalog | D39 settled; use TB-3 section |
| `BACKLOG.md` item 6 Sound | Volume is **Q24**, not Q21 |
| `NEXT_PLAN.md` §2 + designer Where to look | Rook bond tree replaced by D23 |

---

## Suggested first hour

1. Reserve ids in `OPEN_DECISIONS.md` (+ D62–D64 if #37 stays). Fix quest skill D61 sentence.
2. Ask Vincent: #37 (red), #39 (yellow), #41 (yellow), #40 (red).
3. Answer or extend **D14–D17** in writing.
4. Engineer → TB-3; second engineer → rebase #39 then #41; designer → D26, D24, D19.
5. Docs pass on stale lines; §2 stop line; no stamp.
6. Park #40, Q26 build, Q22, Brinewick, daily Standing, stale branches.

Issue **#1**: private verify_keeper K6 flake (green), not in this repo. Tests: `npm test` after `npm ci` and Playwright Chromium install.

---

*This file is a supervisor snapshot. When it disagrees with `BACKLOG.md`, `OPEN_DECISIONS.md`, or code on `main`, trust those sources and update this doc in a docs-only PR.*
