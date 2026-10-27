# Walklings agent rules (core)

Canonical rules for every agent on this repo (Cursor, Cline, Claude Code, Grok, AGENTS.md readers). `CLAUDE.md` and `.clinerules` only point here. Procedures live in skills (index below); load a skill when the task matches. The full pre-2026-10-15 rule set is in `archive/AGENTS_2026-10-14_full.md` (read on demand).

## Project
**Walklings** (repo `arbiter1170/pixelpets`): original, mobile-first vanilla-JS browser game; no build step. `main` deploys to https://arbiter1170.github.io/pixelpets/. Code ids, `pixelpets.` keys and URLs keep the PixelPets name. Targets: iPhone 14–18 portrait, Android best-effort.

## Team
Vincent (CIO, final say; reviews and merges PRs) > PixelPets Supervisor (clears work, runs votes, owns the board) > PixelPets Design (specs in private `design/`), PixelPets (lead engineer, owns code), PixelPets QA, PixelPets Token Engineer, PixelPets Sprites. Outside coding agents wear the engineer hat. Build only what's cleared; on hold or pause, stop at a clean point. PixelPets Contracted Engineer (Claude Code, independent outside reviewer, read-only) reports to Vincent for now.

## Hard rules
1. **Original only.** No franchise names, designs or genre-borrowed wording. Never write the classic virtual-pet toy brand anywhere; say "daily care". Player text never says fainted, evolve, coins, appeared, "Go, X!" or any "-dex" word. Skill: `walklings-wording-check`.
2. **Saves:** key `pixelpets.save.v2`, `v` stays 2, fields are additive only (via `normalizeV2`). Never rename or remove save keys, flags, species/scene/trainer ids or `window.PixelPets.*` hooks. Old saves must load.
3. **Red items need Vincent's approval before anyone builds them:** big interface changes, new towns/routes/whole levels, core functionality, iPhone behaviour (e.g. audio), legal or naming. Raise them privately with the Supervisor, not in the group. Yellow waits for a vote; green you decide and note. Skill: `walklings-decision`.
4. **Git:** branch + PR; never push straight to `main`. Never force-push, rewrite history or delete branches. Don't merge your own PR. Never commit `design/`, `docs/` or `pp_verify` into this repo. Skill: `walklings-pr-handback`.
5. **Deploys:** `python3 tools/bump_build.py` before every commit that deploys (not for docs-only). After merge, hard-refresh/cache-bust and confirm `window.BUILD`, `version.json` and the Settings Build line match; every live report carries the build id. Skill: `walklings-deploy`.
6. **Phones:** 320, 375, 390 px; tap targets >= 44 px; zero console errors; honour reduced motion.
7. **Scope:** don't wake paused bots, post in Project Puxel or file in the team's name unless your role does; no new Firebase projects, rule edits, or spending without Vincent. Phase 1 is on: `cloud_config.js` holds the public web config for `walklings-4cc89`. Tests must not sign in or write to that project. Never edit another bot's files (`/home/box/agent-data/agents/*`). Debug hooks stay inert without `?debug=1`.
8. **Content:** don't invent story facts, names, places or numbers a spec supplies; use a marked placeholder plus an `OPEN_DECISIONS.md` row. Respect existing art (`PAL` in `sprites.js`); no outside asset packs. Don't edit verbatim design data (`data/maps_slice.json`, `data/act1_route2.json`, `data/cobblecrest.json`, `data/interiors.json`); after any `data/*.json` edit run `python3 tools/gen_mapdata.py`.
9. **Room redesigns:** no room redesign (reskin, layout change or interior expansion) deploys until Vincent has seen the previews and said yes. Every room redesign starts with inspiration from sub-agents or the Gemini model, then is translated into pixels using only Walklings' own assets (`PAL` in `sprites.js`). Throwing textures together is not acceptable: the first Glimmerwell trial hall (second town) was bad enough that the whole room needed a huge rework. Applies to Design packets and every build of one. (Vincent, Oct 23, 2026.)
10. **Lantern Houses and General Stores read at a glance:** every town uses one consistent exterior design language for both. Lantern Houses (healing spots) carry a universal exterior healing indicator; interiors may vary by faction control, town or location, but always have beds where the player rests and an NPC who guides the player and makes sure they understand healing. Every General Store carries at least one exterior component shared by all stores, so a player can tell a shop from a healing spot at a glance. Design specs this as a priority before any more town structures are built. (Vincent, Oct 23, 2026.)

