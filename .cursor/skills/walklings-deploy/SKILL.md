---
name: walklings-deploy
description: >-
  Use before any Walklings commit that will deploy (code, data, HTML or CSS) and
  after a merge goes live. Stamp the build, ship through a PR, then hard-refresh
  and confirm the build line matches.
---
# Walklings deploy

1. Small, single-feature commits. Run `python3 tools/bump_build.py` before **each commit that will deploy** (any change to code, data, HTML or CSS). It stamps `?v=` on every local script/link in `index.html`, sets `window.BUILD` and the `kw-build` meta tag, and writes `version.json`. `python3 tools/bump_build.py --check` must exit 0, then `npm run test:agent` must exit 0; paste its `PP_TEST RESULT` line in the PR. A full run takes 21–23 minutes: start it detached (`setsid`, output and exit code to log files) or with a shell timeout over 25 minutes, use a free `PP_PORT` of 8801 or higher, and set `PP_ART` to a writable folder. Revert any changed `screenshots/` files; never commit them. Docs-only changes do not need a new stamp.
2. After editing any `data/*.json`, also run `python3 tools/gen_mapdata.py` to regenerate `data/mapdata.js`. Do not hand-edit `data/mapdata.js`.
3. Ship through a branch and PR (see `walklings-pr-handback`). Never push directly to `main`: Pages deploys from `main`.
4. After the Supervisor merges, check that the Pages deploy Action succeeded (a committed `node_modules` symlink once broke it; `.gitignore` must say `node_modules`). Then: GitHub Pages caches about 10 minutes. Hard-refresh or cache-bust (`https://arbiter1170.github.io/pixelpets/version.json?r=<random>`, game with `?r=<random>`), then confirm `window.BUILD`, `version.json` and the Settings **Build** line all match. Run `python3 /workspace/pp_verify/pp_textcheck.py --expect-build <id>`: it does the cache-bust and the three-way match and exits 0 on a match. Paste its `RESULT` line; no screenshot needed.
5. Every report on what's live includes the build id. Add a PR comment with the build id that went live.

Done when: the three build values match on live, and the build id is in the PR and the report.
