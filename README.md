# PixelPets (prototype)
Play it at https://arbiter1170.github.io/pixelpets/ (GitHub Pages, built from `main`), or run
`python3 -m http.server` in this folder and visit http://localhost:8000. Opening `index.html` as a file
also works, minus location.
No build step, all paths relative, everything self-hosted (including the font). The only network use is the
optional local-creatures lookup (see Wild creatures below).
Progress saves to localStorage (`pixelpets.save.v2`; see Saves below).

Touch: bottom tabs (Pet / Walk / Pets / Friends); FEED / PLAY / REST; Walk = hold D-pad, tap a tile, or drag on the map;
walk into a wild creature (or tap it and your pet walks over) to meet it.
Keyboard (bonus): Arrows/WASD walk, 1-4 tabs, Space = Befriend in an encounter.
Sound: the speaker button in the header mutes/unmutes (remembered in `pixelpets.mute`).

Debug mode: add `?debug=1` to the URL (remembered in `pixelpets.debug`; `?debug=0` turns it off). A small
DBG tag shows in the header. Only in debug mode:
- Keys: E = force-evolve current partner, G = force a wild encounter (species weighted by the current area),
  F = toggle fast mode.
- Fast mode (below) and the "Pick a place" presets in the Walk badge card.
- Cheat console hooks: `PixelPets.giveXp(50)` (growth XP, ignores the caps), `PixelPets.giveBx(100)` (battle XP,
  raises the Level), `PixelPets.resetDailyCaps()` (clears today's
  care and explore XP for the partner), `forceEvolve()`, `forceEncounter()`, `setFast()`, `setEnv()`,
  `spawnWild()`, `clearWild()`, `autoWild()`, `pickSpecies()`, `pickStage()`, plus live `state`, `enc` and `walk`.
Without debug those hooks are inert (they do nothing and return `undefined`), a stored fast/place choice is
ignored (not deleted), and `PixelPets.state` is a read-only snapshot. Read-only hooks always work: `env`,
`wild`, `spawnOdds(tags?)`, `cooldownLeft(act)`, `careXpToday`, `exploreXpToday`, `rates`, `fast`, `debug`,
`muted`, `careGain(base, value)`, `refreshEnv()`, `showTab(name)`, `typeMult(attType, defType)`, `statsAt(formId, level)`.

Stat pacing: FOOD, JOY and NRG drain in real time for every pet you own (not just the partner).
From full they take about 16h / 20h / 24h to empty and drop into the blinking "needs attention"
zone (<25) after about 12h / 15h / 18h; JOY drains twice as fast while FOOD is under 20.
While you're away (closed app or background tab) the same rates apply with no time cap, but
away-time never pushes a stat below 10.

Care balance: each pet has its own cooldown per action (FEED 20 min, PLAY 10 min, REST 30 min),
saved with the pet so reloading doesn't reset it. A button on cooldown greys out and shows the time
left; tapping it explains the wait. Gains shrink as the stat fills, band by band: the part of a gain
that lands below 50 counts in full, between 50 and 80 at half, above 80 at a quarter (FEED +25, PLAY +20 joy,
REST +30 energy at full rate). So FEED from 49 / 50 / 51 ends at 62 / 62.5 / 63.5 with no jump at the edges;
from 30 it ends at 52.5, from 90 at 96.25.
Daily XP caps (per pet, reset at local midnight):
- Care XP (FEED +2, PLAY +5, REST +1): up to 25 a day. After that, actions still restore stats but give no XP.
- Explore XP: up to 30 a day, shared by walking (1 XP per 5 steps; leftover steps carry over, even
  across sessions) and befriending (+5, or whatever still fits under the cap). Befriending a pet
  always works, even at the cap; only the XP stops.
So a pet can earn at most 55 XP a day: stage 2 (40 XP) on day 1 and stage 3 (120 XP) around day 3
for a player who maxes both caps, or day 2 and day 5 with care only. The Pet tab shows
"Today: care XP 12/25 · explore XP 8/30"; the Walk tab shows the same explore count as TODAY 8/30.
A counter turns green when maxed.

Levels, types and stats (`stats.js`; battles themselves come in a later build):
- Two progress tracks per pet. **Growth XP** (`xp`, the GROW bar) comes from care and exploring, is
  daily-capped as above and drives evolution (40 / 120, plus care). **Battle XP** (`bx`) will come only from
  battles, is not capped per day and sets the **Level** shown in the header and on the Pets tab
  (`bx` for level L = 4 x (L-1)^2, Lv 1-50). Care and exploring never change the Level, and battles will never
  give growth XP. The level-up chime plays when battle XP raises the Level ("<name> grew to Lv N!").
