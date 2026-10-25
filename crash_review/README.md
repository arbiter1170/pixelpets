# Crash review pack (for the PixelPets Contracted Engineer)

**For: the PixelPets Contracted Engineer (Claude Code, independent).**

> **READ-ONLY. Make no commits, pushes, branches, PRs, issues, comments or deploys. Never touch Firebase or any live service. Report findings to Vincent only.**

This branch (`crash-review`, cut from `main` at `045ffa1`, build `20261025-0736`) adds only this `crash_review/` folder. No game code, tests, HTML or CSS changed. It is not a PR and will not be merged as is.

## What we want from you

Walklings (repo `arbiter1170/pixelpets`) is a vanilla-JS canvas game. Its main target is **iPhone Safari**. Since Oct 15, 2026 it has reloaded or "crashed" on players' phones about ten times. We shipped a series of fixes (see [FIXES.md](FIXES.md)). Some had clear causes; several were "best guesses" that never got a real-iPhone confirmation.

Please review the crash history, the fixes and the current code, and tell Vincent:

1. Causes we missed, or fixes that look wrong or incomplete.
2. Places in the current code that still look risky on iOS WebKit: memory or object counts, canvases, WebAudio, timers, listeners, reload paths, service worker, cloud adopt, presence.
3. Cheap ways to tell the remaining causes apart: diagnostics we should add, or tests we should write.

Order findings by likely impact. Cite `file:line` on `main` at `045ffa1`. Mark each one as confirmed (you reproduced it), likely, or speculative.

## Files

| File | What it holds |
|---|---|
| [TIMELINE.md](TIMELINE.md) | Every reported crash or reload, with time (ET), build, device and what was on screen. |
| [FIXES.md](FIXES.md) | Every crash-related PR: merge sha, live build, what it changed and what it left open. |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | Leads we have not closed, and specific questions for you. |
| [ORG_CHART.md](ORG_CHART.md) | Who is who, including your role. |
| [evidence/](evidence/README.md) | Cropped Settings screenshots, and soak and repro measurements from our desktop WebKit and Chromium runs. |

## Team rules (summary of [AGENTS.md](../AGENTS.md))

Read [AGENTS.md](../AGENTS.md) itself. It wins over this summary. The rules that matter for this review:

