# Walklings smoke tests

Small browser checks so a later change can show the game still boots on a phone width. Players never load this folder. There is no GitHub Actions workflow yet: run the suite locally.

## How to run

From a clean clone, in the repo root:

```
npm install
npx playwright install chromium
npm test
```

`npm test` runs `python3 tools/bump_build.py --check` (must exit 0) and then Playwright. Chromium only, one width at a time, against a local static server (`python3 -m http.server`, port 8080). Set `PP_URL` to point at another origin instead, for example the live site:

```
PP_URL=https://arbiter1170.github.io/pixelpets/ npm test
```

When `PP_URL` is set, the config does not start a server. `PP_PORT` changes the local port.

Projects (CSS pixels, mobile Chromium: `isMobile`, `hasTouch`):

| Project | Viewport | deviceScaleFactor |
|---|---|---|
| 320 | 320×568 | 2 |
| 375 | 375×667 | 2 |
| 390 | 390×844 | 3 |

Screenshots of the walk screen (QUEST button visible) and the open next-step panel are written to `test-results/screenshots/` (`walk-quest-<width>.png`, `quest-panel-<width>.png`). That folder is gitignored.

A console message of type `error`, or any uncaught page error, fails the test.

## What each check covers

`tests/smoke.spec.js`:

| Test | Brief check | What it asserts |
|---|---|---|
| boot, build stamp, and dev checks | a, b | Fresh context (empty localStorage). `window.BUILD` equals `version.json`'s `build`. `PixelPets` exists. The opening scene starts. The three dev checks below return no problems. |
| befriend odds stay inside the tuning range | d (numbers) | `befriendOdds(3, 1)` and `befriendOdds(18, 0.25)` have `width` in 0.06–0.6. The quarry call is 0.181 (0.18 at 2 decimal places). Lv 16 and Lv 19 at 25% HP are recorded as 0.196 and 0.174. |
| quest button opens the next-step panel | c | A v2 save past the starter (a partner, `story.starter_received`, a keeper look and name). `#questBtn` is visible, at least 44×44 CSS px, inside the viewport, and does not overlap other `.dpc` buttons or the d-pad (`.dp`). A tap opens `#ovQuest`. The panel text equals `PixelPets.quest.text`. Escape closes it. CLOSE closes it after `PixelPets.optionsReady` (the 500 ms arm). |
| befriend bar opens and BACK returns to the battle menu | d (bar) | `?debug=1`, `forceBattle('tide/0', 3)`. Waits until `PixelPets.battle.state` is `CHOOSE` and the menu panel is up (no fixed sleep). BEFRIEND opens the bar: the zone has a width and the marker has been drawn. BACK returns to the battle menu. |
| glimmer side swaps the orchard scene and restores keepers | e | `sceneFor('side_pick')` and `sceneFor('orchard')` resolve. `setSide('glimmer')` makes `sceneFor('orchard')` return `orchard@glimmer` and `PixelPets.side` is `glimmer`. `setSide('keepers')` restores `orchard` and `keepers`. |
| a minimal v2 save without faction or quest fields still loads as v2 | f | Seed is only `{v:2}`. After load, `PixelPets.side` is `keepers`. The save written back (the 5 s autosave; the seed had no `party`) still has `v: 2` and no `questSeen` or `story.side`. |

Seeded saves set `pixelpets.geo` to `deny` (so the location card does not cover Walk) and `pixelpets.mute` to `1`. They also stamp `daily.hello` and `daily.warm_bowl` for today so the boot toasts do not fire. The fresh-boot test does not seed a save. The minimal-save test seeds only `{v:2}`.

## Dev-check return shapes

All three mean "no failures" when the list is empty. Boot already `console.error`s a non-empty list, which fails these tests on its own.

- **`PixelPets.questCheck`** (getter, not a function). Returns the array from `PPQuests.devCheck(MAPDATA)` in `quests.js`: a list of problem strings. Empty array means every `story.*` flag the map data writes is a chain step or on `NOT_STEPS`, ids are unique, objective text fits 110 characters, and the last step can never be done.
- **`PixelPets.glimmerCheck`** (getter). Returns the array from `glimmerDevCheck()` in `game.js`: a list of problem strings. Empty array means `data/glimmer_path.json` lines fit after tokens, variants have a base scene, and those variants set the same `story.*` flags as the base.
- **`PixelPets.befriendCheck()`** (function). Returns the array from `befriendDevCheck()` in `moves.js`: a list of problem strings. Empty array means zone width does not rise with foe level, does not fall as HP falls, and stays inside the floor and cap.

`PixelPets.befriendOdds(foeLv, hpFrac, opts)` returns `{ width, chance, speed, label }`. `width` and `chance` are numbers rounded to 3 decimal places. Defaults: stage 0, joy 60, no treat, lead level equal to the foe, engaged when `hpFrac < 1`, bonus 0.
