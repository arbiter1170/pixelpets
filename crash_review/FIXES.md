# Crash-related fixes

PRs are in `arbiter1170/pixelpets`. Merge times are ET, October 2026. "Live build" is the build stamp the PR shipped with. Read each PR's body and diff on GitHub (`gh pr view N`, `gh pr diff N`). Only read them; don't comment.

There are **13 fixes** in 13 PRs. #169 and #185 are side fixes found along the way.

| PR | Merge sha | Live build | Merged (ET) | For incident(s) |
|---|---|---|---|---|
| #71 | 0549dd1 | 20261015-1336 | Oct 15, 2:08 PM | 1 |
| #75 | 4994a5e | 20261016-0021 | Oct 16, 1:23 AM | 2 |
| #106 | 8128377 | 20261019-2143 | Oct 19, 9:46 PM | 3 |
| #141 | 9b1459a | 20261022-0217 | Oct 22, 2:38 AM | 4, 5 |
| #164 | 85a12e9 | 20261023-2200 | Oct 23, 10:15 PM | 6 |
| #165 | d47b0d8 | 20261023-2232 | Oct 23, 10:46 PM | 6 |
| #167 | 2183680 | 20261023-2250 | Oct 23, 11:00 PM | 6 (diagnostics) |
| #169 | c3de1e8 | 20261024-0009 | Oct 24, 12:22 AM | 6 (how a reload feels) |
| #181 | 1b41bd3 | 20261024-1228 | Oct 24, 1:06 PM | 7 |
| #182 | db9fdcf | 20261024-1310 | Oct 24, 1:19 PM | 7 (location prompt) |
| #183 | 7fe48c2 | 20261024-2031 | Oct 24, 9:47 PM | 8–10 |
| #184 | 8ddb7e6 | 20261024-2236 | Oct 24, 11:25 PM | test follow-ups |
| #185 | 21399e2 | 20261025-0004 | Oct 25, 1:35 AM | basket double YES (found in #184) |

## What each one did, and what it left open

### #71: stale page boot
- **Changed:** element binds are null-safe. A boot failure reloads once with `?b=`. `sw.js` fetches no-cache.
- **Test:** `tests/p0_stale_page.spec.js`, `tests/p0_trainer_win.spec.js` (frozen file name).
- **Open:** what triggered the reload was never found.

### #75: random reloads every few minutes
- **Changed:**
  - The worker no longer calls `skipWaiting`, so it never takes over an open page.
  - The boot retry is guarded via `?b=boot.`.
  - Redirects return a plain 200 instead of `redirect:'manual'`.
  - Finished music notes are disconnected.
- **Test:** `tests/ios_reload.spec.js` (`@w1`, 320 only).

### #106: reloads during battles
- **Changed:**
  - Cloud sync waits for `busy()`, and adopt refuses while an overlay or battle is up.
  - The new-build bar (`#buildBar`) is hidden in battle, and its tap can't reload one.
  - The reload breadcrumb (`pp_reload`, Settings "Last reload").
- **Test:** `tests/battle_no_reload.spec.js` (cloud check at 390 only).
- **Open:** no mid-battle checkpoint. A reload during a battle still loses it.

### #141: crash? in battle and on People
- **Changed:**
  - Portraits are pooled (LRU, cap 128).
  - The jingle gain node is disconnected.
  - The heartbeat records screen, phase, live canvases, portraits and canvases made.
  - `pp_hidden` and the "background" reason were added, along with nav/standalone/sw/gap/wasDiscarded fields and `pp_errors`.
- **Test:** `tests/portrait_cache.spec.js`, `tests/reload_diagnostics.spec.js`.

### #164: cloud adopt reload at most once per 10 minutes per tab
- **Changed:** uses sessionStorage `pixelpets.adoptAt`. A second change within 10 minutes asks instead of reloading.
- **Test:** `tests/battle_no_reload.spec.js`.
- **Open:** two tabs on one device share the `pixelpets.cloud` device record, so they can see each other as "another device" and keep adopting.

