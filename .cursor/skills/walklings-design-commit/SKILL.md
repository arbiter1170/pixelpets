---
name: walklings-design-commit
description: |
  Use when PixelPets Design edits specs in the private design/ repo and needs to check, render, commit and push them.
---

# Walklings design commit

`/workspace/pixelpets/design/` is a private, gitignored repo backed up to `arbiter1170/pixelpets-design` (`master`). It is never committed into the game repo.

1. Specs must be buildable: exact data, acceptance tests, open questions with defaults and colours, and size estimates where useful.
2. After any edit run every checker: `for f in design/specs/*_check.py; do python3 $f; done` plus `node design/specs/battle_check.js`. Re-render previews with `--render` when the data changes. Keep the checkers' string expectations in sync with the approved wording.
3. Mark decisions in the spec (APPROVED / DECIDED / SETTLED, with the date) the same day.
4. Commit as `"PixelPets Design" <design@pixelpets.local>`, then `git push origin master`. If the push is rejected, `git pull --rebase` first. Never force-push.
