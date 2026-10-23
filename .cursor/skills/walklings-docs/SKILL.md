---
name: walklings-docs
description: |
  Use when a Walklings change should update status docs, or when those docs may have drifted from the code.
  Touch BACKLOG, CHANGELOG, NEXT_PLAN, OPEN_DECISIONS, README, and tests/README together.
  Do not renumber an existing Q or D id. Leave save v at 2.
  When the task adds or changes a side quest, town-board slip, bounty, or phone job pointer, read .cursor/skills/walklings-quests/SKILL.md and follow it. Leave those steps there.
---

# Walklings docs

Use this after a code change, and when a session is only here to correct status lines. The code and the tests are the source for what the game does. These files are the source for what is next.

## Find what you need

Search headings, then read only the section the task needs. Do not read these files whole.

1. `.cursor/skills/README.md`. That index is the list of skills. When the task adds or changes a side quest, town-board slip, bounty, or phone job pointer, read `.cursor/skills/walklings-quests/SKILL.md` and follow it. Leave those steps there.
2. Headings in a status doc: `rg -n '^## |^### ' FILE`
3. `OPEN_DECISIONS.md` open rows, through the next `## ` heading: `awk '/^## Open/{f=1;print;next} /^## /{f=0} f' OPEN_DECISIONS.md`. Settled calls live in `archive/DECISIONS_SETTLED.md`. Search that file for one id instead of reading it.
4. `BACKLOG.md` "Next work", through the next `## ` heading: `awk '/^## Next work/{f=1;print;next} /^## /{f=0} f' BACKLOG.md`. Status words that already exist: **BUILT**, **DONE**, **SCOPED, NOT STARTED**.
5. `NEXT_PLAN.md` §3, through the next `## ` heading: `awk '/^## 3\. /{f=1;print;next} /^## /{f=0} f' NEXT_PLAN.md`
6. `CHANGELOG.md`. Newest entry first. Read the top entry only. The build stamp is `version.json`.
7. `README.md` when a player can see the change. `tests/README.md` when a spec was added.

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
- Do not reuse or renumber a Q id or a D id that already appears. Pick new D ids with `walklings-decision-ids`; the header and rows have drifted before. Town boards own D37–D49 and backlog Q19. A second meaning for those ids is a collision to report, not a silent rewrite.
- Do not mark Brinewick, Hall #3, Seal 3, or Q22 as built until that code is on the branch. TB-3, Cald's gate count, is on this branch. The town-list D37 and D38–D49 were settled Oct 14, 2026. TB-1 and the Hearthmoor and Fernbrook squares are in the game on main. The region-map D37 stays open. Brinewick still needs a one-pager. The next free D id is named in the OPEN_DECISIONS.md header. D56 is the welcome-back line. D57 is clearing a nickname. D58 is Ilse's lodge speech. D59 is the Route 1 explore line and the Keeper1 stop. D60 is Fen's second talk. D61 is the Hall line against the Heights quest after a Glimmerwell pledge. D70 is the modern and arcade control copy. D71 is the joystick default. D72 is landscape.
- A line may say the work is in the game only when that code is on this branch and the commit is about to land. Do not write "on `main`" for a commit that is still only on a feature branch.
- Keep player-facing names: Walklings, the Amberwild, the WALKLINGS tab. The storage keys stay `pixelpets.*`.
- Placeholder dialogue stays marked, and the open decision that owns it stays open.

## Done

- `BACKLOG.md` "Next work" matches the queue table.
- `CHANGELOG.md` has a newest-first entry for the change.
- `NEXT_PLAN.md` §3 does not still assign the finished work as the next build.
- A new spec is named in `tests/README.md`.
- No second Q19 and no second D37–D49 were introduced.
