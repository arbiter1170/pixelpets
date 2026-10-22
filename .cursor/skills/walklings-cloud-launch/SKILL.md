---
name: walklings-cloud-launch
description: >-
  Use when launching a Cursor cloud agent to build an approved Walklings Design
  packet or spec.
---
# Launch a Walklings cloud build

1. **Check that it's ready**: the packet or spec is APPROVED, and its open decisions are settled or have defaults. It isn't blocked by an unmerged PR (see `handoff/cloud/INDEX.md` Status). Note anything in flight that touches the same files.
2. **Re-check the design tip right before launch.** In `design/`, run `git fetch && git status` and make sure you're on the latest `origin/master`. Then confirm that the spec files you're about to attach are the versions at that commit, not an older local copy. Put the design commit hash in the launch prompt.
3. **One agent, one PR per packet.** Launch on the repo URL `https://github.com/arbiter1170/pixelpets` with the model and effort the team has agreed (currently grok-4.7, reasoning effort high), and give it a clear title.
   - **Hotfixes (approved by Vincent, careful use):** use the cheaper route only when the cause is already pinned to the exact line and the fix is a few lines. Either the lead engineer fixes it locally, or launch with a lower reasoning effort. It must still add or extend a test for the bug, run the affected specs plus smoke, and be covered by the next full-suite run on main. Anything wider, unclear, touching saves or online code, or a second attempt goes the normal route.
4. **Attach the spec as files** (and preview PNGs as images). The design repo is private and the agent can't fetch it. Before launching, check that every spec file and packet checker named in the packet is actually attached. If one is missing, don't launch; the agent will guess ids and wording. In the prompt, name each spec by its design path and commit (`specs/<FILE> @ <hash>`, attached as `uploads/<FILE>`) and include this line verbatim: "If any uploads/ file named here is missing, stop and report which one. Don't search the filesystem and don't guess." Crop the user's full-size phone screenshots to the relevant area before attaching them to agents or messages.
5. **Paste the standard rules into the prompt:**
   - **Gamedev skills:** name the gamedev-* skills in `.cursor/skills/` that match this build (for example gamedev-game-ai for movement or pathfinding, gamedev-save-systems for save code), and tell the agent the spec and walklings-* skills win on any conflict;
   - **Build to the spec, don't redesign it:** where the spec names a mechanism (for example polls at set intervals instead of listeners, or no new rules block), use exactly that. If you think the spec is wrong, build it as written and raise the concern under Open questions in the PR;
   - **Run the packet's checker** (attached) against your game checkout before handing back, and paste its result line in the PR;
   - **Fill in the PR's spec-match table** (`walklings-pr-handback` item 7). Paste this template into the prompt as is: `Design commit: <hash> | Checker: <result line>` then `| Spec item | Matched / Differs | Why it differs |` with one row per decision id or acceptance line;
   - **Tiered testing:** iterate with `node tools/pp_test.js <spec>` on the specs you touch. Run one full `npm run test:agent` at the end, before handing back. After a catch-up merge or a review fix, rerun only the affected specs plus smoke, not the full suite. Read only the summary and the real exit code, never pipe it; grep `test-logs/run.log`, don't cat it; paste the `PP_TEST RESULT` line in the PR;
   - never commit `node_modules` or a symlink to it; run `git status` before each commit;
   - `tools/gen_mapdata.py` after map data changes; stamp with `tools/bump_build.py`;
   - save stays v2;
   - use only the decision ids the packet reserves (`walklings-decision-ids`), recording settled rows without renumbering;
   - no franchise or brand wording; no two rooms may look identical; interiors use the INTERIOR_WALLS wall kit;
   - one branch; merge main in, never rebase or force-push;
   - don't merge your own PR;
   - attach screenshots only for visual changes, at most 3, at 390px, cropped to the changed area.
6. **Name the overlaps**: tell the agent which other PRs touch the same files, so it merges main in and keeps both sides. Stagger agents that edit game.js: don't launch a second game.js-heavy build while one is mid-run unless it's urgent; queue it instead.
7. **Record the launch** (agent link, time, design commit hash, and later the PR number) in `handoff/cloud/INDEX.md` and tell the Supervisor, with a link for each agent. Don't send Vincent launch or PR status; the Supervisor reports it (`walklings-cloud-review-merge` step 7).
8. When it reports done, check the spec-match table and checker result are in the PR before passing it on. If either is missing or a row says it differs without a reason, send it back to the agent first. Then follow `walklings-cloud-review-merge`.
9. **Repo skill copies:** cloud agents read `.cursor/skills/` in the pixelpets repo, not the box copies. Whenever a box copy of a `walklings-*` skill changes, include an exact sync of the repo copy in the next build PR (or a small PR of its own), and attach the box copy as a file so the agent can do it.
