---
name: walklings-deploy
description: |
  Use before any Walklings commit that will deploy (code, data, HTML or CSS) and after a merge goes live.
  Stamp the build, ship through a PR, then hard-refresh and confirm the build line matches.
---

# Walklings deploy

1. Small, single-feature commits. Run `python3 tools/bump_build.py` before **each commit that will deploy** (any change to code, data, HTML or CSS). It stamps `?v=` on every local script/link in `index.html`, sets `window.BUILD` and the `kw-build` meta tag, and writes `version.json`. `python3 tools/bump_build.py --check` must exit 0. Docs-only changes do not need a new stamp.
2. After editing any `data/*.json`, also run `python3 tools/gen_mapdata.py` to regenerate `data/mapdata.js`. Do not hand-edit `data/mapdata.js`.
3. Ship through a branch and PR (see `walklings-pr-handback`). Never push directly to `main`: Pages deploys from `main`.
4. After Vincent merges: GitHub Pages caches about 10 minutes. Hard-refresh or cache-bust (`https://arbiter1170.github.io/pixelpets/version.json?r=<random>`, game with `?r=<random>`), then confirm `window.BUILD`, `version.json` and the Settings **Build** line all match.
5. Every report on what's live includes the build id. Add a PR comment with the build id that went live.

Done when: the three build values match on live, and the build id is in the PR and the report.
