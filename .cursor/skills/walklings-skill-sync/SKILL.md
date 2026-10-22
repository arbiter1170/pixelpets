---
name: walklings-skill-sync
description: >-
  Use when copying Walklings skills between the box library
  (/home/box/agent-data/workflows) and the game repo's .cursor/skills, so the
  newer copy always wins and nothing gets overwritten backwards.
---
# Walklings skill sync

Cloud agents read the repo copies in `.cursor/skills/`; the bots read the box copies. Never copy by hand. Run this per skill.

1. **Fresh checkout.** Work in a branch off `origin/main` in a fresh worktree (for example `git worktree add /tmp/pp-sync -b skills-sync-<date> origin/main`), never in another bot's working copy.
2. **Compare.** For each skill, hash both files: `sha256sum /home/box/agent-data/workflows/<id>/SKILL.md .cursor/skills/<id>/SKILL.md`. Same hash means skip it.
3. **Pick the newer side.** Repo time is `git log -1 --format=%cI origin/main -- .cursor/skills/<id>/SKILL.md`. Box time is the file mtime (`stat -c %y`). Also check the diff: if each side has lines the other lacks, both were edited, so **stop and merge the lines by hand**, keeping every change, before copying anything.
4. **Copy one way only.**
   - Box is newer: copy box to repo and commit on the branch.
   - Repo is newer: copy repo to box (keep the box frontmatter keys), and change nothing in the repo for that skill.
5. **Re-hash** both sides. They must match.
6. **PR body line per skill:** `<id>: box->repo | repo->box | merged, sha256 <first 12 chars>`. Open the PR per `walklings-pr-handback`; the Supervisor reviews and merges it. Never push to main.

Don't: copy a whole folder blind, overwrite a side you haven't diffed, or sync skills that aren't walklings-* or gamedev-*.