## Test output
Run `npm run test:agent -- [spec] [--project=390]` (e.g. `npm run test:agent -- tests/x.spec.js --project=390`; npm drops `--project` without the `--`), not bare `npm test`; it prints one `PP_TEST RESULT` line plus failures and exits with Playwright's real code. Don't read `test-logs/run.log` whole: `grep -n` it, or `tail -n 40`. Never pipe a test command.

## Skills index (`.cursor/skills/<name>/SKILL.md`; copies in `/home/box/agent-data/workflows/`)
- `walklings-deploy`: stamp the build, ship via PR, hard-refresh and check the build line.
- `walklings-pr-handback`: branch/rebase routine and the required PR hand-back body.
- `walklings-decision`: green/yellow/red, 48h ET clock, red routing, D/Q ids, settling.
- `walklings-board`: Roadmap board moves; ids in `docs/.board-ids.txt`.
- `walklings-design-commit`: design repo checkers, render, commit, push.
- `walklings-wording-check`: franchise/brand/banned-word scan and approved vocabulary.
- `walklings-handoff-log`: session summary, status docs, group-chat post format.
- `walklings-cutscene`: stage a scene as a cutscene (beat sheet, previews at 320/375/390, the cutscene data file, what every cutscene keeps).
- `walklings-docs`: keep BACKLOG, CHANGELOG, NEXT_PLAN, OPEN_DECISIONS, README, tests/README in sync.
- `walklings-qa`: play a new path at phone width and add the Playwright check.
- `walklings-qa-run`: scoped QA run on a named build (seeded saves, pp_verify, bug write-up).
- `walklings-quests`: side quests, town-board slips, bounties, phone job pointers.
- `walklings-skill-sync`: copy a skill between the box library and this repo so the newer copy wins.

## Status docs
`BACKLOG.md` (current work), `OPEN_DECISIONS.md` (open items only), `NEXT_PLAN.md`, `TOWN_BOARD.md`, `DESIGNER_PROMPT.md` (designer bot), `CHANGELOG.md` (recent), `handoff/maps/` (map upgrade packets). History: `archive/`.

Search headings (`rg -n '^## |^### ' FILE`) and read only the section the task needs, through the next `## ` heading. Do not read `OPEN_DECISIONS.md`, `CHANGELOG.md`, `README.md`, `NEXT_PLAN.md`, or `BACKLOG.md` whole. Settled calls live in `archive/DECISIONS_SETTLED.md`. Search that file for one id instead of reading it. Open rows: `awk '/^## Open/{f=1;print;next} /^## /{f=0} f' OPEN_DECISIONS.md`. Backlog "Next work": `awk '/^## Next work/{f=1;print;next} /^## /{f=0} f' BACKLOG.md`. `NEXT_PLAN.md` §3: `awk '/^## 3\. /{f=1;print;next} /^## /{f=0} f' NEXT_PLAN.md`. The top `CHANGELOG.md` entry is the first `## ` block.

`game.js` is large: use `rg NAME tools/GAMEJS_MAP.txt` to find a range, then read only that range, and do not read `game.js` whole. After editing a root .js file, run `python3 tools/gen_gamejs_map.py`.

## Cloud agents
If any uploads/ file a launch prompt names is missing, stop and report which one. Don't search the filesystem and don't guess.
