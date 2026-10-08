# Walklings Backlog

Prioritized for turning the prototype into something you can actually play day to day.
Size: S = an evening, M = a few sessions, L = needs new infrastructure.

## Official priority order (Vincent, Oct 8, 2026)

This order applies after the Kindle Wild rename, which shipped as 9cc836d and 9d294cd, and the later Walklings rename (game Walklings, creatures Walklings, region the Amberwild, energy glow; Oct 8, 2026). It overrides the older numbering below.

1. **Battles.** BATTLE v0.3: turn-based battles with types and moves, NRG battle costs, the 20-minute faint nap, the FAINTED badge and the wipe rule. Now being built.
   - **Progress (BATTLE v0.3.1 build):** built: wild battles (bump/tap), FIGHT/BEFRIEND/SWAP/BAG/RUN, 64 moves + 28 evolution moves with learnsets and learn prompts, hidden type hints (`dex.hits`), AI tiers, battle costs, battle XP, Fainted 20-min nap / TIRED / GLOWING badges, wipe respawn, trainer summon text, Pia and Fen in data, KEEPER label on the Pet scene. Left for Phase M: placing Pia/Fen on real maps (only the debug `forceTrainer()` reaches them now), Lantern Houses and per-map respawn points (`lanternRest()` is ready), story spawns with move overrides, and the NPC bump hint.
2. **Story.** MAPS_SLICE Phase M: maps, the opening with Juniper's intro, Hearthmoor real rooms (INTERIORS_DIALOG), Rook, Tobin and the orchard gate, then Route 2 (ACT1_ROUTE2).
   - **Progress (Phase M, commit 1: the opening):** built: the map engine on the real slice data (`data/maps_slice.json` + `data/interiors.json` -> `data/mapdata.js` via `tools/gen_mapdata.py`), doors/warps/signs/NPCs/props/triggers with `when` flags, the scene runner (tap-only text, first tap completes the line, buffered writes, choices, name entry, baskets, look picker), Warden Ilse's intro in the home room (4 boxes + look picker, correction B), Hearthmoor with all four rooms (home, Lodge, Lantern House, Rook's house), gate_home, the full Lodge starter, rival1 at the east gate with the summon text in the map box, wipe respawn to the Lantern House (no healing), Lantern beds, the NPC bump hint and the TALK button. Old saves wake at the Hearthmoor Lantern House. Next: per-map spawns and Old Meadow gating, Fernbrook and its Lantern House, Pia and Fen with sight lines, Trial Hall #1 and Seal 1. No Route 2 yet.
3. **Gyms.** Trial Hall #1 with Master Fen, badges/seals, and the learnsets it needs.
4. **Pacing fix, revisited.** The original "a full Walkling starves too fast" problem, tuned so a full Walkling lasts long enough and players come back daily. The first pass is live (item 1 below: 16h/20h/24h real-time decay). What's left: re-tune against real play, the harsh comeback floor, and how chores grow with a large collection (see Balance).

Inventory (INVENTORY v0.1) and online saves (ONLINE_SAVES_SCOPE) were drafted to come after Phase M; Vincent sets where they fit in this order.

## Top 3

1. ~~**Real-play stat pacing (S)**~~ **DONE:** real-time decay (16h/20h/24h to empty, <25 after ~12h/15h/18h) for all owned Walklings live and offline, offline floor of 10 with no 12h cap (also catches up after a background tab), old rates kept as debug fast mode (`?fast=1`, F key, `PixelPets.setFast`, FAST tag in header).
   Original brief: Hunger drains at 0.1/s today, so a full Walkling is starving in about 17 minutes. Move to a
   real-time model (roughly a day to empty, with "needs attention" around 6 to 8 hours),
   decay all owned Walklings rather than only the partner, and keep the offline floor so a Walkling is
   never punished for a weekend away. Keep the fast rates behind a debug toggle for testing.
   Touches `RATE` and the offline catch-up in `boot()` in `game.js`.

1b. **DONE: Care/XP balance (S):** per-Walkling cooldowns saved in the Walkling (FEED 20m / PLAY 10m / REST 15m, ~1/57 in fast mode) with greyed countdown buttons, diminishing care gains (full <50, half 50-79, quarter 80+), and a 25 XP/day per-Walkling cap on care XP (local midnight reset). Walking and befriending XP stay uncapped. Optional `p.cd`/`p.cx` fields, still `v:1`.

