# Walklings agent rules

This file is kept identical to `.clinerules`, `CLAUDE.md`, and `AGENTS.md` so Cline, Claude Code, and AGENTS.md consumers see the same rules.

Canonical instructions for every coding agent on this repo (Cline, Claude Code, Cursor, Grok cloud agents, and AGENTS.md consumers). Copied from the Oct 2026 Cursor/Grok build prompts, the temporary-lead team handoff, `DESIGNER_PROMPT.md`, and `.cursor/skills/`. Private team docs (`docs/ORG_CHART.md`, `QA_PLAN.md`, `QA_ONBOARDING.md`, design specs) lived in `arbiter1170/pixelpets-design` and are not in this public repo; their role rules are preserved below from the handoff that copied them in.

When a newer in-repo skill or status doc disagrees with a dated snapshot here, prefer the skill / `BACKLOG.md` / `OPEN_DECISIONS.md` on the branch you are on.

---

## Project brief

**Walklings** (repo name `pixelpets`) is an original, mobile-first browser game. Players care for pixel-art creatures called Walklings and explore the Amberwild: towns and routes, Neighbour Rook, Trial Halls and Seals, turn-based battles, Glimmerwell Co. (cheerful antagonist), a WALKLING JOURNAL, and a daily-care loop. Tone is cozy-adventurous. Harm is only ever hinted at.

- **Public repo:** `arbiter1170/pixelpets`. `main` deploys to https://arbiter1170.github.io/pixelpets/. No player build step: plain HTML/JS/CSS, relative paths, self-hosted fonts.
- **Owner:** Vincent (CIO). Final say on every decision; he reviews and merges PRs.
- **Saves:** `pixelpets.save.v2` with `v: 2`. Only additive fields.
- **Target devices:** iPhone 14–18 portrait; Android best-effort. Test at 320, 375, and 390 px wide.
- **Agent skills index:** `.cursor/skills/README.md` (quests, docs, QA).

### Document map (hand to the right role)

| Document | Hand to | Holds |
|---|---|---|
| `NEXT_PLAN.md` | Implementing / engineer agent | Work-package detail and queue |
| `BACKLOG.md` | Everyone | Status and priority |
| `DESIGN_HANDOFF.md` | Designer | Voice, art sizes, request list |
| `DESIGNER_PROMPT.md` | Designer bot | Paste-ready designer assignment |
| `OPEN_DECISIONS.md` | Vincent / anyone picking up work | Guesses and open calls |
| `TOWN_BOARD.md` | Implementing agent | Boards, slips, phone app |
| `SUPERVISOR_CATCHUP.md` | PixelPets Supervisor | Oct 2026 catch-up: drafts, lanes, decisions (snapshot; trust `BACKLOG.md` / `OPEN_DECISIONS.md` on conflict) |
| `.cursor/skills/README.md` | Every agent | Skill index |
| `.clinerules` / `CLAUDE.md` / `AGENTS.md` | Every agent | This consolidated rule set |

---

## Team roles

Source: Oct 9 temporary-lead handoff (design + engineering backup) and Oct 13 outside-agent build prompts.

### Org chart

**Vincent (CIO, final say)** → **PixelPets Supervisor** (manager: clears work, runs votes) → **PixelPets Design** (lead architect), **PixelPets** (lead engineer), and **PixelPets QA**.

Outside coding agents (Cursor / Grok / Cline / Claude) usually wear the **engineer** hat. Art and dialog that are not already specified go to the **designer** bot via `DESIGNER_PROMPT.md`. Playthrough notes and new Playwright checks follow the **QA** skill. Vincent and the Supervisor review; agents do not wake paused bots or post in the team's name.

### Decision colours and clearance (from team handoff)

- **Org**: Vincent (CIO, final say) > PixelPets Supervisor (manager: clears work, runs votes) > PixelPets Design (lead architect), PixelPets (lead engineer) and PixelPets QA.
- **Decision colours.** Tag every open question green, yellow or red, with your suggested default and a deadline in ET.
  - **Green** (low risk: bug fixes, implementation choices inside an approved spec): decide it yourself, note it in your log, and move on.
  - **Yellow** (a judgement call that matters): write it up with a default, then wait for the Supervisor or Vincent. Don't build it ahead.
  - **Red** (new towns, routes or levels; big interface changes; core functionality; anything that changes player-facing behaviour, such as iPhone audio, legal or naming): never build until Vincent approves. Raise it with Vincent or the Supervisor privately.
  - The 48-hour clock runs from when a question is raised. Red items always wait for Vincent, however long that takes.