- **Crashes and QA fixes are priority one.** They go ahead of new features.
- **The save stays v2 with no migrator.** The key is `pixelpets.save.v2`, and `v` stays `2`. Fields are additive only, via `normalizeV2`. Never rename or remove save keys, flags, ids or `window.PixelPets.*` hooks. Old saves must load. Any fix you propose must fit this.
- **One `game.js` build at a time.** Only one build that touches `game.js` is in flight, so parallel PRs don't collide in the 17k-line file.
- **Never force-push or rebase.** Work goes on a branch through a PR, and nobody merges their own PR. (You are read-only anyway.)
- **Firebase: Walklings uses `walklings-4cc89` only.** Its public web config is in `cloud_config.js`. Tests must not sign in or write to it. No other Firebase project may ever be touched. No new projects or rules edits without Vincent.
- **Wording:** the game is original. No franchise names, and never the classic virtual-pet toy brand name (say "daily care"). Player text avoids the genre words listed in AGENTS.md rule 1 (the `walklings-wording-check` skill has the scan). Say **holder** for a person who battles, **Keeper** (capitalised), **Acorns** for the currency, and **grow up** for a stage change. Some old code and test ids still carry genre words. Those ids are frozen: don't rename them, and keep them out of player text.
- **No room or colour change ships without Vincent seeing a before/after** and saying yes (AGENTS.md rule 9). Colours come only from `PAL` in `sprites.js`.
- **Decisions are green, yellow or red.** Green: the owner decides and notes it. Yellow: waits for a team vote (48-hour ET clock). Red needs Vincent's yes before anyone builds it. Red covers big interface changes, new towns, routes or levels, core functionality, iPhone behaviour (e.g. audio, location prompts) and legal or naming. Several crash fixes touched iPhone behaviour, so they were red.
- **D/Q ids** (decision and question rows in `OPEN_DECISIONS.md`): the next id is one past the highest found in `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, the design specs and every open PR. Reserve a block in the header, naming the owner. Check a PR's ids for collisions before merging and report any you find; never renumber silently. Never reuse or renumber an existing id (D37 is used twice on purpose). If you suggest a decision, leave the id blank; the Supervisor assigns it.
- **Debug hooks stay inert without `?debug=1`.**
- **Phones:** 320, 375 and 390 px wide; tap targets 44 px or more; zero console errors.

## How to run it locally

```bash
npm ci
python3 -m http.server 8000      # in the repo root, then open http://localhost:8000
# ?debug=1 turns on the debug panel, refreshEnv, the full error list and Copy crash info with no crash
```

Opening `index.html` as a file also works, but without location.

Tests (Playwright, Chromium with mobile emulation at 320/375/390):

```bash
npm run test:agent -- tests/memory_walk.spec.js --project=390   # one spec, one width
npm run test:agent                                              # the whole suite, plus the RTDB rules emulator precheck
npm run test:slow                                               # @slow only (e.g. aura_perf)
node tools/scans/run.js                                         # static scans
```

- `@w1` tests run at 320 only, so asking `ios_reload.spec.js` for `--project=390` reports "No tests found".
- `PP_PORT` sets the server port. `PP_URL` points at a running server.
- The suite never talks to the live Firebase project. Cloud specs use local emulators only.
- We have no real-iPhone automation. Desktop WebKit runs (Playwright `webkit`) are what the evidence was measured with. Desktop RSS is not phone memory.
- `game.js` is about 17k lines. Use `tools/GAMEJS_MAP.txt` to find a function's line range.

## Key code for this review (at `045ffa1`)

| Area | Where |
|---|---|
| Reload breadcrumbs, heartbeat and diag (`pp_reload`, `pp_reload_last`, `pp_alive`, `pp_hidden`, `pp_errors`, `pp_diag`) | `game.js` `markReload` ~423, `writeDiag` ~443, `takeReloadCrumb` ~512, `watchReloads` ~533, `hasCrashReload` ~656 |
| Canvas freeing | `game.js` `freeCanvases` 32; building cache `BLD_CAP` ~5592–5706; wall masks ~5922 |
| WebAudio notes and music | `sfx.js` `endChain` / `sweepChains` ~81–105, `schedule` ~601, `stopTrack` / `startTrack` ~626–648, visibility handling ~73 |
| Shared sprite sheets | `sprites.js`, plus the `#artSheet` / `#accSheet` code in `game.js` `boot` ~16769–16880 |
| Cloud compare and adopt (one reload path) | `cloud.js`: `compare` ~117, the adopt guard `pixelpets.adoptAt` ~46, and the `H.busy()` checks ~106 and ~277 |
| Location | `env.js` (permState, keepLastArea) |
| Service worker | `sw.js` (no skipWaiting since #75) |
| Play together and presence (other holders on screen) | `net.js` (off unless cloud is on and a room code is set) |
| Settings "Last reload" line and "Copy crash info" | `game.js` (search `Copy crash info`), `tests/crash_copy.spec.js` |

## Reload reasons you will see

`cloud`, `build`, `boot`, `startover`, `copy`, `bfcache`, `newer`, `unknown`, `crash`, `background`.

- **`crash?`** means the page died while visible: the `pp_alive` heartbeat (every 5 s) was there with no `pagehide`. It cannot tell an iOS memory kill (jetsam) from a WebContent process crash. Either way Safari reloads the tab.
- **`background`** means the alive mark and the hidden mark were both found.
- **Copy crash info** copies `{diag, reloads, build}` to the clipboard. Nothing is sent anywhere. It shipped in build `20261024-2031`, and we have **no** copied reports from a real phone yet.