- Starters begin at Lv 5. Wild creatures on the map have a level (2-5, or 6-8 for the rare second forms) and
  join at that level when befriended. Pets from older saves start at their old displayed level
  (1 + XP/10) kept between Lv 5 and Lv 10.
- 4 battle stats (HP, ATK, DEF, SPD) per form from base stats and level; one type per line (the `type` in
  `sprites.js`) with an 8x8 type chart (2x / 0.5x, and VOLT can't hurt STONE). Damage, battle XP, mood
  (Hungry / Sulky / Drowsy / Spirited / Glowing from FOOD/JOY/NRG) and "too sleepy to battle" (NRG < 10) are
  ready for the battle build.
- HP: a pet's current HP (`hpNow`, absent = full) comes back at 10% of max every 10 real minutes, also while
  away; REST restores half of max HP and clears Tired (0 HP). Nothing lowers HP until battles exist.

Fast mode (debug mode only): the old demo pacing (full to starving in about 17 minutes) for testing.
Turn it on with `?debug=1&fast=1` in the URL (`?fast=0` turns it off), the F key, or
`PixelPets.setFast(true)` / `PixelPets.setFast(false)` in the console. The choice is remembered in
localStorage key `pixelpets.fast` (separate from the save). While it's on, a small FAST tag shows
next to the pet's name in the header, and a toast appears on toggle and on load.
Fast mode also shrinks care cooldowns by the same ratio (~1/57: FEED ~21s, PLAY ~10s, REST ~31s);
the daily XP caps are not scaled (use `PixelPets.resetDailyCaps()`).

Wild creatures: there are no hidden tall-grass rolls any more. 3-4 wild pets wander the Walk map
(on grass, shore or woods tiles, blocked by trees/water, never on the path). They bob and blink,
leave after ~2.5-4.5 minutes of Walk time (or sooner when far off-screen) and new ones pop in.
Bump into one, or tap it so your pet walks next to it, to start an encounter with exactly that
species and form. Second forms are rare (5%, they twinkle). RUN leaves the creature where it
is (it shies away for a moment); befriending or letting it flee removes it.

Which species appear depends on where you are and the weather there:
- Habitats: EMBER hot, meadow · TIDE water, rain · BLOOM forest, park, meadow · STONE mountain ·
  VOLT city, storm · FROST snow, cold · GUST storm, wind, rain · SHADE night, fog.
  Each species has habitat weights in `sprites.js`; every active tag adds its weight, and 8% of
  spawns are any species, so nothing is impossible anywhere. The Walk badge's card lists the
  three most likely species. Examples: cold mountain = Pebblit 54% / Chillbit 34%, snowfield =
  Chillbit 55% / Pebblit 35%, city = Zipmite 82%, night meadow = Duskmote 51%.
- Tags: mountain (elevation >= 800 m or >= 150 m relief within ~1 km), water / city / forest / park
  (OpenStreetMap features within 350 m; city = several urban landuse areas or 40+ buildings),
  meadow (none of those), rain / snow / storm / fog (current weather code), hot (>= 28 °C),
  cold (<= 3 °C), windy (>= 30 km/h), night (sun down there; device clock 20:00-06:00 as fallback).
- The Walk tab shows a small badge such as "City · Rain · 12°C" (tap it for details); rain and
  snow fall over the map, storms flash, fog hazes it and night tints it.

Location and privacy: on the first visit to Walk a card asks "Use your location so local creatures
appear? ..." with Allow / Not now. Only Allow calls the browser's Geolocation API; the answer is
remembered (`pixelpets.geo`) and you can change it from the badge card (USE MY LOCATION).
Coordinates are rounded to 2 decimals (about 1 km) before any request, and only the rounded
values are sent. Nothing is sent anywhere else and the save never holds location.
The browser only offers location in a secure context: `http://localhost` (as above) or https.
A plain-http LAN address (e.g. testing on a phone via 192.168.x.x) will fall back to the default.
Data sources (all free, no API key, CORS-enabled):
- Open-Meteo forecast (temperature, weather code, day/night, wind, elevation) and Open-Meteo
  elevation (5 points ~1 km apart for relief).
- Overpass API (OpenStreetMap) via overpass-api.de, falling back to the maps.mail.ru mirror: one
  tiny "count" query for water, urban landuse, buildings, woods and parks. It can be slow (10-20 s
  in big cities) or busy; then Nominatim reverse geocoding (OpenStreetMap) decides city vs not.
Results are cached in `pixelpets.env` (separate from the save) per rounded location: weather for
30 minutes, terrain for 7 days (30 minutes if only partly loaded). Denied, unsupported, offline or
failed lookups fall back to a plain meadow (plus night from the device clock); play is never
blocked and the badge shows NO GPS / OFFLINE / DEFAULT.

Pick a place (debug mode only): the badge card has preset buttons (Meadow, City, City rain, Mountain, Lake,
Forest, Desert, Snow, Storm, Night, plus AUTO to go back to real data), saved in
`pixelpets.envOverride`. Environment console hooks (the `set`/`spawn`/`clear` ones need debug mode):
- `PixelPets.env`: current area `{tags, label, status, temp, place, ...}`.
- `PixelPets.setEnv('snow')` or `PixelPets.setEnv(['city','rain'])`; `PixelPets.setEnv(null)` = real data again.
- `PixelPets.refreshEnv()`: refetch now (ignores the cache).
- `PixelPets.spawnWild(sp?, stage?, x?, y?)`: add a creature (default: area-weighted species, near-ish free tile).
- `PixelPets.clearWild()` removes all creatures and pauses auto-spawning; `PixelPets.autoWild()` resumes it.
- `PixelPets.spawnOdds(tags?)`: spawn chances per species for the current (or given) tags.

Sound: tiny chiptune effects synthesized in code with WebAudio (square, triangle and noise; no audio
files) in `sfx.js`: UI tap, feed, play, rest, cooldown/refusal buzz, a quiet footstep every other step,
"noticed" blip when you tap a creature, encounter jingle, befriend fanfare, miss, flee, evolution
build-up + fanfare, level-up and daily-cap chimes. Default volume is low. The AudioContext is only
created on the first tap/key press (iOS and Chrome autoplay rules) and resumed after interruptions;
muted means no audio nodes at all, and browsers without WebAudio just stay silent. There is no
background music (left out for now; see BACKLOG).

Font: Jersey 15 by Sarah Cadigan-Fried (SIL Open Font License 1.1), self-hosted as a ~15 KB Latin
subset in `fonts/` with its license (`fonts/OFL.txt`, credits in `fonts/README.md`). `font-display: swap`
with Courier New / monospace as fallback; ★ ♥ and the arrow symbols come from the system font.

Saves (format v2, `save.js`):
- `pixelpets.save.v2` is the save. Pets live in a **party** (up to 6, the partner is always in it) and a
  **box** (no limit). A 7th befriended pet goes to the box ("<name> was sent to your box."). On the Pets tab,
  choosing a boxed pet as partner moves it into the party; if the party is full, the last party member that
  isn't the partner moves to the top of the box. Every pet, party or box, gets hungry the same way.
  Pets name their species by a permanent id (`ember`, `tide`, `bloom`, `stone`, `volt`, `frost`, `gust`,
  `shade`); the Pixeldex is keyed by form id (`ember/1`). Unknown fields are kept on load and save.
- An old `pixelpets.save.v1` is migrated once, on the first load of this version: every pet and its
  cooldown/daily-cap/step fields carry over, away-time decay still applies, the friend code stays the same.
  The v1 key is never changed or deleted, and its raw text is copied once to `pixelpets.save.v1.bak`.
  Pets that can't be read (unknown species) are kept aside in the save's `orphans` list, not dropped.
- A save that can't be read is copied to `pixelpets.save.corrupt` before anything else happens. A v2 save
  that can't be read falls back to migrating the v1 save again (with a notice). A save from a newer version
  shows "This save is from a newer PixelPets. Reload to update." and is never overwritten.
- Manual restore of the pre-migration save: in the browser console run
  `localStorage.removeItem('pixelpets.save.v2')` and reload; the game migrates again from the untouched v1
  key (once the v2 key is removed, the open page stops saving so it can't put it back). If the v1 key is gone
  too, first copy the backup back:
  `localStorage.setItem('pixelpets.save.v1', localStorage.getItem('pixelpets.save.v1.bak'))`.

Reset: `localStorage.removeItem('pixelpets.save.v2')` (and `pixelpets.save.v1`, `pixelpets.save.v1.bak` if
present) then reload. Per-device keys, never part of the save: `pixelpets.geo`, `pixelpets.env`,
`pixelpets.envOverride` for location, `pixelpets.mute`, `pixelpets.debug`, `pixelpets.fast`.
