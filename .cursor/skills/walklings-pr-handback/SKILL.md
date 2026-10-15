---
name: walklings-pr-handback
description: |
  Use when opening, updating or rebasing a Walklings pull request.
  One branch and one PR per build, rebase not force-push, and the fixed hand-back PR body.
---

# Walklings PR and hand-back

**Git:** one branch and one PR per build. Never push directly to `main` (it deploys to the live site). Never force-push, never rewrite history, never delete branches. Do not merge your own PR; Vincent merges. If a push is rejected, `git pull --rebase` and push again. Bugs are GitHub issues labelled green, yellow or red with the build id; fixing commits say `Fixes #N`.

The PR description must contain, in this order:
1. **CHANGELOG entry** in this format:
   ```
   ## YYYY-MM-DD HH:MM ET: <short title>
   - What changed and why:
   - Files touched:
   - Commit(s) + build id:
   - Tests run and result (widths, checks):
   - Decisions made (colour + reasoning):
   - Anything left unfinished:
   ```
2. **What changed** (plain-language summary).
3. **Files touched** (list).
4. **How it was tested:** commands run, widths (320/375/390), console-error result, and **screenshots attached to the PR** for each width named in the build's acceptance tests.
5. **Build id:** the id written by `bump_build.py`; after merge, follow `walklings-deploy` step 4.
6. **Open questions** with the default you chose (and colour).
7. **Player-visible wording changes** as a table: `| Where | Old | New |` (write "none" if there are none).