1c. **DONE: Walking XP and visible caps (S):** walking gives 1 XP per 5 steps (leftover steps kept per Walkling in `p.sr`). A 30/day per-Walkling explore cap (`p.ex`) is shared by walking and befriending; befriending still adds the Walkling at the cap, only the XP stops. "Today: care XP x/25 · explore XP y/30" line on the Pet tab, EXP y/30 in the Walk HUD (green when maxed). Debug `PixelPets.resetDailyCaps()`. Still `v:1`.

2. ~~**Creatures on the map (M)**~~ **DONE:** visible wild creatures (3-4 at a time) wander grass/shore/woods tiles, bob and blink, despawn after a few minutes and respawn; bump or tap one to meet exactly that species/form. Spawns are driven by the real world: an opt-in location card (rounded to 2 decimals), Open-Meteo weather/elevation and OpenStreetMap (Overpass, Nominatim fallback) give tags (mountain, water, city, forest, park, meadow, rain, snow, storm, fog, hot, cold, windy, night) that weight each species' habitat. Env badge + card on the Walk tab, rain/snow/fog/night overlays, "Pick a place" debug presets, `PixelPets.setEnv/env/spawnWild/clearWild/spawnOdds`. Cached separately from the save (30 min weather, 7 days terrain); falls back to meadow when denied/offline. Still `v:1`.
   Original brief: replace the invisible tall-grass dice roll with wild creatures you can see wandering the
   map and walk into to start an encounter.

