# PixelPets Backlog

Prioritized for turning the prototype into something you can actually play day to day.
Size: S = an evening, M = a few sessions, L = needs new infrastructure.

## Top 3

1. ~~**Real-play stat pacing (S)**~~ **DONE:** real-time decay (16h/20h/24h to empty, <25 after ~12h/15h/18h) for all owned pets live and offline, offline floor of 10 with no 12h cap (also catches up after a background tab), old rates kept as debug fast mode (`?fast=1`, F key, `PixelPets.setFast`, FAST tag in header).
   Original brief: Hunger drains at 0.1/s today, so a full pet is starving in about 17 minutes. Move to a
   real-time model (roughly a day to empty, with "needs attention" around 6 to 8 hours),
   decay all owned pets rather than only the partner, and keep the offline floor so a pet is
   never punished for a weekend away. Keep the fast rates behind a debug toggle for testing.
   Touches `RATE` and the offline catch-up in `boot()` in `game.js`.

1b. **DONE: Care/XP balance (S):** per-pet cooldowns saved in the pet (FEED 20m / PLAY 10m / REST 30m, ~1/57 in fast mode) with greyed countdown buttons, diminishing care gains (full <50, half 50-79, quarter 80+), and a 25 XP/day per-pet cap on care XP (local midnight reset). Walking and befriending XP stay uncapped. Optional `p.cd`/`p.cx` fields, still `v:1`.

1c. **DONE: Walking XP and visible caps (S):** walking gives 1 XP per 5 steps (leftover steps kept per pet in `p.sr`). A 30/day per-pet explore cap (`p.ex`) is shared by walking and befriending; befriending still adds the pet at the cap, only the XP stops. "Today: care XP x/25 · explore XP y/30" line on the Pet tab, EXP y/30 in the Walk HUD (green when maxed). Debug `PixelPets.resetDailyCaps()`. Still `v:1`.

2. ~~**Creatures on the map (M)**~~ **DONE:** visible wild creatures (3-4 at a time) wander grass/shore/woods tiles, bob and blink, despawn after a few minutes and respawn; bump or tap one to meet exactly that species/form. Spawns are driven by the real world: an opt-in location card (rounded to 2 decimals), Open-Meteo weather/elevation and OpenStreetMap (Overpass, Nominatim fallback) give tags (mountain, water, city, forest, park, meadow, rain, snow, storm, fog, hot, cold, windy, night) that weight each species' habitat. Env badge + card on the Walk tab, rain/snow/fog/night overlays, "Pick a place" debug presets, `PixelPets.setEnv/env/spawnWild/clearWild/spawnOdds`. Cached separately from the save (30 min weather, 7 days terrain); falls back to meadow when denied/offline. Still `v:1`.
   Original brief: replace the invisible tall-grass dice roll with wild creatures you can see wandering the
   map and walk into to start an encounter.

