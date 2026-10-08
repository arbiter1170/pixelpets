# PixelPets (prototype)
Play it at https://arbiter1170.github.io/pixelpets/ (GitHub Pages, built from `main`), or run
`python3 -m http.server` in this folder and visit http://localhost:8000. Opening `index.html` as a file
also works, minus location.
No build step, all paths relative, everything self-hosted (including the font). The only network use is the
optional local-creatures lookup (see Wild creatures below).
Progress saves to localStorage (`pixelpets.save.v2`; see Saves below).

Touch: bottom tabs (Pet / Walk / Pets / Friends); FEED / PLAY / REST; Walk = hold D-pad, tap a tile, or drag on the map;
walk into a wild creature (or tap it and your keeper walks over) to meet it. Tap your partner (the follower) for its stats card.
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
  `spawnWild()`, `clearWild()`, `autoWild()`, `pickSpecies(tags?)`, `pickStage()`, plus live `state`, `enc` and `walk`.
Without debug those hooks are inert (they do nothing and return `undefined`), a stored fast/place choice is
ignored (not deleted), and `PixelPets.state` is a read-only snapshot. Read-only hooks always work: `env`,
`wild`, `spawnOdds(tags?)`, `cooldownLeft(act)`, `careXpToday`, `exploreXpToday`, `rates`, `fast`, `debug`,
`muted`, `careGain(base, value)`, `refreshEnv()`, `showTab(name)`, `typeMult(attType, defType)`, `statsAt(formId, level)`,
`openStats(petId?)` / `closeStats()` / `statsCard` (the stats card), `petScene` (Pet tab backdrop, sky and tags),
`keeper` (tile, facing, walk frame, look, name) and `follower` (shown, tile, facing, pet id, tired, bob).
Debug only: `setMapBackdrop('town'|'route'|'meadow'|'grove'|null)` sets the current map's backdrop to preview it.

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
- Walking cost: each step costs the partner 0.16 NRG and 0.15 FOOD (`STEP_NRG` / `STEP_FOOD` in `game.js`),
  so 100 steps = 16 NRG and 15 FOOD. Below 1 NRG it's too tired to walk until it RESTs.
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
  join at that level when befriended. The six newer lines use their own first-form ranges (Pomlet and
  Fuzzwick 2-4, Loamlet, Clinkit and Dozmouse 3-5, Vanelet 4-6; second forms still 6-8). Pets from older saves start at their old displayed level
  (1 + XP/10) kept between Lv 5 and Lv 10.