3. **Friends v1: trade and visit (L, can be staged)**
   Friends is a stub with no backend. Stage it:
   - 3a. Offline trade code: export a Walkling as a short signed code, import it on another device (no server).
   - 3b. Small backend (friend list by `PXP-` code, view a friend's partner, "visit" for a care bonus).
   - 3c. Live two-sided trades with confirmation on both ends.

## Next up

4. **Nicknames (S), PARTLY DONE (CREATURES_SLICE §6):** after a befriend the result card offers "Give it a name?" (optional, max 10 chars, letters/digits/space and ' . ! ? -, cleaned for display only; the saved `nick` is never rewritten). Shown in the header and on the Pets tab (species name in the sub line). Left: renaming an existing Walkling, battle text (no battles yet), a dex detail page, and the Faded Fuzzwick's delayed prompt (waits for the story spawn). The spec says max 12; this build uses 10 as requested.
5. **More creature lines (M), PARTLY DONE:** 5 new lines (24 forms total) with habitat spawn rules: STONE (Pebblit/Cragcub/Peakroar, mountain), VOLT (Zipmite/Voltwhisk/Teslynx, city/storm), FROST (Chillbit/Frostfuzz/Glacitan, snow/cold), GUST (Puffkin/Gustwing/Galecrest, storm/wind/rain), SHADE (Duskmote/Nightling/Eclipsar, night/fog). Left: per-species blurbs for every form, and a desert/sand line for hot+dry. (SHADE contrast on dark UI cells: done, light halo in the dex/collection/header only.)
5b. **DONE: CREATURES_SLICE creature lines (M):** 6 more 3-stage lines appended at SPECIES 8-13 (42 forms): Pomlet/Pomshell/Orchardon (BLOOM `beetle`), Loamlet/Burrowbloom/Hedgewarden (BLOOM `mole`), Clinkit/Shardpincer/Mosaicrab (TIDE `crab`, shore tiles; replaces the cut snail), Fuzzwick/Filamoth/Halowatt (VOLT `moth`), Vanelet/Vanefledge/Squallvane (GUST `vane`, `weatherOnly:['storm','snow']`, weights storm 4 / snow 3 / windy 2 for ~1 in 10 there: weight 0 otherwise and never in the 8% any-species roll; one already on the map stays until it wanders off), Dozmouse/Lullamouse/Moondozer (SHADE `dormouse`, woods tiles, halo). Draft art copied into `sprites.js` (Dozmouse line main colour PAL.n -> PAL.b so it reads on the night map), spec base stats, Route 1 level ranges on the proto map, append-only save form-id table (`PPSave.SPECIES_IDS`/`FORM_IDS`, still v2) with a dev check, Pixeldex 42 cells with a cloud on unseen weather forms. Waiting for BATTLE/MAPS: learnsets, Trial Hall #1 (Master Fen), the Faded Fuzzwick story spawn and `faded` field, per-map spawn tables (Route 1 / Fernbrook, `base x (1 + 0.25 x habitat)` weights, no 8% roll there), Old Meadow, starter gating, Calm Towers. Optional S1-S3 (night bloomers, lantern lure, dex habitat hints) not built.
6. ~~**Sound (S to M)**~~ **DONE:** `sfx.js` synthesizes 15 short chiptune SFX with WebAudio (tap, feed, play, rest, refusal, footstep, noticed, encounter, befriend, miss, flee, evolution build-up + fanfare, level-up, daily cap) at a low volume. Header speaker button mutes (`pixelpets.mute`). The AudioContext is only created on the first gesture; no WebAudio = silent. Left: optional background music (skipped: a looping tune that isn't grating needs real composing time), a volume slider, and testing on a real iPhone (silent switch, interruptions).
7. ~~**Pixel font (S)**~~ **DONE:** Jersey 15 (OFL), self-hosted 15 KB subset in `fonts/` with its license; sizes scaled ~1.3x and checked at 320/360/390. Left: ★ ♥ ▲ ◀ ▶ ▼ still come from the system font (could be drawn as pixel icons like the tab icons).
4b. **DONE: Types, stats and levels (M):** `stats.js` with the 8x8 type chart (one immunity, VOLT -> STONE), base stats for all 24 forms (42 since 5b) (HP/ATK/DEF/SPD, 192/256/320 per stage), stats by level, battle XP `p.bx` -> Level (Lv 1-50, separate from daily-capped growth XP, which still drives evolution), battle XP awards, the damage formula, mood modifiers, Tired/too-sleepy rules, persistent `p.hpNow` with real-time regen and REST healing. Starters Lv 5, wild creatures Lv 2-5 (6-8 for second forms), old saves Lv 5-10. Header/Pets tab show the Level; the growth bar is labelled GROW. Debug `PixelPets.giveBx(n)`. The battle build (BATTLE v0.3.1) added the battle screen, moves, battle costs and the faint nap; left: Lantern Houses (Phase M).
4c. **DONE: Stats card (S, TYPES_STATS as-built 7):** overlay opened from the Pet tab (STATS) and from each Walkling on the Pets tab (any tab can open it with a Walkling id; the Walk follower opens it too since Phase K). Type badge, Level, GROW left to the next form, HP now/max with TIRED/GLOWING, HP/ATK/DEF/SPD with bars scaled to the 42-form max at the same level, one type-chart line. Left: a moves row (battles shipped with BATTLE v0.3.1; the card shows FAINTED/TIRED/GLOWING).
4d. **DONE: Keeper + follower (M, MAPS_SLICE Phase K):** the player walks as a layered 16x16 keeper (6 skin tones as PAL `1`-`6`, 4 hairstyles, 3 outfits, 7 colours per colour row; art from Design's `keeper_art.js`), `player.look`/`player.name` in the v2 save with `normalizeLook()` (old v0.4 looks migrate, no version bump), the `#ovLook` picker (new player: before the starter; later: CHANGE LOOK on the Pet tab), the name on Friends, a keeper with no Walkling, and the partner following one tile behind (tap = stats card, Tired bob, FOLLOWER ON/OFF = `settings.follower`). Settings gear (K.8): header gear opens Sound / Follower / Change look / Start over (Start over moved off Friends; CHANGE LOOK + FOLLOWER removed from the Pet tab). Left for Phase M: the picker inside the opening (Juniper's intro), NPC keepers (Rook's spiky hair via `KEEPER_SWAPS`), Account/cloud save row, per-map placement on warps.
8. **More maps (M)** One 24x20 map today. Add a second and third area (beach, forest, cave) with exits, each with its own spawn table.

## Wild creatures follow-ups

- **Overpass reliability:** the public Overpass servers are slow (10-20 s in dense cities) and sometimes 504; the Nominatim fallback only recovers "city". For real users consider a tiny proxy/cache, a self-hosted Overpass, or precomputed land-cover tiles. Both public mirrors also ask for fair use; heavy traffic needs our own endpoint.
- ~~**Pet tab ignores the environment**~~ **DONE (MAPS_SLICE §11.1):** the Pet tab draws the map's `backdrop` (town/route/meadow/grove, all four built; today's map is meadow) with Walk's night tint and weather. Left: real place panels (not built yet) and per-map backdrops once Phase M adds maps; the encounter background is still the old meadow strip.
- **Creatures don't persist:** wild creatures are not saved, so a reload rolls a new set (by design for now; saving them would need care to stay `v:1`).
- **Single map, real-world tags:** a "Waterside" tag still spawns on the same grass map. Item 8 (more maps) could pick a beach/snow/city tileset from the tags.
- **Small map at 320x568:** the map viewport is only ~150 px tall on the smallest phones; creatures are still visible but it's cramped.
- **Location refresh:** location is read on boot and every 5 minutes only while the tab is open; walking around town doesn't update mid-session faster than that. Fine for a Walkling game, but worth knowing.
- **Second forms in the wild:** now 5% of wild creatures (was 15%); they still skip the first evolution when befriended (see Balance).
- **Only Chromium tested:** geolocation permission UX differs on iOS Safari (asks every session on http, needs https on device).

## Balance (open)

- ~~**Walking is the main XP source and is cheap**~~ **DONE (1c):** 1 XP per 5 steps plus a shared 30/day explore cap; max 55 XP per Walkling per day.
- **All Walklings decay, so chores grow with the collection:** non-partners can only be cared for by making them the partner, and the collection screen doesn't show their stats. Ideas: a "needs attention" badge on cards, slower decay for non-partners, or a home/boxed state that pauses decay.
- **Coming back always looks bad:** after ~14h away every stat sits at the 10 floor with the blinking "!". Consider a gentler floor (20-25) or a "welcome back" message.
- **Fast mode floors quickly:** any absence over ~15 minutes in fast mode floors every stat at 10. Expected for a debug mode, but worth knowing when testing.
- ~~**Diminishing-gain cliff**~~ **DONE:** tiers now apply band by band (49 / 50 / 51 -> 62 / 62.5 / 63.5 for FEED). Side effect: refilling from low is a bit slower (FEED from 30 ends at 52.5 instead of 55, REST from 30 at 55 instead of 60).
- ~~**Care XP cap is invisible until hit**~~ **DONE (1c):** daily counters on the Pet and Walk tabs, plus `PixelPets.resetDailyCaps()`.
- ~~**Befriending fills the explore cap, not walking**~~ **DONE:** befriend XP is +5 (was +10), still sharing the 30/day explore cap, so six befriends or 150 steps fill it.
- **Walking energy:** walking no longer drains NRG (`STEP_NRG = 0`). There is no low-NRG walk block or warning. FOOD per step is unchanged (0.15).
- **REST cooldown:** Pet-tab REST is 15 minutes (`CARE_CD_MIN.rest = 15`; BATTLE §7.3 Q1). Fast mode scales it as before.
- **New lines crowd the proto map:** with the CREATURES_SLICE habitats on today's single map, meadow is now led by Loamlet (34%) over Sproutbun (27%) and night by Dozmouse (22%). Vanelet was ~18% on the stormy-coast preset and ~24% on the snowfield; its weights are now storm 4 / snow 3 / windy 2 (spec draft 8/8/3), so both land at ~10.6%, Design's "about 1 in 10". With storm or snow as the only tag it's higher (~22% / ~25%). Per-map spawn tables (MAPS) will replace this.
- **Wild stage-2 Walklings skip a stage:** now only 5% of wild creatures (was 15%). A befriended stage-2 form still starts at 40 XP, so making it your partner skips the first evolution. Could start it at 40 XP but require its next evolution's care check, or make it harder to befriend (it already has a smaller zone).
- **Midnight double-dip:** maxing both caps just before and just after local midnight gives 110 XP in minutes. Probably fine; a rolling 24h window would close it.
- ~~**"EXP" vs "XP" labels**~~ **DONE:** the Walk HUD says TODAY 8/30 (tooltip: explore XP earned today); the Pet tab line already says "Today: ... explore XP 8/30".

## Quality and tech debt

- **Device testing:** only tested in Chromium phone emulation. Check real iOS Safari and Android Chrome (touch, safe areas, audio unlock, localStorage limits).
- ~~**Save versioning**~~ **DONE (save v2):** `pixelpets.save.v2` with stable string species/form ids, party (6) + box, orphans, dex seen/caught, world, and empty bag/money/seals/flags/eggs/settings sections for later features. One-time v1 -> v2 migration keeps every Walkling field (cd/cx/ex/sr), `uid`/`created` (friend code) and away-time decay; v1 key untouched + `.bak` copy; corrupt saves copied aside; newer saves load read-only. Additive fields go through `normalizeV2` without bumping `v`; breaking changes add a `migrateVnToVn+1` step and a new key.
- **Box screen:** the box is just a list under the party on the Pets tab (partner swap only). Reordering, releasing, and a proper box UI are later work; the Pixeldex doesn't show "caught" yet (`dex.caught` is saved).
- **Orphan recovery:** Walklings that couldn't be migrated sit in `orphans` with their raw data; nothing shows them yet.
- ~~**Debug keys in release**~~ **DONE:** E/G/F, fast mode, "Pick a place" and the cheat console hooks only work with `?debug=1` (remembered; `?debug=0` clears it). Read-only hooks stay public.
- **Start over (DONE):** Friends tab, press-and-hold 1.5 s confirm; wipes v2/v1/.bak/corrupt, keeps device prefs, other tabs stop saving (uid check). Left: an export/backup before wiping.
- **Installable app:** add a manifest and service worker so it can be added to the home screen and played offline.
