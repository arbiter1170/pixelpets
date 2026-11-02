---
name: walklings-lore-index
description: |
  Use when STORY.md in the design repo changes version, when lore_check.py fails on a stamp, or before a batch of NEWS
  stories or Ribbit posts needs a lore entry that is not in the index yet.
  Re-read the changed STORY.md sections, update design lore/lore_index.json (quoted facts, status, reveal flags,
  secret), bump its story_version, and run lore/lore_check.py until it passes.
---

# Walklings lore index

`STORY.md` (private design repo) is the single source of truth. `lore/lore_index.json` is its structured read: one entry per place, faction, person, creature, term, thing or story event, so the phone feeds can cite lore by id. The index lives only in the design repo; never copy its entries, facts or CANON/PLAN text into this public repo.

## When the version moves
1. `head -1 STORY.md` and compare with `story_version` in `lore/lore_index.json`. If they match and you only need a new entry, skip to step 4.
2. Read the version notes at the top of STORY.md down to the old version, then `git log -p --follow STORY.md` back to the commit that last stamped the index. List every section (`§N`) the change touched.
3. Read each touched section in full (`rg -n '^## ' STORY.md`, then read through the next `## `). Never work from memory or from the version note alone.
4. For each entity in those sections, add or fix its entry:
   - `id` is `kind.snake_name`; never rename an id a feed cites (`rg -n '"<id>"' ../pixelpets/data/news.json ../pixelpets/data/ribbit_posts.json`). Retire one by setting its status, not by deleting it.
   - `facts` are 1-4 short verbatim quotes from the `ref` section(s). The checker ignores `**` and line breaks only.
   - `status` follows STORY.md's tag for that fact (BUILT, CANON, PLAN, OPEN). A BUILT/CANON split gets two entries.
   - `reveal` is the game `story.*` flag(s) at which the player first meets it; `[]` only for start-of-game knowledge. Confirm each flag with `rg -n "<flag>" ../pixelpets/quests.js ../pixelpets/game.js` (grep only; never read game.js whole).
   - `secret: true` for chips, the Tuning, implants, and any twist the built game has not shown (CHIP_SECRECY §1). When unsure, mark it secret.
5. Bump `story_version` to STORY.md's version.
6. `python3 lore/lore_check.py` (index only), then `python3 lore/lore_check.py --game ../pixelpets`. A feed failure now means a published line cites something whose status or gate changed: fix the line in the game repo with `walklings-lore-feed`, and bump the feeds' `lore_version` there in the same game PR.
7. Commit in the design repo with `walklings-design-commit`; name the STORY.md version and the sections re-read.

## Must hold
- No fact without a quote. If STORY.md doesn't say it, the index doesn't either; raise the gap in STORY.md §13 instead.
- PLAN and OPEN entries stay in the index (so writers can see they are off limits) but never publish.