- 4 battle stats (HP, ATK, DEF, SPD) per form from base stats and level; one type per line (the `type` in
  `sprites.js`) with an 8x8 type chart (2x / 0.5x, and VOLT can't hurt STONE). Damage, battle XP, mood
  (Hungry / Sulky / Drowsy / Spirited / Glowing from FOOD/JOY/NRG) and "too sleepy to battle" (NRG < 10) are
  ready for the battle build.
- HP: a pet's current HP (`hpNow`, absent = full) comes back at 10% of max every 10 real minutes, also while
  away; REST restores half of max HP and clears Tired (0 HP). Nothing lowers HP until battles exist.
- Stats card: tap STATS (top-left of the Pet tab scene) or any pet on the Pets tab. It shows the type badge, Level,
  GROW left to the next form, HP now/max with a TIRED or GLOWING tag, HP/ATK/DEF/SPD at the pet's level with bars
  scaled to the highest value of that stat among all 42 forms at the same level, and one type-chart line
  ("Strong vs X · Weak to Y"). No moves until battles ship. It's an overlay (tabs lock, decay pauses); CLOSE, a
  tap outside it or Escape closes it. Any tab can open it with a pet id (`openStatsCard(id)` in `game.js`).

Keeper and follower (MAPS_SLICE Phase K): you walk the map as a keeper, a 16x16 person drawn in 3 layers (body,
outfit, hair; art in `keeper.js`, copied from Design's `keeper_art.js`) with 4 facings (left mirrors right) and 2
walk frames. Six skin tones are new `PAL` keys `1`-`6` (nothing else in `PAL` changed). Your look is
`player.look = {skin, hair, hairCol, outfit, outfitCol, accent}` and your name is `player.name` (both in the v2 save,
no version bump; `normalizeLook()` fixes old or bad looks on load, e.g. the v0.4 draft's `{hair, skin, coat, scarf}`).
- Look picker (`#ovLook`): a big animated preview, NAME, then SKIN (6), HAIR STYLE (short, long, spiky, bun),
  HAIR COLOUR (7), OUTFIT (coat, hoodie, tunic), OUTFIT COLOUR (7) and ACCENT (7), plus SHUFFLE. A new player sees
  it first ("WHO ARE YOU?", no CANCEL), then the starter picker; nothing is saved until DONE. Later, CHANGE LOOK on
  the Pet tab opens it with CANCEL. Names: trimmed, spaces collapsed, `< > { }` and control characters dropped,
  10 characters max, empty = "Wayfarer". The Friends tab shows "KEEPER  name" above the friend code.
- With no pet yet the keeper still walks (no energy, food or XP, no wild creatures).
- Follower: your partner walks one tile behind you on the Walk map, taking the tile you just left (it never
  blocks you, wild creatures or spawns), bobs as it goes (half speed and 1px lower when Tired), swaps when you
  pick a new partner and changes when it evolves. On load it stands behind you, or under you if that tile is
  solid. Tap it to open its stats card (a wild creature on the same tile wins the tap). FOLLOWER: ON/OFF next to
  CHANGE LOOK turns it off (`settings.follower`, default on).

Pet tab scene: drawn from the current map's `backdrop` (town, route, meadow or grove; `MAP_INFO` in `game.js`,
missing or unknown = meadow; the one map today is meadow) with the same time of day and weather as Walk: night
sky with moon and stars plus Walk's night tint, a dull sky in rain/storm/snow/fog, and the same rain, storm
flashes, snow and fog, a little lighter on the small canvas.

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
  VOLT city, storm · FROST snow, cold · GUST storm, wind, rain · SHADE night, fog ·
  Pomlet park, forest, meadow · Loamlet meadow, forest, park · Clinkit water (shore tiles), rain, fog ·
  Fuzzwick night, city · Dozmouse night, fog, forest (woods tiles) · Vanelet storm, snow, wind.
  Each species has habitat weights in `sprites.js`; every active tag adds its weight, and 8% of
  spawns are any species, so almost nothing is impossible anywhere. The exception is the weather form:
  Vanelet (`weatherOnly: ['storm','snow']`) only appears while it storms or snows and is never part of
  the 8% roll. One already on the map stays until it wanders off. The Walk badge's card lists the
  three most likely species. Examples: cold mountain = Pebblit 50% / Chillbit 31%, snowfield =
  Chillbit 47% / Pebblit 29% / Vanelet 11%, city = Zipmite 50% / Fuzzwick 36%, night meadow =
  Dozmouse 22% / Duskmote 17% / Fuzzwick 17%, stormy coast = Puffkin 29% / Drizzlet 22% / Clinkit 20% / Vanelet 11%.
  Vanelet's weights (storm 4, snow 3, windy 2) are tuned so it is about 1 in 10 in storms and snow.
- Tags: mountain (elevation >= 800 m or >= 150 m relief within ~1 km), water / city / forest / park
  (OpenStreetMap features within 350 m; city = several urban landuse areas or 40+ buildings),
  meadow (none of those), rain / snow / storm / fog (current weather code), hot (>= 28 °C),
  cold (<= 3 °C), windy (>= 30 km/h), night (sun down there; device clock 20:00-06:00 as fallback).
- The Walk tab shows a small badge such as "City · Rain · 12°C" (tap it for details); rain and
  snow fall over the map, storms flash, fog hazes it and night tints it.

Creatures: 14 lines of 3 forms (42 Pixeldex entries), all befriendable and all evolving the same way
(growth XP 40 / 120 plus care, then EVOLVE). The six newer lines (design spec CREATURES_SLICE):
Pomlet → Pomshell → Orchardon (BLOOM beetle), Loamlet → Burrowbloom → Hedgewarden (BLOOM mole),
Clinkit → Shardpincer → Mosaicrab (TIDE crab), Fuzzwick → Filamoth → Halowatt (VOLT moth),
Vanelet → Vanefledge → Squallvane (GUST, weather form) and Dozmouse → Lullamouse → Moondozer (SHADE dormouse).
Unseen Vanelet-line entries in the Pixeldex show a small cloud ("check back in bad weather").
Nicknames: after a befriend the result card asks "Give it a name?" (optional, up to 10 characters: letters,
digits, spaces and ' . ! ? -). Leave it empty to keep the species name. A nickname shows in the header and on
the Pets tab (with the species name underneath) and is saved in the pet's `nick`.

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
  `shade`, then `beetle`, `mole`, `crab`, `moth`, `vane`, `dormouse`); the Pixeldex is keyed by form id (`ember/1`).
  The id table (`PPSave.SPECIES_IDS` / `FORM_IDS`, 42 form ids) is append-only: new lines are added at the end
  of `SPECIES` and of the table without a new save version, and a dev check reports any reorder. A pet whose
  species an older build didn't know sits in `orphans` there and comes back to the box once the species exists.
  Unknown fields are kept on load and save.
- An old `pixelpets.save.v1` is migrated once, on the first load of this version: every pet and its
  cooldown/daily-cap/step fields carry over, away-time decay still applies, the friend code stays the same.
  The v1 key is never changed or deleted (except by Start over), and its raw text is copied once to `pixelpets.save.v1.bak`.
  Pets that can't be read (unknown species) are kept aside in the save's `orphans` list, not dropped.
- A save that can't be read is copied to `pixelpets.save.corrupt` before anything else happens. A v2 save
  that can't be read falls back to migrating the v1 save again (with a notice). A save from a newer version
  shows "This save is from a newer PixelPets. Reload to update." and is never overwritten.
- Manual restore of the pre-migration save: in the browser console run
  `localStorage.removeItem('pixelpets.save.v2')` and reload; the game migrates again from the untouched v1
  key (once the v2 key is removed, the open page stops saving so it can't put it back). If the v1 key is gone
  too, first copy the backup back:
  `localStorage.setItem('pixelpets.save.v1', localStorage.getItem('pixelpets.save.v1.bak'))`.

Start over: the low-key "Start over" button at the bottom of the Friends tab (no debug needed) asks
"Start over? Your pets will be gone for good." Press and hold the red START OVER for 1.5 s (touch, mouse, or
Space/Enter); a bar fills while you hold and letting go early cancels. It removes `pixelpets.save.v2`,
`pixelpets.save.v1`, `pixelpets.save.v1.bak` and `pixelpets.save.corrupt` (so migration can't bring old pets
back), then reloads into the new-player path (look picker, then the starter choice). The page stops saving first, and any other open tab stops saving
once it sees the save gone or replaced by a different game (a different `uid`), with a "reset in another tab"
toast, so it can't write the old game back. Per-device keys are kept, never part of the save: `pixelpets.geo`,
`pixelpets.env`, `pixelpets.envOverride` for location, `pixelpets.mute`, `pixelpets.debug`, `pixelpets.fast`.
