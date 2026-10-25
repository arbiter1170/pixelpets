# Crash and reload timeline

All times are **ET** (America/New_York, UTC-4), October 2026. "Build" is the Settings Build line (`YYYYMMDD-HHMM`).

- "Live build" is the build that was deployed when the report came in, worked out from merge times, wherever the reporter did not give one.
- Device: unless noted, an iPhone running Safari, portrait, in a normal Safari tab (not added to the Home Screen).
- Reporters: Vincent, and a second player who playtested on Oct 24 (her identity and save stay private).

There are **10 incidents**, in 7 reports.

| # | When (ET) | Build | Who | On screen | What the player saw | Led to |
|---|---|---|---|---|---|---|
| 1 | Oct 15, about 1:05 PM | 20261015-1305 | Vincent | Right after winning an NPC holder battle | The page came back bare: PARTNER, Lv 1, all stats 0. There had been a reload. | #71 |
| 2 | Late Oct 15 or early Oct 16 (exact time not logged) | about 20261015-2340 | Vincent | Normal play | Random reloads every few minutes | #75 |
| 3 | Oct 19, 9:27 PM | about 20261019-2046 | Vincent | Battles | "Safari refresh three times during battles". He saw no yellow new-build bar. | #106 |
| 4 | Oct 22, 1:07 AM | 20261021-1356 | Vincent | The winning hit of an NPC battle | Settings: "Last reload: crash?, 1:07 AM, in battle". No "this webpage was reloaded" banner. | #141 |
| 5 | Oct 22, 1:13 AM | 20261021-1356 | Vincent | NPC Standing / People | Settings: "Last reload: crash?, 1:13 AM" | #141 |
| 6 | Oct 23, evening (before about 9:14 PM; time approximate) | about 20261023-1826 (#163's 20261023-2020 went live at 9:55 PM) | Vincent, plus a Discord in-app webview playtest | Normal play | "Constant refreshes", refreshes and crashes on his phone. The Discord webview playtest reloaded too. | #164, #165, #167; #169 (boot always lands on the map, Vincent's call) |
| 7 | Oct 24, 11:47 AM | 20261024-1058 | Vincent | About a minute after loading: a GROW UP, then move replacements, then opening People | Settings: "Last reload: crash?, 11:47 AM, on People". After the reload Safari asked for location again. | #181 (diag + one listener leak), #182 (no location prompt at boot) |
| 8 | Oct 24, 7:52 PM | 20261024-1310 | Second player | Walk, just walking | Settings: "Last reload: crash?, 7:52 PM, on Walk" | #183 |
| 9 | Oct 24, 8:02 PM | 20261024-1310 | Second player | Quest | Settings: "Last reload: crash?, 8:02 PM, on Quest" | #183 |
| 10 | Oct 24, 8:05 PM | 20261024-1310 | Second player | Walk | Settings: "Last reload: crash?, 8:05 PM, on Walk" | #183 |

**Since #183/#184 (build 20261024-2031 and later): no crash reports.** We have not received a "Copy crash info" payload from a real phone, and the game has not had a long real-iPhone session that we know of since then. We do not know if the crashes are gone.

## Notes per incident

**1 (Oct 15).** Cause found: Safari served a cached old `index.html` alongside new scripts. Boot threw on a missing element (`#questSideMore` was null), so the page drew defaults. #71 made the binds null-safe, added a one-shot boot reload (`?b=`) and set `sw.js` to no-cache. **What made Safari reload in the first place was never found.**

**2 (Oct 15–16).** Three suspects were found and all three fixed in #75:
- the service worker taking over an open page (`skipWaiting` + `clients.claim`)
- a boot retry loop
- the worker returning a manual redirect

Separately, town music left every finished note's nodes connected. Safari keeps stopped nodes that are still connected, and a tab holding thousands of them gets killed. #75 disconnects notes when they end.

**3 (Oct 19).** It started a few hours after #99 (cloud compare and adopt) went live at about 5:53 PM. Suspects:
- a late cloud compare adopting (which reloads) in the middle of a battle
- the new-build bar being tapped during a battle

Vincent saw no bar, so cloud adopt was the main suspect. #106 made cloud wait for `busy()`, hid the bar in battle and added the reload breadcrumb. **#106 added no mid-battle checkpoint, so a reload during a battle still loses the battle.**

**4–5 (Oct 22).** These were the first reports with the breadcrumb. "crash?" means the page died while visible. Our read was a WebKit process kill driven by object count. In a desktop WebKit soak (evidence/measurements/oct22_soak), live canvases went from 2,520 to 4,813, with about 217k created. Each People + Contacts cycle made about 1,224 canvases (fresh portraits each time). #141 pooled portraits (LRU 128) and disconnected the jingle gain. It also widened the heartbeat (screen, phase, live canvases, portraits, made), added `pp_hidden`, the "background" reason, nav/standalone/sw/gap/wasDiscarded fields and `pp_errors`. Screenshots: `evidence/screenshots/oct22_vincent_*.png`.

**6 (Oct 23).** Measured on build 20261023-2020 (evidence/measurements/oct23_canvas_hotfix):
- canvases 2,097 → 3,519
- canvas backing 2.7 → 10.2 MB
- desktop WebKit renderer RSS about 505 → 912 MB over a soak

The Discord webview probe showed reloads read as "unknown" and the hidden page losing its alive mark. Fixes:
- #164 limits cloud adopt to once per 10 minutes per tab.
- #165 trims canvases: frees the building cache (cap 3), the wall masks and the collection grid. Its PR says "not a confirmed crash fix".
- #167 keeps `pp_alive` while hidden, so kills while hidden read as "background".
- #169 makes boot always land on the map.

**7 (Oct 24, 11:47 AM).** **No root cause found.**
- Repro: 80 cycles of GROW UP → move replacement → People in desktop WebKit and Chromium (evidence/measurements/oct24_1147_repro). Canvases stayed flat at 2,421, and WebKit RSS was 620–720 MB.
- The only leak found was 11 more click listeners per cycle, from the move sheet (fixed in #181 with a delegated listener).
- A page kill right after GROW UP kept stage and moves (kill_*.json).
- At that build, boot alone made about 2,112 canvases (shared sheets later cut that to 25 in #183). About a minute after a fresh boot, with GROW UP's audio build-up and a first People open, is a plausible peak.
- The second location prompt was a symptom: Safari asks again on a fresh page load. #182 now reads location silently only when it is already 'granted'.
- Vincent's screenshot for this one could not be opened, so it is not in evidence/.

**8–10 (Oct 24 evening, second player).** Three "crash?" reloads within 13 minutes, with no battle, just walking and Quest. Context from her screenshots:
- the game was played partly in **landscape**, which looked broken
- inside Safari with **many other tabs open**
- she opened it from a link shared in Messages (Safari's Shared-with-You banner was showing)

On build 1310, walking 28 maps went from 2,257 to 2,738 canvases; with #183's shared sprite sheets it is 27 to 32. #183 also disconnects notes on a deadline, because `onended` does not fire while the AudioContext is suspended (we measured 172–291 connected nodes before). Cropped screenshots: `evidence/screenshots/oct24_2nd_player_*.png`. (Her save is private, not included.)