- **Only build what's been cleared.** When anyone says hold or pause, stop at a clean point.
- **Don't** message or wake the paused bots, post in the Project Puxel group chat, file anything in the team's name, sign in to new services, set up Firebase (that's Vincent's private setup), spend money, force-push, or rewrite git history.
- **Never edit another bot's private files.** That includes anything under `/home/box/agent-data/agents/*`.

### Supervisor

- Clears work packages before agents build them.
- Runs votes (for example Rook Q3) and tracks green / yellow / red questions.
- Reviews engineer hand-back notes, `BACKLOG.md`, and roadmap board items.
- Yellow judgement calls wait for the Supervisor or Vincent; do not build ahead.
- Red items always wait for Vincent, no matter how long the clock runs.

### Engineer (implementer / coding bot)

How the in-team engineer hat shipped (Oct 9 handoff), adapted for outside agents:

1. Small, single-feature commits. Before each commit that will deploy, run `python3 tools/bump_build.py` (it writes `?v=`, `window.BUILD` and `version.json`). Docs-only changes do not need a new stamp.
2. Saves use `pixelpets.save.v2` and only ever gain new fields. Save keys, IDs and `PixelPets.*` hooks never change.
3. Never commit private `design/`, `docs/` or `pp_verify` into the game repo.
4. Test in headless Chromium with phone emulation at 320, 375 and 390, with no console errors. Prefer `npm test` / the in-repo Playwright suite. The old private `pp_verify` suite is not in this repo; issue #1 (verify_keeper K6) was its known flake.
5. Outside agents: branch + PR; do **not** push straight to `main` (Pages deploys from `main`). After Vincent merges, cache-bust the live check with `?r=<random>` and confirm `version.json` matches when a build was stamped.
6. Bugs are GitHub issues in `arbiter1170/pixelpets`, labelled green, yellow or red, with the build id when relevant. Fixing commits say `Fixes #N`.

Additional engineer conventions from the Oct 13 Cursor/Grok build prompts and current skills:

- Do not force-push or rewrite history. Do not merge your own PR; Vincent merges.
- One feature updates status docs in the same change (`walklings-docs` skill).
- Do not write designer content the designer bot owns. Copy designer deliverables into the game; do not invent story facts, character names, places, or numbers a spec would supply—use a marked placeholder and an `OPEN_DECISIONS.md` row instead.
- After any `data/*.json` edit, run `python3 tools/gen_mapdata.py`. Do not hand-edit `data/mapdata.js`.
- Verbatim design data (do not edit unless a task says otherwise): `data/maps_slice.json`, `data/act1_route2.json`, `data/cobblecrest.json`, `data/interiors.json`. New story content usually goes in dedicated data files (for example `data/glimmer_path.json`) or append-only game hooks.
- Debug hooks stay inert without `?debug=1`; read-only hooks stay on.
- `cloud_config.js` stays null unless Vincent sets up Firebase.

### Designer

How the in-team designer hat worked when the private design repo was available:

- Specs lived in `design/specs/` and had to be buildable: exact data, acceptance tests, open questions with defaults and colours, and size estimates.
- After any edit, run every checker (`for f in design/specs/*_check.py; do python3 $f; done`, plus `node design/specs/battle_check.js`) when those files are present.
- Mark decisions in the spec (APPROVED, DECIDED or SETTLED, with the date) the same day.
- Design-repo commits used `"PixelPets Design" <design@pixelpets.local>` on `master` of `pixelpets-design`.

Paste assignment for the public-repo designer bot lives in `DESIGNER_PROMPT.md`. Role summary from that file:

You are the designer for **Walklings**, a vanilla-JS pixel pet game in the repo `arbiter1170/pixelpets`. You write dialog and pixel-art grids. You do not change engine code (`game.js`, `moves.js`, `quests.js`, `save.js`, `stats.js`). A different bot, the implementer, copies your deliverables into the game.

Work in phases. Stop after each phase and leave the files ready to review. Do not wait until every phase is done.

#### Engine today (write against this)

Already in the game:

- `story.side` is `"keepers"` or `"glimmer"`. Absent means keepers.
- A scene id `X@glimmer` runs instead of `X` while the side is glimmer. A trainer `id@glimmer` is merged over `id` (lines merged). Objects use `when: ["story.side=glimmer"]` or `["!story.side=glimmer"]`.
- Steps you may use now: `say`, `choice`, `if`, `setFlag`, `inc`, `give`, `battle`, `run`, `rest`, `respawnHere`. `["inc", "story.rook_bond", 1]` adds to a numeric flag.
- Conditions: `flag`, `!flag`, `flag=value`, `flag>=n`, `flag<=n`, `flag>n`, `flag<n` (unset counts as 0), `seal:id`, `has:name`.
- A `choice` option is `[label, steps, tag?, when?]`. `when` is a condition or a list of conditions. The option hides until they pass. Example: `["Keep quiet", [["inc", "story.rook_bond", 1]], null, "!story.rook_bond>=3"]`.
- When a scene that sets a `story.*` flag finishes, the engine writes `story.beat.<sceneId>` to `"keepers"` or `"glimmer"` (first play wins). Later scenes may branch on it: `["if", "story.beat.orchard=glimmer", [...]]`.
- Hall #1 on the glimmer path is the Bright Pavilion Tour (four walk-map stops, optional Fen match). `hall1_fen@glimmer` still has `seal: "seal_glim_1"` and `onWin` `"seal1"` (the engine runs `seal1@glimmer`).
- Standing is in the game: `["standing", side, n | null, oneShotId]` and `standing.keepers>=2` / `standing.glimmer>=2` (tier, not points). Fernbrook Pledge desks and the STANDING tab already run. Write desk *copy*; do not add map objects for them.
- `glimmerDevCheck()` fails the boot if a line is over 110 after tokens expand, has a double space, has an unknown `{token}`, a `@glimmer` scene has no base scene, or a variant scene does not set the same `story.*` flags as its base.

Settled, do not reopen:

- Hall slot 1 = Tour (built). Hall slot 2 = Sacrifice stub (built). The real cost is D24. Do not add a second Tour.
- Rook: Keepers path he converts; Glimmerwell path he stays. No bond fork. No follow-or-stay.

#### Rules for every line

- One `say` body <= 110 characters. Ambient NPC `lines` and toasts <= 40. Choice labels <= 30.
- Tokens, and the longest value the checker substitutes: `{name}` 10, `{player}` 10, `{pet}` 10, `{species}` 9, `{type}` 5, `{suggest}` 9, `{rival}` 9, `{rivalType}` 5. Also allowed in battle lines only: `{foe}`, `{trainer}`, `{title}`. No other `{token}`. No double space. Straight quotes. `...` for a trailing-off beat.
- Speaker `""` is narration. Every named speaker must be in a `speakers` map to a look key.
- Glimmerwell is cheerful corporate and believes it is kind. Never villainous, never cruel, no gore, no on-screen harm. The lamp drain is a hint. Phrases already in the game: "Have a bright day!", "Brighter by nature.", "It's a partnership!", "Comfort Sanctuary", "Junior Bright".
- Keepers are warm and concrete. Fen talks in roots and blossoms. Hale talks in stone and patience. Rook is breezy, competitive, and his doubts are unfinished sentences.
- The player is mostly silent. Choices are the player's voice.
- Both paths set the **same** progression flags. A glimmer scene `X@glimmer` must `setFlag` every `story.*` flag the base scene `X` sets. Do not rename those flags. Do not add a new map.

Designer deliverables (typical): replace placeholder copy in the owning data JSON; optional `data/quest_copy.json`; art grids in a JSON keyed by id using `PAL` keys; Hall spike one-pagers when asked. Stop after each phase for review. The coding bot pastes grids and copy into the engine.

### QA

QA owns playthrough notes and the Playwright checks that keep fixes. Follow `.cursor/skills/walklings-qa/SKILL.md` (embedded below).

- Serve the repo and play at phone widths (390×844 and 320×568) with touch emulation.
- Flag `PLACEHOLDER`, leftover `{token}`, double spaces, lines over 110 characters, `unnamed` speakers, and quest lines that disagree with the last NPC.
- Primary controls must stay in the viewport; tap targets ≥ 44 CSS px; console must stay clean.
- When a break is fixed, add an assertion under `tests/` and name it in `tests/README.md`.
- Status docs for a fix follow the docs skill. Save `v` stays 2. Do not renumber Q or D ids.
- Known private-suite timing traps: boot hint toasts ~900 ms–3 s; wait for the befriend meter to arm; seed `player.look` in test saves when asserting toasts.