3. **Friends v1: trade and visit (L, can be staged)**
   Friends is a stub with no backend. Stage it:
   - 3a. Offline trade code: export a pet as a short signed code, import it on another device (no server).
   - 3b. Small backend (friend list by `PXP-` code, view a friend's partner, "visit" for a care bonus).
   - 3c. Live two-sided trades with confirmation on both ends.

## Next up

4. **Nicknames (S)** Let players rename a pet (`p.nick`, shown in header and collection, falls back to species name). Pairs well with trading.
5. **More creature lines (M), PARTLY DONE:** 5 new lines (24 forms total) with habitat spawn rules: STONE (Pebblit/Cragcub/Peakroar, mountain), VOLT (Zipmite/Voltwhisk/Teslynx, city/storm), FROST (Chillbit/Frostfuzz/Glacitan, snow/cold), GUST (Puffkin/Gustwing/Galecrest, storm/wind/rain), SHADE (Duskmote/Nightling/Eclipsar, night/fog). Left: type matchups or any gameplay difference between types (types are cosmetic today), per-species blurbs for every form, a desert/sand line for hot+dry and a sea line for coasts, and a second pass on SHADE's contrast on dark UI backgrounds.
6. **Sound (S to M)** Tiny chiptune SFX via WebAudio (feed, play, step, encounter jingle, befriend, evolve), with a mute toggle saved in settings. No asset files needed.
7. **Pixel font (S)** UI currently uses Courier New bold. Bundle a small open-license bitmap-style font (or draw one from glyphs like the tab icons) so text matches the art.
8. **More maps (M)** One 24x20 map today. Add a second and third area (beach, forest, cave) with exits, each with its own spawn table.

## Wild creatures follow-ups

- **Overpass reliability:** the public Overpass servers are slow (10-20 s in dense cities) and sometimes 504; the Nominatim fallback only recovers "city". For real users consider a tiny proxy/cache, a self-hosted Overpass, or precomputed land-cover tiles. Both public mirrors also ask for fair use; heavy traffic needs our own endpoint.
- **Pet tab ignores the environment:** weather/night only show on the Walk map. The Pet scene could rain/snow/darken too.
- **Creatures don't persist:** wild creatures are not saved, so a reload rolls a new set (by design for now; saving them would need care to stay `v:1`).
- **Single map, real-world tags:** a "Waterside" tag still spawns on the same grass map. Item 8 (more maps) could pick a beach/snow/city tileset from the tags.
- **Small map at 320x568:** the map viewport is only ~150 px tall on the smallest phones; creatures are still visible but it's cramped.
- **Location refresh:** location is read on boot and every 5 minutes only while the tab is open; walking around town doesn't update mid-session faster than that. Fine for a pet game, but worth knowing.
- **Second forms in the wild:** 15% of wild creatures are second forms, which skip the first evolution when befriended (see Balance).
- **Only Chromium tested:** geolocation permission UX differs on iOS Safari (asks every session on http, needs https on device).

## Balance (open)

- ~~**Walking is the main XP source and is cheap**~~ **DONE (1c):** 1 XP per 5 steps plus a shared 30/day explore cap; max 55 XP per pet per day.
- **All pets decay, so chores grow with the collection:** non-partners can only be cared for by making them the partner, and the collection screen doesn't show their stats. Ideas: a "needs attention" badge on cards, slower decay for non-partners, or a home/boxed state that pauses decay.
- **Coming back always looks bad:** after ~14h away every stat sits at the 10 floor with the blinking "!". Consider a gentler floor (20-25) or a "welcome back" message.
- **Fast mode floors quickly:** any absence over ~15 minutes in fast mode floors every stat at 10. Expected for a debug mode, but worth knowing when testing.
- **Diminishing-gain cliff:** gains use the stat before the action, so feeding at 49 gives +25 (to 74) but at 50 only +12.5. A smooth curve or applying the tiers band by band would remove the jump.
- ~~**Care XP cap is invisible until hit**~~ **DONE (1c):** daily counters on the Pet and Walk tabs, plus `PixelPets.resetDailyCaps()`.
- **Befriending fills the explore cap, not walking:** three befriends (~30-40 tall-grass steps) max the cap, which leaves little reason to walk once it's full and pushes the collection (and its decay chores) up fast. Consider less befriend XP (e.g. +5) or a smaller share of the cap.
- **Wild stage-2 pets skip a stage:** a befriended stage-2 form (15% of encounters) starts at 40 XP, so making it your partner skips the first evolution and the day-1 pacing.
- **Midnight double-dip:** maxing both caps just before and just after local midnight gives 110 XP in minutes. Probably fine; a rolling 24h window would close it.
- **"EXP" vs "XP" labels:** the Walk HUD shows both XP (total) and EXP (explore today), which reads like the same thing. Consider "EXPL", a map icon, or "TODAY 8/30".

## Quality and tech debt

- **Device testing:** only tested in Chromium phone emulation. Check real iOS Safari and Android Chrome (touch, safe areas, audio unlock, localStorage limits).
- **Save versioning:** save is `v1` with no migration path; add a migration step before any schema change (nicknames, new species).
- **Debug keys in release:** E (force evolve) and G (force encounter) are always on; gate them behind a debug flag.
- **Installable app:** add a manifest and service worker so it can be added to the home screen and played offline.
