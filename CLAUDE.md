# CLAUDE.md: standing instructions for Claude Code workers

Approved by Vincent (owner). Read AGENTS.md first; it wins on any conflict. This file only adds worker asks and pointers; procedures live in `.cursor/skills/<name>/SKILL.md`.

## Security
- Use a GitHub token scoped only to opening PRs on this repo.
- Hold no Firebase or deploy keys.
- Run a secret scan on the diff before every push (gitleaks or git-secrets, or at least `git diff origin/main | grep -inE 'api[_-]?key|secret|token|password|BEGIN .*PRIVATE KEY'`). Fix every hit before pushing.
- Work in your own sandbox or fresh clone, never a shared checkout.

## Git and PRs (skill: `walklings-pr-handback`)
- One branch and one PR per build.
- AGENTS.md rule 4: "never push straight to `main`. Never force-push, rewrite history or delete branches." No rebase, no amending pushed commits.
- Bring a branch up to date with a merge commit: `git fetch && git merge origin/main`.
- PRs are reviewed and merged by the Walklings Chief of Staff, never by the worker.
- Every PR adds its own `CHANGELOG.md` entry (format in `walklings-pr-handback`).
- Every PR body carries a "Skills used:" line.
- Never commit `design/`, `docs/`, `pp_verify` or `tools/__pycache__`.

## Saves
- AGENTS.md rule 2: key `pixelpets.save.v2`, `v` stays 2, "fields are additive only (via `normalizeV2`)". Never rename or remove save keys. Old saves must load.

## Wording (skill: `walklings-wording-check`)
- Original names only; no franchise names or wording. Run the skill's scan on your diff and PR text.
- Player-visible and PR text says "holder", never "trainer" (code ids stay as they are).
- Capital-K Keeper.
- The currency is Acorns.

## Visible changes
- Anything visible ships before and after screenshots at 390 and 320 widths.

## Art and palette
- Palette rules: see AGENTS.md rule 8 (`PAL` in `sprites.js`, no outside assets) and rule 9 (room redesigns, incl. Glimmerwell).

## Communication
- Never message Vincent. All status, questions, PRs and previews go to the Walklings Chief of Staff.