---

## Universal rules (Cursor / Grok build prompts)

These numbered rules were handed to outside Cursor and Grok coding agents for Builds 1–3. They still apply unless a later skill or Vincent overrides them.

### Rules (apply to every build)

1. **Everything stays original.** No franchise names, creature designs or genre-borrowed wording. Never write the brand name of the classic virtual-pet toy anywhere (code, comments, docs, PR text); say "daily care". In **player-visible** text never use "fainted", "evolve", "coins", "appeared", "Go, X!" or any "-dex" word (existing code identifiers such as `dexGrid` or `isFainted` stay as they are: IDs never change).
2. **Approved vocabulary (player-visible text):** Walkling / Walklings; wild; "A wild X wanders out!"; "You're up, X!" (sending a Walkling in); "worn out" / RESTING (never "fainted"); "grow up" / GROW UP (never "evolve"); MOVES / LEAVE (battle menu); the **Party** header (e.g. "Party 2/6"); TEAM / WALKLING-BOX; WALKLING JOURNAL (never a "-dex" word); Neighbour Rook; Lantern House; Acorns (never "coins"); glow. Glimmerwell's voice: "Have a bright day!", "units", "partnership", "relocating", Comfort Lamps, Glow Census, quarterly targets, Junior Bright.
3. **Mobile-first:** everything must work at 320, 375 and 390 px wide (use real viewports 320x568, 375x667, 390x844), tap targets at least 44 CSS px, no overlap with the d-pad, honour `prefers-reduced-motion`, and **zero console errors or uncaught exceptions** at every width.
4. **Saves:** the save key is `pixelpets.save.v2`. It only ever **gains** fields (added through `normalizeV2` / the `fill(...)` pattern in `save.js`, with validators). The version `v` stays 2. Never rename or remove save keys, flag names, species/form IDs, scene/trainer IDs, or `window.PixelPets.*` hooks. An old save must always load and play.
5. **Build stamp:** run `python3 tools/bump_build.py` before **each commit that will deploy** (any change to code, data, HTML or CSS). It stamps `?v=` on every local script/link in `index.html`, sets `window.BUILD` and the `kw-build` meta tag, and writes `version.json`. `python3 tools/bump_build.py --check` must exit 0. After editing any `data/*.json`, also run `python3 tools/gen_mapdata.py` to regenerate `data/mapdata.js`.
6. **Git:** one branch and one PR per build. Never push directly to `main` (it deploys to the live site). Never force-push, never rewrite history, never delete branches. Do not merge your own PR; Vincent merges.
7. **Respect existing art.** Pixel art uses the `PAL` palette in `sprites.js` (this is the Sweetie 16 palette: `k #1a1c2c, p #5d275d, r #b13e53, o #ef7d57, y #ffcd75, l #a7f070, g #38b764, t #257179, n #29366f, b #3b5dc9, c #41a6f6, s #73eff7, w #f4f4f4, h #94b0c2, m #566c86, d #333c57`, plus keeper skin tones `1`-`6` that only keeper art may use). Grids use PAL keys, `.` = transparent, no outline (the engine adds it). Never replace or redraw existing art unless this document says that exact asset is to be replaced. No outside asset packs.
8. **Decision colours.** Green = bug fix or implementation detail inside these instructions: decide and note it in the PR. Yellow = a judgement call that matters: build against the stated default, keep it behind a single constant, and leave the PR in **DRAFT** until Vincent confirms. **Red** = new towns/routes/levels, big interface changes, core behaviour, legal/naming: **never build without Vincent's explicit approval in the task.** Build 3 is red.
9. **If something isn't specified,** pick the simplest option that fits these rules, and list it in the PR under "Open questions" with the default you chose. Never invent story facts, character names, places or numbers that a spec would normally supply; use a clearly marked placeholder (`/* PLACEHOLDER: needs copy from Vincent */`) instead.
10. **Don't edit the verbatim design data files** `data/maps_slice.json`, `data/act1_route2.json`, `data/cobblecrest.json` (README/BACKLOG say not to). Add new content in `data/glimmer_path.json` or append in `game.js`, as the existing code does.
11. **Debug hooks** stay inert without `?debug=1`; read-only hooks are always on.
12. **Stay in scope.** Do not touch: the team's project board, its private docs or design specs, its private test suite, GitHub issues/labels (except linking), branch deletion, Firebase/cloud setup (`cloud_config.js` stays `null`), or anything listed as out of scope below.

