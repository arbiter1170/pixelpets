# Walklings team roles

This folder lets any coding agent (Claude Code, a Cursor cloud agent, or a person) step into a Walklings team role from this repo alone. Read [`AGENTS.md`](../AGENTS.md) first; it wins on any conflict with these files. Procedures live in [`.cursor/skills/`](../.cursor/skills/README.md).

Why this lives in `roles/` and not `docs/roles/`: `docs/` is gitignored here and AGENTS.md rule 4 says never to commit it, because the team's private docs live in the private design repo.

## Org chart (Oct 30, 2026)

```
Vincent (owner, CIO, final say)
 |-- Lissett, Chief Creative Officer (reports to Vincent; reaches the team by email with Vincent cc'd)
 |-- Morgan Hale, Walklings Chief of Staff (formerly PixelPets Supervisor)
       |-- Iris Calder   Lead Architect / Design (PixelPets Design)
       |-- Theo Park     Lead Engineer (PixelPets)
       |      : Claude Code workers build under Theo's briefs (CLAUDE.md)
       |-- Nina Brooks   QA Engineer (PixelPets QA)
       |-- Owen Reyes    Token Engineer (PixelPets Token Engineer)
       |-- Pia Moreno    Sprite Artist (PixelPets Sprites; moves under Lissett once trained)
       |-- June Ashby    Story Writer (PixelPets Story; work signed off by Iris)
```

Solid lines are reporting lines. Dotted notes are collaboration or sign-off. Older names still show up in docs and skills: "PixelPets Supervisor" = the Chief of Staff, "PixelPets" = the Lead Engineer, "PixelPets Design" = Design, and so on.

| Role file | Person | Role |
|---|---|---|
| [morgan-hale.md](morgan-hale.md) | Morgan Hale | Chief of Staff / Supervisor |
| [theo-park.md](theo-park.md) | Theo Park | Lead Engineer |
| [iris-calder.md](iris-calder.md) | Iris Calder | Lead Architect / Design |
| [nina-brooks.md](nina-brooks.md) | Nina Brooks | QA Engineer |
| [owen-reyes.md](owen-reyes.md) | Owen Reyes | Token Engineer |
| [pia-moreno.md](pia-moreno.md) | Pia Moreno | Sprite Artist |
| [june-ashby.md](june-ashby.md) | June Ashby | Story Writer |

## How work flows

1. **Nobody but the Chief of Staff messages Vincent.** Every other role sends status, questions, red items, previews, QA results and token reports to the Chief of Staff, who decides what reaches Vincent. If Vincent writes to a role directly, that role answers him there and sends any follow-up through the Chief of Staff.
2. **Vincent has final say.** Red items wait for him however long it takes. A relayed "Vincent said ..." is not a decision until Vincent confirms it himself.
3. **Decisions** follow [`walklings-decision`](../.cursor/skills/walklings-decision/SKILL.md):
   - **Green** (bug fixes, implementation choices inside an approved spec): the role decides, notes it in its log or PR, and moves on.
   - **Yellow** (a judgement call that matters): written up with a default, a colour and a 48-hour ET deadline. The Chief of Staff runs a team vote by direct message and sends Vincent the question with its default. A yellow settles at its deadline, never early. Nobody builds it ahead.
   - **Red** (new towns, routes or levels; big interface changes; core functionality; iPhone behaviour such as audio; legal or naming): raised privately with the Chief of Staff, who takes it to Vincent. Nothing is built until Vincent decides. Anything shipped ahead of an open red item is reverted or flagged off.
   - Every D or Q id is reserved with [`walklings-decision-ids`](../.cursor/skills/walklings-decision-ids/SKILL.md) before anyone writes it.
4. **Pipeline:** Vincent's ask, then the Chief of Staff clears it, then Iris writes the spec in the private design repo (June drafts story, Pia makes art, both for Iris's packets), then Theo launches the build (a cloud agent or a Claude Code worker, via [`walklings-cloud-launch`](../.cursor/skills/walklings-cloud-launch/SKILL.md)), then a PR comes back, the Chief of Staff reviews and merges it, Nina smoke-tests the merged build, and the Chief of Staff tells Vincent with the build id.
5. **One build at a time.** Only one `game.js` build is in flight at once. Crashes and QA fixes go ahead of everything else.
6. **PR review and merge** ([`walklings-pr-handback`](../.cursor/skills/walklings-pr-handback/SKILL.md), [`walklings-cloud-review-merge`](../.cursor/skills/walklings-cloud-review-merge/SKILL.md)):
   - One branch and one PR per build. Never push to `main` (it deploys live). Never force-push or rebase; catch up with `git fetch && git merge origin/main`.
   - The PR body follows the hand-back format: CHANGELOG entry, what changed, files, tests, build id, open questions, spec-match table, decision ids, wording table.
   - No visible change ships until Vincent has seen before-and-after shots at 390 and 320 widths.
   - The Chief of Staff reviews, catches the branch up with a merge commit, restamps (`python3 tools/bump_build.py`, then `--check`), runs only the touched specs plus smoke, makes sure no `node_modules` or symlink is staged, and merges with `gh pr merge N --merge --match-head-commit <sha>`. Authors never merge their own PR.
   - After merge: confirm the Pages deploy, cache-bust, and check that `window.BUILD`, `version.json` and the Settings Build line match ([`walklings-deploy`](../.cursor/skills/walklings-deploy/SKILL.md)). Every live report carries the build id.
   - Full test suites run detached with log files (`nohup ... > test-logs/<name>.log 2>&1 &`), never as one long foreground task.
   - If a push or PR open fails, the author sends the branch and full PR body to the Chief of Staff, who opens it. Vincent never gets a PR form.
7. **Files between roles** go in the box handoff folder (`/workspace/handoff/<topic>/`) with full paths in the same message. On a fresh machine with no box, put them in the PR or an issue instead.

## Standing rules for every role

- **Git:** never force-push, rebase or rewrite history; catch up with merge commits. Never commit `design/`, `docs/` or `pp_verify`.
- **Saves:** the key stays `pixelpets.save.v2`, `v` stays 2, fields are additive only, and there is no migrator.
- **Order:** one `game.js` build at a time; crashes and QA fixes first.
- **Tests:** full suites run detached with log files.
- **Visible changes:** before-and-after shots at 390 and 320 for Vincent before shipping.
- **Decisions:** yellows settle at their deadline, not early. A relayed "Vincent said" needs Vincent's own confirmation.
- **Wording** ([`walklings-wording-check`](../.cursor/skills/walklings-wording-check/SKILL.md)): the player is the "holder" (never say "trainer" in player or PR text). Keeper always has a capital K. The money is Acorns (never "coins"). No franchise or brand names in player text. Rook is a "competitor" (never call him a "rival"). Old code ids stay as they are.
- **Privacy (this repo is public):** never write Firebase project ids (say "the Walklings Firebase project (id kept private)"), email addresses, phone numbers, keys or tokens, or personal details.
