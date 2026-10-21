---
name: walklings-handoff-log
description: >-
  Use at the end of a Walklings work session or handoff: one log line per PR,
  status docs, board, and telling only the teammate the line is for.
---
# Walklings handoff log

1. **One line per PR**, at the top of your handoff/log file, newest first:
   `YYYY-MM-DD HH:MM ET | PR #N | <commit> | build <id> | <what shipped, <= 12 words> | open: <item or none> | review: <who or none, e.g. Supervisor merged>`
   No session essay. Detail lives in the PR body (`walklings-pr-handback`).
2. Status docs go in the same change (`walklings-docs`). Board moves: `walklings-board` (Supervisor only).
3. Send that same line directly to the one teammate it's for, and only for a handoff, a vote or a blocker. No thanks or "got it" messages. Text only. Images/audio, Firebase, sign-ins, account setup and spending stay in Vincent's 1:1.
4. **PR and build status reaches Vincent only from the Supervisor.** After a live change, the engineer sends the line plus the `pp_textcheck.py` RESULT line to the Supervisor, not to Vincent. The Supervisor sends Vincent one batched status message (`walklings-cloud-review-merge` step 7), with a screenshot only when the change is visual.
5. Supervisor: after each `docs/INDEX.md` update, commit and push the docs repo (`git pull --rebase` first, never force-push).