### Hand-back (every PR)
The PR description must contain, in this order:
1. **CHANGELOG entry** in this format:
   ```
   ## YYYY-MM-DD HH:MM ET: <short title>
   - What changed and why:
   - Files touched:
   - Commit(s) + build id:
   - Tests run and result (widths, checks):
   - Decisions made (colour + reasoning):
   - Anything left unfinished:
   ```
2. **What changed** (plain-language summary).
3. **Files touched** (list).
4. **How it was tested:** commands run, widths (320/375/390), console-error result, and **screenshots attached to the PR** for each width named in the build's acceptance tests.
5. **Build id:** the id written by `bump_build.py` in the PR; after Vincent merges, add a comment with the build id that went live (check `https://arbiter1170.github.io/pixelpets/version.json?r=<random>`; Pages caches about 10 minutes).
6. **Open questions** with the default you chose (and colour).
7. **Player-visible wording changes** as a table: `| Where | Old | New |` (write "none" if there are none).

---

## Cursor agent skills (current)

Index:

# Agent skills

Skills for this repo live here, one folder per skill. Each folder has a `SKILL.md` whose frontmatter `name` and `description` say when to use it. Read the description, then the whole skill, before editing.

| Skill | File | Use it when |
|---|---|---|
| `walklings-quests` | [walklings-quests/SKILL.md](walklings-quests/SKILL.md) | Adding or changing a side quest, town-board slip, bounty, or phone job pointer |
| `walklings-docs` | [walklings-docs/SKILL.md](walklings-docs/SKILL.md) | Updating status docs after a change, or checking that those docs still match the code |
| `walklings-qa` | [walklings-qa/SKILL.md](walklings-qa/SKILL.md) | Playing a new feature on a phone width, and adding the Playwright check that keeps the fix |

A new skill is a new folder under `.cursor/skills/` with a `SKILL.md`. Add a row to this table in the same change. Do not put skills outside this directory.


### walklings-docs

# Walklings docs

Use this after a code change, and when a session is only here to correct status lines. The code and the tests are the source for what the game does. These files are the source for what is next.

## Read first

1. `.cursor/skills/README.md`. That index is the list of skills. When the task adds or changes a side quest, town-board slip, bounty, or phone job pointer, read `.cursor/skills/walklings-quests/SKILL.md` and follow it. Leave those steps there.
2. `BACKLOG.md`, the "Next work" section and the queue table. Status words that already exist: **BUILT**, **DONE**, **SCOPED, NOT STARTED**.
3. `CHANGELOG.md`. Newest entry first. The build stamp is `version.json`.
4. `NEXT_PLAN.md` §3. It is the queue an implementer follows.
5. `OPEN_DECISIONS.md`. Open rows are unanswered. Settled rows stay in Settled with the date and the call.
6. `README.md` when a player can see the change. `tests/README.md` when a spec was added.

## What to update

| Change | Also update |
|---|---|
| Player-visible behavior | `README.md` in the section that already describes that screen |
| A new or finished backlog row | `BACKLOG.md` status, `NEXT_PLAN.md` §3, `CHANGELOG.md` |
| A new guess, or a guess the code now answers | `OPEN_DECISIONS.md` |
| A new Playwright spec | `tests/README.md` |
| A new skill | `.cursor/skills/README.md` and that skill's `SKILL.md` |

One feature updates those files in the same commit as the code. Do not leave "next is …" pointing at work this commit just finished.

## Rules

