---
name: walklings-design-commit
description: >-
  Use when PixelPets Design edits specs in the private design/ repo and needs to
  check, render, commit and push them.
---
# Walklings design commit

`/workspace/pixelpets/design/` is a private, gitignored repo backed up to `arbiter1170/pixelpets-design` (`master`). It is never committed into the game repo.

1. Specs must be buildable: exact data, acceptance tests, open questions with defaults and colours, and size estimates where useful. List every decision id and acceptance line plainly, so the build's spec-match table (`walklings-pr-handback` item 7) can go through them row by row.
2. After any edit run every checker: `for f in design/specs/*_check.py; do python3 $f; done` plus `node design/specs/battle_check.js`. Re-render previews with `--render` when the data changes. Keep the checkers' string expectations in sync with the approved wording.
   **Anchor checkers by text, never by line number.** Find code by a unique string or function name (for example `src.index('function closeBattle')`) and check within that block. A line-number anchor breaks on every merge and reports moved code as failures. When a checker fails after a merge, first check whether the code only moved before calling it a real failure.
3. **Packet checkers must run against a game checkout.** A cloud agent runs the checker from the root of a plain `pixelpets` clone, with no `design/` folder next to it. Before marking a packet ready, copy its checker into a fresh game checkout (for example `git worktree add /tmp/pp-check origin/main`) and run it from that folder. It must run without crashing and report a clear pass or fail. Fix any hardcoded `design/` paths or missing inputs first. Attach the checker to the packet.
4. Mark decisions in the spec (APPROVED / DECIDED / SETTLED, with the date) the same day.
5. Commit as `"PixelPets Design" <design@pixelpets.local>`, then `git push origin master`. If the push is rejected, `git pull --rebase` first (design repo only; game PRs merge main in). Never force-push.
6. When the spec is a cloud packet, also update `handoff/cloud/INDEX.md`. Room packets follow `walklings-room-packet`.
