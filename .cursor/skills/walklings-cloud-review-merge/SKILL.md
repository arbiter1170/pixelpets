---
name: walklings-cloud-review-merge
description: >-
  Use when a Walklings cloud or engineer PR reports done and the Supervisor must
  review, catch it up with main, merge it, confirm it's live, and report PR
  status to Vincent.
---
# Review and merge a Walklings PR

1. **Look before merging.** Read the PR body and look at its 390px screenshots. If they weren't committed, capture them from a worktree under `/workspace/wt/`, never `/workspace/pixelpets`, with `PP_PORT` 8801 or higher (never 8791). Hold the merge if:
   - a floor or wall is a busy wall-to-wall brick or tile pattern;
   - a room looks identical to an existing one;
   - a character's look or name clashes with another's;
   - the packet's acceptance list isn't met;
   - the spec-match table or the packet checker result is missing, or a row says it differs without a reason (`walklings-pr-handback` item 7). Send it back to PixelPets.
2. **Check the ids**: run `walklings-decision-ids` step 3 on the diff, and check that palette and look keys don't collide (`walklings-key-collision-check`).
3. **Catch it up**: merge `origin/main` into the branch (never rebase or force-push), regenerate `mapdata`, restamp with `bump_build.py`, then `bump_build.py --check`. Don't rerun the full suite: the PR already pasted one full `PP_TEST RESULT`. After the catch-up, run only the specs for files that conflicted or changed in the merge, plus the smoke spec, with `node tools/pp_test.js <specs>` (real exit code). Run `git status` to make sure no `node_modules` or symlink is staged.
4. **Merge stacked PRs in order**, one at a time, repeating step 3 for the next one after each merge.
5. **Confirm it's live**: check that the Pages deploy Action succeeded, then run `pp_textcheck.py --expect-build <id>` (follow `walklings-deploy` step 4).
6. **One full suite per batch, run detached**: after a batch of merges (or at least once a day with merges), run one full `npm run test:agent` on main from a worktree. Never hold one long background task open for it, because tasks are stopped at 50 minutes. Start it detached with `nohup ... > test-logs/batch-<sha>.log 2>&1 &`, splitting it into one run per phone-width project (320, 375, 390) if the runner supports it. End the task, and on your next turn read only the summary and the real exit code from the logs (grep, don't cat). A test that passes on retry is a flake: note it, don't rerun the suite for it. If a real failure remains, open a green/yellow/red issue with the failing spec and build id.
7. **Report PR status to Vincent. Only the Supervisor does this.** PixelPets, Design and QA send PR and build status to you, not to Vincent. Send him one message per real change (PR ready for review, merged and live with its build id, held and why, or a failed batch), batched when several land together. Don't restate status another bot already sent. Comment the live build id on the PR, add the `walklings-handoff-log` line, and attach a screenshot only when the change is visual.
8. If the review fails, send Vincent the screenshots and the specific problem, ask whether to fix it or merge as is, and don't merge in the meantime.