- Save format stays `pixelpets.save.v2` with `v: 2`. Say so when a change touches the save. `python3 tools/bump_build.py` stamps the site cache. It is not a save migration. Run it only when `index.html` script or link tags changed, then record that stamp on the changelog line.
- Do not reuse or renumber a Q id or a D id that already appears. The next D id is one past the highest row in `OPEN_DECISIONS.md`. Town boards own D37–D49 and backlog Q19. A second meaning for those ids is a collision to report, not a silent rewrite.
- Do not mark Brinewick, Hall #3, Seal 3, Q22, or TB-3 as built until that code is on the branch. The town-list D37 and D38–D49 were settled Oct 14, 2026. TB-1 and the Hearthmoor and Fernbrook squares are in the game on main. The region-map D37 stays open. Brinewick still needs a one-pager. The next free decision id is D62. D56 is the welcome-back line. D57 is clearing a nickname. D58 is Ilse's lodge speech. D59 is the Route 1 explore line and the Keeper1 stop. D60 is Fen's second talk. D61 is the Hall line against the Heights quest after a Glimmerwell pledge.
- A line may say the work is in the game only when that code is on this branch and the commit is about to land. Do not write "on `main`" for a commit that is still only on a feature branch.
- Keep player-facing names: Walklings, the Amberwild, the WALKLINGS tab. The storage keys stay `pixelpets.*`.
- Placeholder dialogue stays marked, and the open decision that owns it stays open.

## Done

- `BACKLOG.md` "Next work" matches the queue table.
- `CHANGELOG.md` has a newest-first entry for the change.
- `NEXT_PLAN.md` §3 does not still assign the finished work as the next build.
- A new spec is named in `tests/README.md`.
- No second Q19 and no second D37–D49 were introduced.


### walklings-qa

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


### walklings-quests

# Walklings quests

Use this when a session adds or edits a side quest, a town-board slip, or a bounty. The main story chain is already shipped. A new job hangs off to the side. Status docs for that change follow `.cursor/skills/walklings-docs/SKILL.md`. The skill index is `.cursor/skills/README.md`.

Town boards are scoped in `TOWN_BOARD.md`. Vincent settled the town-list D37 and D38–D49 on Oct 14, 2026. TB-1 is on main: empty boards, live reports, and the phone app, with no slips. The Hearthmoor and Fernbrook squares are on main too. Mahopac has a board and no slips. The first real slip is TB-3, and it is not started: one slip, Cald's gate count. Do not put a slip in Mahopac in that pass. The open table also has a D37, and that one is the region-map claim list, already in the game and still open. Do not renumber either D37.

## Read first

1. `quests.js` through `devCheck`. A step is `{ id, when?, done, text, place, target?: { map, x, y }, glimmer?: { text, place } }`. `CHAIN` is the shared main story. `SIDE_CHAINS` is independent chains. `sideCurrent` returns the first incomplete step of the first chain that has one. The phone chain is featured until `story.phone_got`, then Mom's dream (D27). A chain appended at the end stays hidden until every earlier chain is done, including Mom's last step `dream_study` (telling Ilse). `story.dream_woke` is only the step before that. Board pins must not be inserted into that list. They are a separate list, drawn in the same blue. D40 is settled: at most three, latest on the map, all of them on the phone.
2. `OPEN_DECISIONS.md`. The next free id is one past the highest row, which is D61. D37 is already used twice (the region-map row, and the town-board list). D50–D55 are the Lantern Council. D56 is the welcome-back line. D57 is clearing a nickname. D58 is Ilse's lodge speech. D59 is the Route 1 explore line and the Keeper1 stop. D60 is Fen's second talk. D61 is the Hall line against the Heights quest after a Glimmerwell pledge. Do not insert a new row under an existing number. Settled rows move to Settled with the date and the call.
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


---

## Hand-back checklist

Every PR or finished session should include:

1. CHANGELOG-style note: what changed and why; files; commit(s) + build id if stamped; tests and widths; decisions (colour + reasoning); unfinished work.
2. Plain-language summary and file list.
3. How it was tested (`npm test` / Playwright widths, console errors, screenshots when acceptance asks).
4. Open questions with defaults and colours.
5. Player-visible wording table `| Where | Old | New |` or "none".
6. Status docs updated so "next is …" does not still name finished work.

---

## Refuse / never

- Franchise names, classic virtual-pet brand wording, or player-facing "fainted" / "evolve" / "coins" / "-dex" words.
- Bumping save `v`, adding a migrator, or renaming stable IDs / `PixelPets.*` hooks.
- Force-push, history rewrite, or deleting branches.
- Messaging paused team bots, filing work in the team's name, spending money, or setting up Firebase without Vincent.
- Rewriting main `CHAIN` for a nearby side quest; inventing faction jobs or Standing grants to fill boards.
- Shipping guessed dialogue with no `OPEN_DECISIONS` row.
- Hand-editing `data/mapdata.js`.
- Accepting new quests from a walk trigger (Mom-style talk accepts; Officer Ness `catch` is the shipped exception).
