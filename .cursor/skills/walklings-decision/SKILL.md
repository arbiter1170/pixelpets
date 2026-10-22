---
name: walklings-decision
description: |
  Use when raising, routing, voting on, or settling a Walklings decision (D/Q ids, green/yellow/red).
  Covers the colour rules, the 48-hour ET clock, red routing to Vincent, and recording the call.
---

# Walklings decisions

Tag every open question **green, yellow or red**, with your suggested default and a deadline in ET.

- **Green** (low risk: bug fixes, implementation choices inside an approved spec): decide it yourself (or the Supervisor settles it), note it in your log or PR, and move on.
- **Yellow** (a judgement call that matters): write it up with a default, then wait for the Supervisor or Vincent; the Supervisor runs a team vote with Vincent tagged (5–10 minutes to weigh in). Don't build it ahead. Outside agents: build against the default behind a single constant and leave the PR in **DRAFT** until Vincent confirms.
- **Red** (new towns, routes or levels; big interface changes; core functionality; anything that changes player-facing behaviour, such as iPhone audio; legal or naming): never build until Vincent approves. Raise it privately with the Supervisor (who takes it to Vincent) before anything is posted to the group. If something ships that pre-empts an open red item, flag the Supervisor at once; it gets reverted or put behind a flag until Vincent decides.
  - **Ideas from gamedev-* skills:** a core-mechanic change a gamedev-* skill inspires is always red. Raise at most one idea per packet or check, on its own, never written into a spec or PR, and never built or flagged in ahead of Vincent's call.
- The 48-hour clock runs from when a question is posted in Project Puxel. On a non-red item with no answer from Vincent, the Supervisor runs a team vote and breaks ties. Red items always wait for Vincent, however long that takes.

## Ids and records
1. New ids: take one past the highest of the `OPEN_DECISIONS.md` header, the design specs and open PRs (follow `walklings-decision-ids`), then bump the header line. Never renumber or reuse a D or Q id (D37 is used twice on purpose).
2. Add a row to the Open table: what the build does today and where to change it.
3. When settled: move the row to `archive/DECISIONS_SETTLED.md` with the date and the call, update code or plan if it changed, and mark the spec APPROVED / DECIDED / SETTLED with the date the same day.
4. Board item: `walklings-board`.
