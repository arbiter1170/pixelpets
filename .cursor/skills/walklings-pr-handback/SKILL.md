---
name: walklings-pr-handback
description: >-
  Use when opening or updating a Walklings pull request. One branch and one PR
  per build, merge main into your branch (never rebase or force-push), the fixed
  hand-back PR body with its spec-match table, and the Supervisor fallback when
  the push or PR open fails.
---
# Walklings PR and hand-back

**Git:** one branch and one PR per build. Never push directly to `main` (it deploys to the live site). Never force-push, never rewrite history, never delete branches. Do not merge your own PR; the Supervisor merges after review (`walklings-cloud-review-merge`). If a push is rejected, `git fetch && git merge origin/main`, then push again. Bugs are GitHub issues labelled green, yellow or red with the build id; fixing commits say `Fixes #N`.

**If the push or opening the PR fails** (for example GitHub sign-in is broken on the box): send the branch name and the full PR body below to the PixelPets Supervisor to open. Never send Vincent a PR form or ask him to open it.

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
4. **How it was tested:** name the feature's own spec file (AGENTS.md: a new system, scene step, save field or player flow ships with one), commands run, widths (320/375/390), console-error result (paste the `pp_textcheck.py` / `npm test` result lines). Run the test-mistake scan in `tools/scans/` (once it lands) and paste its result line: tests must never hardcode `/opt/cursor/artifacts` screenshot paths, and must never take baselines from `git show HEAD:` (use the merge base with `origin/main` instead). Attach screenshots only when the change is visual (new art, layout or colour): at most 3, at 390px unless a layout differs by width, cropped to the changed area.
5. **Build id:** the id written by `bump_build.py`; after merge, follow `walklings-deploy` step 4.
6. **Open questions** with the default you chose (and colour).
7. **Spec match** (cloud and packet builds; write "no spec" for hotfixes). Name the design commit you built from, paste the packet checker's result line, then a table with one row per decision id or acceptance line in the spec:
   ```
   | Spec item | Matched / Differs | Why it differs |
   ```
   Any row marked Differs needs a reason. A build with an unexplained Differs row, or no checker result, isn't ready for review.
8. **Decision ids used** (checked with `walklings-decision-ids`).
9. **Player-visible wording changes** as a table: `| Where | Old | New |` (write "none" if there are none).
