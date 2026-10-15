---
name: walklings-wording-check
description: |
  Use before committing any player-visible text, docs or PR text for Walklings, to catch franchise, brand or banned genre wording.
---

# Walklings wording check

1. **Everything stays original.** No franchise names, creature designs or genre-borrowed wording. Never write the brand name of the classic virtual-pet toy anywhere (code, comments, docs, PR text); say "daily care". In **player-visible** text never use "fainted", "evolve", "coins", "appeared", "Go, X!" or any "-dex" word (existing code identifiers such as `dexGrid` or `isFainted` stay as they are: IDs never change).
2. **Approved vocabulary** (WORDING_PASS, approved Oct 9, 2026): Walkling / Walklings; wild; "A wild X wanders out!"; "You're up, X!"; "worn out" / RESTING; "grow up" / GROW UP; MOVES / LEAVE; the **Party** header (e.g. "Party 2/6"); TEAM / WALKLING-BOX; WALKLING JOURNAL; Neighbour Rook; Lantern House; Acorns; glow. Glimmerwell's voice: "Have a bright day!", "units", "partnership", "relocating", Comfort Lamps, Glow Census, quarterly targets, Junior Bright.
3. Line rules: one `say` body <= 110 characters; ambient lines and toasts <= 40; choice labels <= 30; no double space; straight quotes; no unknown `{token}`.
4. Scan the diff:
   ```
   git diff origin/main -- . ':!*.png' | grep -inE '^\+.*\b(faint(ed)?|evolv|coins?|appeared|go, [a-z]+!|[a-z]+dex)\b'
   ```
   plus a case-insensitive grep for the toy brand name (do not write it into any file). Every hit in player-visible text is fixed or justified as an unchanged id.
