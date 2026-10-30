---
name: walklings-lore-feed
description: |
  Use when adding, editing or reviewing Walklings NEWS stories (data/news.json, the Block News app) or Ribbit posts
  (data/ribbit_posts.json), or when lore_check.py --game fails on a feed.
  Check the lore stamp first and re-read the lore for every entity a line mentions; cite lore ids, gate with when
  terms, keep chips off the Keeper side, run the checks, and ship the batch as placeholder copy in a PR.
---

# Walklings lore feed

The NEWS app prints one Block News edition per real day from `data/news.json` (engine `news.js`); Ribbit adds `data/ribbit_posts.json` to the posts in `ribbit.js`. Spec: design `specs/NEWS_FEED.md` (voices, sections, lengths, D1012-D1014). Lore: design `lore/lore_index.json`, read from `STORY.md`. Status docs: `walklings-docs`.

## Before writing (every batch, every time)
1. Pull the design repo. Compare `head -1 STORY.md` with `lore_version` in both feed files. If it moved, run `walklings-lore-index` first, then re-check the whole feed, not only your new lines.
2. List the entities your lines will mention. For each, read its index entry and then the STORY.md section its `ref` names, in full. Read again for the next batch: the lore moves daily, and a line that was true last week may now be PLAN, renamed or secret.
3. Read the nearby lines already in the feed for that region, so a new line doesn't repeat or contradict them.

## Writing a line
- Shapes. Story: `{id, section, desk, headline, body[1-3], region, when, lead?, art?, replies?, sky?, phase?, me?, lore[]}`. Post: `{id, kind: local|block|chirp, region, name, handle, when, text, lore[]}` (`name`/`handle` for locals only). Ids: `nw-<region>-<word>` and `rp-<region>-<word>`; never reuse or rename a shipped id.
- Facts come only from cited entries: BUILT, or CANON with every `reveal` flag in `when`. Never PLAN or OPEN. No new names, places, numbers or events (AGENTS rule 8); if a line needs one, leave it out and raise a design question.
- Flavour is welcome (D1015): unnamed role-label townsfolk, opinions, jokes, weather and small moments, built on those facts. It never adds a proper name, shop, place, event, number or species.
- Formats beyond stories (spec §4a): `voices`, `notices` (ads only with `story.side=glimmer`), `polls` (three options, one tap), `you` (tokens `{holder}` `{partner}` `{town}` `{seals}` `{steps}` only). Stories may add `art` (a species id the lore puts there, with its reveal gate), `replies`, and `sky`/`phase`/`me` gates.
- `when` carries each cited entry's `reveal` flags. Retire stale news with `!flag` (lamps lit before `story.glen_cleared`). Heights lines need `story.heights_done`; "sold" lines need `story.quarry_bought`.
- Chips, the Tuning and implants: `story.side=glimmer` only, hinted, never confirmed (CHIP_SECRECY §1). Bright Notice copy runs in GLIMMERWELL or on the Glimmer side.
- `lead: N` only for a story beat that should headline once reached; N follows story order (higher is later). One lead per beat.
- Lengths: headline 48, body line 110, post 100. Straight quotes, no `{tokens}`, holder/Walkling/Acorns/Trial Hall/Neighbour, capital-K Keeper. Run `walklings-wording-check`.

## Checks
1. `python3 tools/gen_mapdata.py` (never hand-edit `data/mapdata.js`).
2. In the design repo: `python3 lore/lore_check.py --game ../pixelpets` prints PASS.
3. `npm run test:agent news` and `npm run test:agent ribbit` (both devChecks are inside).
4. Copy-only batches are data changes that deploy: `python3 tools/bump_build.py` before the commit, per `walklings-deploy`.

## Done
A PR (`walklings-pr-handback`) whose body lists the STORY.md version read, the sections re-read, and the count of new lines by region. New copy is placeholder under D1013 until Design signs it; say so in the PR. Never publish the index or STORY.md text in this repo or the PR.
