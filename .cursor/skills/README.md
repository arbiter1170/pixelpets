# Agent skills

Skills for this repo live here, one folder per skill. Each folder has a `SKILL.md` whose frontmatter `name` and `description` say when to use it. Read the description, then the whole skill, before editing.

| Skill | File | Use it when |
|---|---|---|
| `walklings-quests` | [walklings-quests/SKILL.md](walklings-quests/SKILL.md) | Adding or changing a side quest, town-board slip, bounty, or phone job pointer |
| `walklings-docs` | [walklings-docs/SKILL.md](walklings-docs/SKILL.md) | Updating status docs after a change, or checking that those docs still match the code |
| `walklings-qa` | [walklings-qa/SKILL.md](walklings-qa/SKILL.md) | Playing a new feature on a phone width, and adding the Playwright check that keeps the fix |
| `walklings-qa-run` | [walklings-qa-run/SKILL.md](walklings-qa-run/SKILL.md) | A scoped QA run on a named build (extends walklings-qa), including the @w1 tag, retries, scans, and the full run |
| `walklings-deploy` | [walklings-deploy/SKILL.md](walklings-deploy/SKILL.md) | Stamping, shipping and checking a deploy |
| `walklings-pr-handback` | [walklings-pr-handback/SKILL.md](walklings-pr-handback/SKILL.md) | Opening or rebasing a PR and writing the hand-back |
| `walklings-decision` | [walklings-decision/SKILL.md](walklings-decision/SKILL.md) | Raising, routing or settling a decision |
| `walklings-board` | [walklings-board/SKILL.md](walklings-board/SKILL.md) | Moving Roadmap board items |
| `walklings-design-commit` | [walklings-design-commit/SKILL.md](walklings-design-commit/SKILL.md) | Checking and committing design specs |
| `walklings-wording-check` | [walklings-wording-check/SKILL.md](walklings-wording-check/SKILL.md) | Checking text for franchise or banned wording |
| `walklings-handoff-log` | [walklings-handoff-log/SKILL.md](walklings-handoff-log/SKILL.md) | Ending a session or handing off |

A new skill is a new folder under `.cursor/skills/` with a `SKILL.md`. Add a row to this table in the same change. Do not put skills outside this directory.

Project-wide rules live in [`AGENTS.md`](../../AGENTS.md); `CLAUDE.md` and `.clinerules` are stubs pointing to it. Do not copy skill text into AGENTS.md.

