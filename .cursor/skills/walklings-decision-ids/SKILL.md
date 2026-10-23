---
name: walklings-decision-ids
description: >-
  Use before reserving, writing or merging any Walklings D or Q id, so parallel
  PRs and the design repo don't drift or collide.
---
# Walklings decision ids

The `OPEN_DECISIONS.md` header has drifted before, and parallel PRs have grabbed the same ids. Never trust a single source.

1. **Find the real next free id**: one past the HIGHEST of:
   - the `OPEN_DECISIONS.md` header and its highest row, plus `archive/DECISIONS_SETTLED.md`;
   - the design specs: `rg -o 'D1[0-9]{2}' design/specs | sort -u`;
   - open PR bodies and diffs: `gh pr list --state open --json number,body` and `gh pr diff <n> | rg -o 'D[0-9]{2,3}'`.
2. **Reserve a block** in the header, naming the owner: `D161–D165 reserved: <PR or packet>`. Bump the header's next-free line in the same commit. If you can't commit to the game repo yourself (Design reserves in the design repo), send the build or the Supervisor the **exact** `OPEN_DECISIONS.md` header lines to paste: the next-free line and each reserved-range line, written in the format `tools/scans/decisions.js` accepts (copy an existing passing line, then run `node tools/scans/decisions.js` after pasting). The next build PR pastes them unchanged, so the repo header never lags the design repo.
3. **Before merging any PR**, grep its diff for D/Q ids and check that none is already taken on main or by another open PR. Report a collision; never silently renumber.
4. **Settle in both repos on the same day**: design spec marked SETTLED, game-repo row moved to `archive/DECISIONS_SETTLED.md`.
5. Never reuse or renumber an existing id (D37 is used twice on purpose).
