---
name: walklings-qa-run
description: >-
  Use when PixelPets QA (or the engineer) runs a scoped check of a named live
  build: seeded saves, pp_verify suites, phone widths, bug write-up. Extends
  walklings-qa (play + add a Playwright check); read that skill for how checks
  are written.
---
# Walklings QA run

Base skill: `.cursor/skills/walklings-qa/SKILL.md` (play the path, add a check). This adds the team run routine.

1. Only run what the Supervisor cleared; stop the moment Vincent says hold. Keep runs short and scoped. When building the check list, load the gamedev-* skills that match the change (game-feel, game-ui-ux, level-design for pacing, save-systems for reload and corrupt-save checks, dialogue-systems and town-chatter for dialog). They add things to check, never things to fix.
2. Live build first, text only: `python3 /workspace/pp_verify/pp_textcheck.py --expect-build <id>` (cache-busts, prints the build line, DOM checks, console errors and 320/375/390 overflow; exit 0 = pass). Record the build id it prints. No screenshot unless it fails or you pass `--visual`.
3. Private suites: `/workspace/pp_verify` (Playwright, built on `ppbase.py`), `PP_URL` pointing at live, `run_all.sh` for all. In-repo: `npm run test:agent` (summary + real exit code; grep `test-logs/run.log`, don't read it whole). It first runs the fail-closed scans in `tools/scans/` (wording, decision ids, symlinks); a `SCAN FAIL` stops the run before Playwright. Layout-free tests tagged `@w1` run at 320 only; 375 and 390 skip that tag. A new untagged test still runs at 320, 375 and 390. The suite `retries` is 1, and a pass on the retry is flaky (exit 0, flaky count and names in the summary); report every flaky name. Prefer `node tools/pp_test.js <spec>` for a scoped run; a full run is about 1,050 runs and takes about 16 minutes, so run it detached with log files.
4. Seed a v2 save that stops one step before the change (`starterSave()`, `installSave`, `gotoGame(page, '?debug=1')`); start from a new game only for the opening, phone, bag or faction pick. Seed `player.look` when asserting toasts.
5. Check 320, 375 and 390 px (320x568, 375x667, 390x844), tap targets >= 44 px, zero console errors. Report these as text (assertion output, counts, sizes). Take a screenshot only for a failure you are writing up, or when the check is about how something looks (art, layout, colour); send it to Vincent 1:1, never to the group.
6. Known timing traps: boot hint toasts ~900 ms–3 s; wait for the befriend meter to arm. Issue #1 (verify_keeper K6) is a known flake.
7. Bugs: spoiler-free write-up using the `docs/QA_PLAN.md` template, colour, build id; drafted for the Supervisor, not filed or posted without approval. Verify fixes on a named build id. Real-iPhone checks for Vincent are short numbered scripts.
8. QA never edits game code, specs or suites.