### #165: canvas footprint trim
- **Changed:**
  - `freeCanvases` zeroes canvases that are dropped.
  - The building cache is capped at 3 maps (`BLD_CAP`), and the `wallMasks` map at 3.
  - The collection grid is freed on close.
  - Eviction is FIFO.
  - Keeper and face caches are deliberately untouched: drawing a zeroed shared canvas throws.
- **Open:** the PR says it is "not a confirmed crash fix".

### #167: keep `pp_alive` while hidden
- **Changed:** a kill while hidden now reads as "background" instead of "unknown".
- **Test:** `tests/reload_diagnostics.spec.js`.

### #169: boot always lands on the map
- **Changed:** a reload no longer drops the holder on a random tab. This is UX only; it is not a cause fix.

### #181: diag + move-sheet listener leak
- **Changed:**
  - `pp_diag` records taps, screen, canvas MB and DOM size, outside the save.
  - The move sheet uses one delegated listener (`#shList` + a `sheetItems` WeakMap) instead of 11 new click listeners per open.
- **Test:** `tests/crash_growup_people.spec.js`.
- **Open:** the PR says "iOS crash cause still unknown".

### #182: no location prompt at boot
- **Changed:** location is read silently only when the permission is already 'granted' (Vincent's red ruling, Oct 24, 12:52 PM). Otherwise the game keeps the cached area, and only the USE MY LOCATION tap asks.
- **Test:** `tests/geo_boot.spec.js`.
- **Open:** not tried on a real iPhone.

### #183: shared sprite sheets, note deadline, Copy crash info
- **Changed:**
  - Sprites draw from shared sheets. Boot canvases went from 2,112 to 25. Walking 28 maps went from 2,257 → 2,738 canvases on build 1310 to 27 → 32.
  - Notes disconnect on a deadline (`sfx.js` `sweepChains`), because `onended` does not fire while the context is suspended. We measured 172–291 connected nodes before.
  - Settings got the **Copy crash info** button.
  - Signs open on tap only.
- **Test:** `tests/memory_walk.spec.js` (390 only), `tests/crash_copy.spec.js`, `tests/sign_tap.spec.js`.
- **Open:**
  - Desktop WebKit RSS barely fell (about 505–527 MB).
  - Sheet backing memory rose to about 4.6–6.1 MB.
  - Presence with real other holders on screen was not tested. The PR says "if reloads continue, next check is other Keepers on screen".
  - No real-iPhone test.

### #184: test follow-ups
- **Changed:**
  - Five flaky specs fixed.
  - `PixelPets.refreshEnv` gated behind `?debug=1`.
  - Copy crash info shows only when the newest reload is a crash.
  - `memory_walk` now unmutes. Before, the test save muted the game, so **the earlier audio-node checks measured nothing**.
- **Found, not fixed here:** the basket double YES (fixed in #185).

### #185: basket double YES
- **Changed:** a double tap on the basket YES no longer runs twice.

## Older related commits
- `1d44b9d` (Oct 15): the debug-mode fix. Debug is per session, and a save touched by debug is marked. This matters only because debug hooks must stay inert without `?debug=1`.
- `4a6066b` (Oct 21): "split stale from crash". This is a tooling change to how the map stamp check reports stale versus crashed. It is not a game fix.

## Not crash fixes (tangential)
#115 (presence polling) and #131 (overlay guard). Read them only if you follow the presence or overlay leads.

## Crash-related tests and known flakes

**Specs:** `ios_reload`, `battle_no_reload`, `reload_diagnostics`, `crash_copy`, `crash_growup_people`, `memory_walk`, `portrait_cache`, `geo_boot`, `p0_stale_page`, `p0_trainer_win`, `cloud_off`, `save_copy`, `settings_build_line`, `aura_perf` (`@slow`).

**Known flakes** (not crash bugs, but don't mistake them for one):
- `moves_v2` tests 14 and 19: unpinned dice rolls
- `maps_b2` locked stair (camera settle)
- `shop_layout:318`
- `play_together:442`
- the `moves_v2` co-op emulator timeout
- `world_clock:332`
- the `room_zoom_all` 1 px camera difference
- the RTDB rules emulator precheck ("fetch failed")
