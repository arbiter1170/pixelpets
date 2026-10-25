# Evidence

Everything here is either redacted or synthetic test output. No player data is included.

## screenshots/
These are crops of Settings screenshots from real iPhones, cut down to the **Build** and **Last reload** lines only.

| File | Incident |
|---|---|
| `oct22_vincent_0107am_battle.png` | 4: build 20261021-1356, "crash?, 1:07 AM, in battle" |
| `oct22_vincent_0113am_people.png` | 5: build 20261021-1356, "crash?, 1:13 AM" |
| `oct24_2nd_player_0752pm_walk.png` | 8: build 20261024-1310, "crash?, 7:52 PM, on Walk" |
| `oct24_2nd_player_0802pm_quest.png` | 9: build 20261024-1310, "crash?, 8:02 PM, on Quest" |
| `oct24_2nd_player_0805pm_walk.png` | 10: build 20261024-1310, "crash?, 8:05 PM, on Walk" |

## measurements/
These are desktop Playwright runs (WebKit and Chromium, 390×844) on test saves. They are **not** phone numbers.

- **`oct22_soak/`** (incidents 4–5, build 20261021-1356): `soak_webkit.json` and `soak_chromium.json`, with per-cycle growth of canvases, listeners, DOM nodes and heap over People + Contacts cycles.
- **`oct23_canvas_hotfix/`** (incident 6, build 20261023-2020 and the #165 fix):
  - `evidence.csv`: canvases, backing MB and renderer RSS per cycle
  - `top_creators_*.txt`: the call sites making canvases (line numbers are from **that** build, not `045ffa1`)
  - `canvases.png`, `rss.png`, `backing.png`: charts
  - `probe_out.json`, `probe_fixed_out.json`: breadcrumbs after a reload and a kill, before and after #167
- **`oct24_1147_repro/`** (incident 7, build 20261024-1058):
  - `wk40.out`, `cr40.out`: 40 GROW UP → move replacement → People cycles, in WebKit and Chromium. This is the raw log: the `base` line names the main fields (n canvases, ctxMb, dom, listeners, rss), and the cycle lines are unlabeled CSV.
  - `cr_audio.out`: audio nodes over the same loop
  - `boot_minute_webkit.json`: canvases and RSS in the first minute after boot
  - `kill_webkit.json`, `kill_chromium.json`: a page kill at points after GROW UP. Stage and moves were kept.
  - `probe_390.json`: listener counts before and after, showing the move-sheet click listener leak

## Left out on purpose
- **A second player's save: private, not included.**
- Her full screenshots, including one landscape game screen with her game data. Only the build and reload lines are kept. A Safari contact banner was cropped out.
- Vincent's screenshot for incident 7 (11:47 AM). It could not be opened.
- Any user ids, emails, location coordinates, keys or tokens.
- Internal box-only notes.
