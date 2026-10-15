---
name: walklings-handoff-log
description: |
  Use at the end of a Walklings work session or handoff: session summary, status docs, board, and the group-chat post.
---

# Walklings handoff log

1. At the top of your handoff/log file add a short **Session summary**: what shipped (commit + build id), what's open, and what needs review.
2. Update status docs in the same change (`walklings-docs`) and move matching board items (`walklings-board`, Supervisor only).
3. Project Puxel group chat: post only handoffs, commit hashes with build ids, votes or blockers. No thanks or "got it" posts. @mention only the agent the message is for. Text only; images/audio go to Vincent 1:1. Firebase, sign-ins, account setup and spending happen only in Vincent's 1:1.
4. After a live change, the engineer sends Vincent a short, friendly 1:1 update with screenshots and the build id.
5. Supervisor: after each `docs/INDEX.md` update, commit and push the docs repo (`git pull --rebase` first, never force-push).
