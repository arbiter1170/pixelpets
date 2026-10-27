# Walklings (prototype)
Walklings was called PixelPets, then Kindle Wild, until October 2026. Its creatures are Walklings; its region is the Amberwild.
The repo, the URL, the file names, the `pixelpets.*` storage keys and the
`PixelPets` console hooks keep the old name on purpose, so every save keeps loading.

Play it at https://arbiter1170.github.io/pixelpets/ (GitHub Pages, built from `main`), or run
`python3 -m http.server` in this folder and visit http://localhost:8000. Opening `index.html` as a file
also works, minus location.
No build step, all paths relative, everything self-hosted (including the font). The only network use is the
optional local-creatures lookup (see Wild creatures below). A manifest and a service worker
(`manifest.json`, `sw.js`, icons in `icons/`) let a phone add Walklings to the home screen and open the
cached shell offline. `version.json` stays on the network so a newer deploy can still announce itself.
A new shell does not reload a game that is already open. It waits until the next visit. The notice still
appears when `version.json` changes, and a tap refreshes.
Location lookups are other sites, so the worker leaves them alone, and a failed lookup still falls back to meadow.
Progress saves to localStorage (`pixelpets.save.v2`; see Saves below).
Agent skills, including quest authoring and status-doc upkeep, are in `.cursor/skills/`. The index is `.cursor/skills/README.md`. Consolidated agent rules for Cline, Claude Code, and AGENTS.md consumers are in `AGENTS.md`; `CLAUDE.md` and `.clinerules` point to it. History is in `archive/`.

Touch: bottom tabs (PARTNER / WALK / WALKLINGS / QUEST); FEED / PLAY / REST; Walk = hold D-pad, tap a tile, or drag on the map;
walk into a wild creature (or tap it and your keeper walks over) to meet it. A sign opens when you tap it, or when you face it and use TALK, Space or Enter. Walking into a sign does not open it. Tap your partner (the follower) while you are standing still to open the care tray; while you are walking, that tap walks. STATS on the tray opens the stats card.
Keyboard (bonus): Arrows/WASD walk, 1-4 tabs. Space or Enter talks to the person you face, and on the walk screen those keys do not press a button left focused by a click. In a battle: 1-5 or F/B/S/R = Fight / Befriend / Swap / Bag / Run. On the fight list, 1-4 pick that move (an empty slot does nothing) and Escape or Backspace goes back.
Space or Enter skips a message, Space = Befriend on the timing bar, Escape = back.
Sound: the settings gear in the header opens Sound on/off (remembered in `pixelpets.mute`), Music on/off (saved with the game), a Vol slider beside Music (0–100, saved as `settings.musicVol` from 0 to 1), Follower on/off, Effects (FULL, CALM or OFF, saved as `settings.effects`), Change look, Tutorial (a chooser: opening tour, care walk, moves lesson, befriending, type chart), Tips on/off (`settings.tips`, default on), Replay tips, Save a copy, Read a copy, Start over, Cloud save, and Debug. Cloud save is on for anonymous backup. The row reads "This browser only: link Google to keep it safe" while this browser holds the backup. The panel can delete the cloud copy and leave the game on this device. Link Google and Sign out live in the Cloud save panel (Phase 2). Google sign-in uses a popup; linking upgrades the anonymous backup in place. When the shared walk is on, Play together sits under Change look: Show other holders, then one ON / FRIENDS / SOLO switch, the room code, and Blocked holders. The status line reads Room 1 · 1 here. Joining shows "Joined. Say hi!" and that line clears itself.

First tour: when the starter scene ends, a short tour points out the screen, then FEED, PLAY and REST. SKIP on the first card, or SKIP TOUR on a later card, closes it. Those three buttons really feed, play and rest the first time. Settings → Tutorial → REPLAY runs the same cards again and only highlights them. The compass card sits just before the last one. A save that was already on that last card skips the compass. An older save that has already walked past the opening is marked done and does not see it. The daily hello waits until the next day. Save `v` stays 2 (`story.tutorial_done`, and `story.tutorial_step` only while a tour is open). Later tips (the phone, a side, a side quest, a big choice, switching sides, a letter, a Lantern, growing up, and, once two Walklings walk with you, the party, its moves, and moving one up) each show once on the walk screen. A tip that is up when a talk starts steps aside and comes back in the same place after the talk. SKIP on the first party card marks all three seen. The growing up tip waits until the partner is ready, and it does not come back after that partner has grown up. An older save whose starter has already grown up counts as having seen it. SKIP, or a tap outside the card, puts it away. Settings → Tips turns them all off. Replay tips lets them show again, including growing up while the partner is still ready. Right after the starter moment, in the Lodge, your partner acts hungry and a care walk shows FEED, PLAY, REST, how to get NRG, and HEAL on the tray. The tour asks after that walk and teaches the bottom row before the partner screen. Rook's first match shows HP, types, moods, NRG and SWAP. The first wild battle shows how to befriend. Settings → Tutorial opens a chooser for the opening tour, that care walk, the moves lesson, befriending and a type chart.

Controls: Settings → Controls switches ARCADE (the d-pad, TALK and the tab bar) and MODERN (in portrait the map fills the space above a bottom dock: the place chip, Acorns, PHONE and the gear, then trust, QUEST, BAG, MAP, PARTNER and WALKLINGS, then a partner strip (HP, FOOD, JOY, NRG and GROW) you tap to open the care tray; toasts sit on the place chip, and there is no tip line; landscape keeps the older float layout; STATS on the tray opens the stats card; PARTNER and WALKLINGS screens have a WALK back button). In modern, the heart button pulses when the partner's food or rest is low: an orange ring and a small bowl when food is low, a blue ring and a small z when rest is low, both rings in turn when both are low, and a faster pulse when either is very low or the partner is napping. One FEED or one REST clears that side. Arcade does not show it. On the walk, one balloon over the partner shows when they are hungry, hurt, or tired. A worn-out partner still shows Zz, and that balloon waits. The balloon stays still, including when motion is reduced. Joystick, shown in modern, adds a translucent four-way stick bottom left (off by default). A new game asks which you want, in the house, after the mirror. An old save stays on arcade. Tap, drag, walking up to people, and the keyboard work in both. A tap on open ground walks around anything in the way. A tap on a solid spot walks to the nearest open tile beside it. If there is no way through, the game says "Can't get there from here." A tap just past an outdoor map edge that has a way out walks to that way out. A tap past an edge with no way out walks to a nearby open tile. In modern, a small interior is drawn larger, in whole steps, up to twice the outdoor scale, in the space above the buttons and the partner strip. On an outdoor map the camera keeps the last walkable row above that strip, and in modern it can scroll a little past the map into the black void so the top row and the side columns clear the buttons and the partner strip. A room that fits sits in the open space under the left buttons, or low above the bottom band, and never under the top row. Settings → Map zoom, under Controls, is a stepped slider from 2x to 3x. 2x is the default and today's look, including an old save with no map zoom. The steps are the scales that stay crisp on the phone (one art pixel is a whole number of screen pixels): 2x, 2.5x and 3x on most phones, 2x, 2.33x, 2.67x and 3x on 3x-density screens. Rooms keep their own zoom. Rooms keep their own scale. In arcade the place chip sits in the row above the map. The space past the map stays the black void. The buttons, the tip and the partner strip stay the same size. A room that already fits the width, such as the Arbiter Bay, stays as it was. Leftover edges stay the black void.

Debug mode: add `?debug=1` to the URL, or open Settings → Debug and enter the team password. It lasts for this browser tab only (`pixelpets.debug` in sessionStorage; older builds kept it in localStorage, and boot now clears that). `?debug=0` turns it off. Any save written during a debug session gains `debugSave: true`, and Settings shows `DEBUG SAVE` beside the build line, so debug edits never pass as a clean save. Settings also shows the newest reload under the build. When any of the last five reloads is a crash, or this build has a crash count, or the page is opened with ?debug=1, Copy crash info sits under it and copies those notes to the clipboard. Nothing is sent. When this build has a crash count, a line reads Crashes on this build: N. The first boot after a crash shows a short note: the game closed unexpectedly, and Copy crash info is in Settings. The note waits while a scene, a tutorial, a battle, or another panel is open, including one that starts as the page boots, and it shows once that is gone. If one of those opens while the note is up, the note steps aside and comes back, until OK. That note shows once for that crash. On a 320-wide arcade screen the note is one short row so the map stays in view. A planned reload, a background close, or an ordinary reload does not show it. If the page died while it was open, that line names the screen (for example on People). A death during a battle still says in battle. A death after the page was hidden says background kill. A script error adds one short line under that. Only `?debug=1` lists the last five errors and the last five reloads in the debug panel. Those logs are their own localStorage keys, not part of the save. A DBG tag shows in the header; tap it to open the debug panel again, including during a battle. Lock debug in that panel to turn it off on this device. With `?debug=1`, the debug panel can grant a Walkling adornment or effect. That sets the same wardrobe flag a purchase sets and marks the save. Without `?debug=1` the grant is not there. Only in debug mode:
- Keys: E = force-evolve current partner, G = force a wild battle (species weighted by the current area),
  H = heal the whole team (clears HP loss and naps), F = toggle fast mode. While a battle is open these keys wait, so F is Fight.
- Fast mode (below) and the "Pick a place" presets in the Walk badge card.
- Cheat console hooks: `PixelPets.giveXp(50)` (growth XP, ignores the caps), `PixelPets.giveBx(100)` (battle XP,
  raises the Level; `giveBx(100, true)` also queues the move-learn prompts), `PixelPets.resetDailyCaps()` (clears today's
  care and explore XP for the partner), `forceEvolve()`, `forceEncounter()`, `setFast()`, `setEnv()`,
  `spawnWild()`, `clearWild()`, `autoWild()`, `pickSpecies(tags?)`, `pickStage()`, plus live `state`, `enc` and `walk`.
  Battle: `forceBattle(form?, level?)` (e.g. `forceBattle('stone/0', 4)`), `forceTrainer('route1_pia' | 'hall1_fen')`
  (false once beaten), `winBattle()`, `loseBattle()`, `setHp(n)`, `healTeam()`, `setFaint(min = 20)` (0 wakes the
  partner), `giveItem('heal_snack' | 'befriend_treat', n)`, `setMoney(n)`, `setMoves([ids])`, `clearEvoMoves()`,
  `aiPick()` and the live `battle` object. Story: `goto(map, x, y, facing)`, `setFlag(k, v)`, `setSide('glimmer')`,
  `runScene(id)` (side-aware), `runSteps([...])`, `endScene()`.
  Panel: checkpoints (main story, the Mom / Mahopac side chain, High Charity plaza and the Event Hall), items and Acorns,
  a wild battle at a chosen species, form, level and HP with that Walkling's stats shown first, faction, and Standing.
  The same calls are `checkpoint(id)`, `checkpoints()`, `encounterPreview(species, level, stage, hpFrac)`,
  `spawnEncounter({ species, stage, level, hpFrac, onMap })`, `setFaction('keepers'|'glimmer')` (`{ picked: false }` leaves the side pick unset),
  `setCare({ hunger, happy, energy, all })`, `setLevel(n)`, `fillKit()`, `clearHold()`, `setTextSpeed('fast')`,
  `debugSnapshot()`, `debugCatalog()` and `devChecks()`.
Without debug those hooks are inert (they do nothing and return `undefined`), a stored fast/place choice is
ignored (not deleted), and `PixelPets.state` is a read-only snapshot. Read-only hooks always work: `env`,
`wild`, `spawnOdds(tags?)`, `cooldownLeft(act)`, `careXpToday`, `exploreXpToday`, `rates`, `fast`, `debug`,
`muted`, `careGain(base, value)`, `refreshEnv()`, `showTab(name)`, `typeMult(attType, defType)`, `statsAt(formId, level)`,
`openStats(petId?)` / `closeStats()` / `statsCard` (the stats card), `petScene` (Pet tab backdrop, sky and tags),
`keeper` (tile, facing, walk frame, look, name), `follower` (shown, tile, facing, Walkling id, tired, fainted, bob, droop),
`moves()` (the move table), `learnset(form)`, `defaultMoves(form, level)`, `befriendWidth(...)` and `battleLine(key, vars)`.
Debug only: `setMapBackdrop('town'|'route'|'meadow'|'grove'|null)` sets the current map's backdrop to preview it.

Stat pacing: FOOD, JOY and NRG drain in real time for every Walkling you own (not just the partner).
From full they take about 16h / 20h / 24h to empty and drop into the blinking "needs attention"
zone (<25) after about 12h / 15h / 18h; JOY drains twice as fast while FOOD is under 20.
While you're away (closed app or background tab) the same rates apply with no time cap.
Away-time stops FOOD and JOY at 20, and NRG at 10.
Come back after 14 hours and the partner tab says your Walkling waited. A shorter gap adds no extra line.
When the partner is chipped, PARTNER shows ALIGN under NRG (Strain, Uneasy, Tuned, or Bright-linked). WALK hides that row. An unchipped partner has no ALIGN row.
PARTNER shows HP, FOOD, JOY, NRG, ALIGN (only when chipped) and GROW in one block under the scene. EXPLORE and CARE sit on the line under that block. The top strip stays on WALK. HEAL, next to REST, opens the healing snacks and Wake Tonic already in the bag. It follows those item rules, gives no care XP, and shows FULL when HP is already full.

Care balance: each Walkling has its own cooldown per action (FEED 20 min, PLAY 10 min, REST 30 min),
saved with the Walkling so reloading doesn't reset it. A button on cooldown greys out and shows the time
left; tapping it explains the wait. Gains shrink as the stat fills, band by band: the part of a gain
that lands below 50 counts in full, between 50 and 80 at half, above 80 at a quarter (PLAY +20 joy).
REST fills NRG to 100 and costs 10 FOOD. At NRG 98, with no hurt, it still says "Not sleepy right now."
FEED is +40 FOOD with simpler bands: full value below 80 FOOD, a quarter at 80
and above, so FEED from 20 / 50 / 80 ends at 60 / 82.5 / 90 (the Warm Bowl's +15 comes on top).
Daily XP caps (per Walkling, reset at local midnight):
- Care XP (FEED +2, PLAY +5, REST +1): up to 25 a day. After that, actions still restore stats but give no XP.
- Explore XP: up to 30 a day, shared by walking (1 XP per 5 steps; leftover steps carry over, even
  across sessions) and befriending (+5, or whatever still fits under the cap). Befriending a Walkling
  always works, even at the cap; only the XP stops.
- Walking cost: each step costs the partner 0.15 FOOD (`STEP_FOOD` in `game.js`); NRG is not drained by walking
  (`STEP_NRG` = 0), so you can keep exploring even when energy is low. FOOD still drops 15 per 100 steps.
So a Walkling can earn at most 55 XP a day: stage 2 (40 XP) on day 1 and stage 3 (120 XP) around day 3
for a player who maxes both caps, or day 2 and day 5 with care only. The partner screen shows
EXPLORE n/30 and CARE n/25 under the bars. WALK shows EXPLORE and STEPS on the strip.
A counter turns green when maxed.

Levels, types and stats (`stats.js`):
- Level is the track that lets a Walkling grow up. **Battle XP** (`bx`) sets the **Level** shown in the header and on the Pets tab
  (`bx` for level L = 4 x (L-1)^2, Lv 1-50). Care and exploring also add battle XP, at twice the growth XP they grant, under the same daily caps.
  The GROW bar is progress toward the next form's level. The second form opens at Lv 12. The final form opens at Lv 24 and needs 2 Seals.
  Care still has a floor: 50, then 60. One Walkling can grow up before the first Seal. After that, the next grow up waits for a Seal.
  The level-up chime plays when battle XP raises the Level ("<name> reached Lv N!").
- Seals cap the level at Lv 15, then Lv 22, then Lv 30. The third Seal is coming later, so the cap stays at Lv 30. Battle XP past the cap is held (`bxHeld`) and paid when a Seal lifts the cap. A Walkling already past the cap keeps that level and form, and gains no more battle XP until the cap passes it. The absolute ceiling stays Lv 50.
- Starters begin at Lv 5. Wild creatures on the map have a level (2-5, or 6-8 for the rare second forms) and
  join at that level when befriended. The six newer lines use their own first-form ranges (Pomlet and
  Fuzzwick 2-4, Loamlet, Clinkit and Dozmouse 3-5, Vanelet 4-6; second forms still 6-8). Walklings from older saves start at their old displayed level
  (1 + XP/10) kept between Lv 5 and Lv 10.
- 4 battle stats (HP, ATK, DEF, SPD) per form from base stats and level; one type per line (the `type` in
  `sprites.js`) with an 8x8 type chart (2x / 0.5x, and VOLT can't hurt STONE). Mood (Hungry / Sulky / Drowsy /
  Spirited / Glowing from FOOD/JOY/NRG) changes battle stats; a Walkling with NRG under 10 is too sleepy to start a battle.
  Once a battle has started, any party Walkling with HP left who isn't napping can still be sent in (marked LOW NRG).
- HP: a Walkling's current HP (`hpNow`, absent = full) comes back at 10% of max every 10 real minutes, also while
  away (paused during a battle). REST restores half of max HP and wakes a worn-out Walkling.
- Worn out and TIRED: a Walkling knocked to 0 HP in battle is **worn out** for a 20-minute real-time nap (`faintUntil`
  in the save; `STAT_RULES.FAINT` in `stats.js`). It can't battle or PLAY, droops on the Walk map and shows
  "RESTING 12m"; when the nap ends it wakes with the HP it regained meanwhile (`wakeFull: false`). Below 25% HP
  (and not worn out) a Walkling shows **TIRED**. The badge (RESTING, else TIRED, else GLOWING) shows on the stats card,
  the Pet scene and the Pets tab.
- Stats card: tap STATS on the Partner tab, or STATS on the care tray. The care tray opens from the modern partner strip, and from a tap on the follower while you stand still. FEED, PLAY, REST and HEAL on the tray use the same rules as the Partner tab, on the partner only. Each WALKLINGS party card has the same four buttons, and they act on that Walkling. Box rows have none. The popup row is INTERACT, full width, and only for the partner. CLOSE stays under it. A Walkling that is not the partner has no INTERACT row. The pencil beside the header name opens the name editor, and so does the name. On PARTNER the button beside STATS is GEAR. It opens the Walkling sheet for the shown Walkling, with MOVES and USE, and CLOSE returns to the care screen. With two or more Walklings in the party, slots sit in one row beside the WALK back arrow, in party order. A tap makes that Walkling the partner. One Walkling shows the back arrow and no slots. The kit overlay is not on the page. The WALKLINGS tab opens the same sheet, with the same stats, the same gear, and its own NAME field. It shows the type badge, the level cap line,
  the next-form line, HP now/max with a RESTING, TIRED or GLOWING tag, HP/ATK/DEF/SPD at the Walkling's level with bars
  scaled to the highest value of that stat among the 57 forms a keeper can meet, and one type-chart line
  ("Strong vs X · Weak to Y"). It's an overlay (tabs lock, decay pauses); CLOSE, a
  tap outside it or Escape closes it. Any tab can open it with a Walkling id (`openStatsCard(id)` in `game.js`).

Battles (design spec BATTLE v0.3.1; moves, learnsets, trainers and battle text in `moves.js`):
- Bump into a wild creature (or tap it) and a turn-based battle opens: "A wild X wanders out!", "You're up, <partner>!".
  Your partner leads (or the first party Walkling that can battle). Each turn pick FIGHT (up to 4 moves with limited
  uses; with none left a Walkling uses Wobble), BEFRIEND, SWAP, BAG (any battle item you carry) or RUN. A new Walkling
  starts with three moves: a signature, a type jab and a type status move. The signature button has a gold stripe, and
  the Walkling sheet sub line ends with SIGNATURE. A free slot takes the next move ("picked up"). A full set opens the
  replace sheet, which leaves the signature off the list. A full set that is missing its signature is offered it once.
  Skip is final. Old saves keep every move they already have and gain the signature when a slot is free. Save stays
  `pixelpets.save.v2` with `v` 2. The only new saved flag is `sig_offer.<id>`. Effects FULL plays a per-type punch
  (wind-up, hit-stop, a ghost HP bar and a canvas number). CALM and reduced motion show one mark. OFF keeps today's
  timings, with one white frame on a strong hit. Faster Walklings act
  first; damage uses ATK/DEF, level, type, same-type bonus, mood, stat stages (-2..+2) and rare critical hits.
- Bag (INVENTORY v1): the Walk map corner opens the Bag overlay. The partner tab has no BAG. Travel Shelf sells snacks in the Lantern House.
- Items (INVENTORY v1): Heal Snack (+40% HP), Hearty Snack (+75% HP), Wake Tonic (wakes a napping Walkling early at 25% HP),
  Befriend Treat (wild battles, once per battle), Energy Sip (fills NRG, field only, 60 Acorns) and Joy Crumb (JOY +20). Trainers pay Acorns.
- Type hints start hidden: once you've seen a move's effect on a type, its button shows a 2x / ½ / 0 badge for
  that type (seen pairs are saved in `dex.hits`).
- BEFRIEND works from turn 1 with the timing bar (3 tries); the target zone is smaller at full HP and grows as
  the foe gets hurt (a Befriend Treat helps). A befriended creature keeps its moves and counts as a defeat for
  battle XP. A wild creature knocked to 0 HP is worn out and wanders off; it can't be befriended. RUN always works
  if you're at least as fast, otherwise the odds depend on speed and rise with every failed try.
  Zone width (NEXT_PLAN WP-A, `befriendWidth(hpFrac, stage, joy, treat, ctx)` in `moves.js`, tuning in `BEFRIEND_TUNE`):
  `(base x (0.30 + 0.90 x (1 - hp)) + joy/1000) x levelMul x engaged + treat`, base 0.22 (first form) / 0.14 (second),
  `levelMul = clamp(1 - 0.025 x (foeLv - 2) - 0.03 x max(0, foeLv - leadLv), 0.5, 1.1)`, engaged x1.10 once a turn has
  passed, Befriend Treat +0.08, floor 0.06, cap 0.50 (0.60 with a story bonus: Faded Fuzzwick +0.10, the Hearthmoor guide
  wild +0.08). At joy 60: Route 1 Lv 3 untouched 0.12 (was 0.17), at half HP 0.24, at a quarter 0.29; Route 2 Lv 13
  untouched 0.09, half 0.17; quarry Lv 18 untouched 0.07, at 25% HP 0.18; the guide 0.20. The quarry weakened
  width is `PixelPets.befriendOdds(18, 0.25).width`, which is 0.181 and rounds to 0.18 (lead the same level, joy 60,
  engaged because HP is under full). The quarry is Lv 16-19: the same call at 25% HP is 0.196 at Lv 16 (rounds to 0.20)
  and 0.174 at Lv 19 (rounds to 0.17). The marker speeds up 1.2% per
  level over 2 (cap +35%). An untouched foe says "It's wary. Wear it down first.", "It keeps its distance. Tire it first." or
  "It's not sure yet. Weaken it a bit." (one per battle, rotating through `BEFRIEND_WARY_LINES` in `moves.js`) the first time you
  open the bar (not the guide or a story creature); BACK or Escape clears that line. A WARY / FAIR / GOOD label under the hearts tracks the zone (< 0.15 / < 0.25 / more).
  Console: `PixelPets.befriendOdds(foeLv, hpFrac, { stage, joy, treat, leadLv, engaged, bonus })` returns the width, a
  rough per-press chance (sine marker, zone centre 0.2..0.8) and the speed; `PixelPets.befriendCheck()` is the boot-time
  monotonicity check. Four-argument `befriendWidth` calls still give the old formula.
- After a battle every Walkling that took part pays NRG 3 and FOOD 2 (5 more NRG if it was worn out), winners gain +3 JOY,
  and Walklings that fought share the battle XP. If your whole team is worn out you wake at the closest Lantern House you have been to,
  already healed, and the way out is open. A loss costs no Acorns. A rest you choose at a Lantern House still costs 5 Acorns when someone is hurt
  (the Keeper covers the fee if you are short) and fills NRG. A heart lantern marks each Lantern House door, a hanging board marks each General Store, and the first visit plays a short guide you can hear again. A nap in your own bed is still free and fills NRG too.
- Trainers summon their creatures ("{trainer} has summoned {foe}!", "{title} {trainer} challenges {player}!",
  "{player} summons {pet}!"; your keeper name, or "Wayfarer"). You can't run from or befriend a trainer's creature.
  Route 1's Pia, Tam and Ollie and Fernbrook's Tobin spot you when you step into their sight line ("!", they walk up,
  then the summon lines). After a whole-party wipe you wake healed, so walking through that line starts the battle again. The first two steps after you arrive, or after a rest you choose, do not. A win ends it. Talking still starts it. Neighbour Rook does not come back for another battle. Master Fen's Bloom Trial Hall in Fernbrook
  opens once the orchard is cleared. The floor is garden terraces that step down toward the door. Talk to him on the dais: "Begin trial", and a win earns the Fernbrook Seal (Seal card, 420 Acorns, 2 Heal Snacks).
  Seal #1 opens Route 2 (the creek, Wickerglen, and the Glow Census). On the Trial Hall doorstep, Rook says he said yes to Junior Bright on partner day. On the Glimmerwell path he says he is the fast kid from your town. Past the quarry gate is Cobblecrest: Dottie's
  stall, the buyout, Rook's second battle, and Master Hale's Stone Hall. Cobblecrest's roofs, windows and
  rooms get their own trim. A loss after you arrive wakes you in the
  Cobblecrest Lantern House.
- The Walkling Journal (PHONE, top-left of the d-pad once the Route 1 officers issue it, then the Journal app, and the WALKLINGS tab) keeps a page for each form you have seen:
  the species line, a short note, and how you met the ones who joined you. A new form's first befriend opens that page.
  After Rook's first battle, one wild Walkling waits in the grass by Hearthmoor's east path.
- Next step (QUEST, `#questBtn` on the bottom bar where Friends used to sit; NEXT_PLAN WP-C): the tab stays on the bar. It opens once you have a Walkling, and the bar locks during scenes, battles,
  and overlays. It pulses until you open it on a new objective (`questSeen`, additive). The panel (NEXT STEP) puts the main objective on a gold card and the side objective on a blue card. Each card shows Objective, the place, and a status: ACTIVE, BLOCKED when nobody can battle, or OPEN on the last step. The main card and the side card each have a TRACK button. While that quest is the tracked one the button reads TRACKED, in lime with dark ink and a dark pennant. One tap on TRACKED leaves nothing tracked. The side card's status stays ACTIVE. A line under the cards says "1 side task nearby" or "N side tasks nearby" while a Faded Walkling on this map is still unmet. DONE lists the last three finished main steps. SHOW ON MAP (the region map rings the target's node in red and names
  the place under it) and CLOSE; Esc closes. If nobody on your team can battle it adds "Your team is worn out. Rest the
  whole party at a Lantern House. A rest costs a few Acorns." From the third time NEXT STEP opens on the same step this session, the panel adds "Lost? Open the map. The blinking dot is you." while that step's target is on another map, and "No rush. A walk with your Walkling helps you think." while you are already on it. The worn-out line still wins and the status still reads BLOCKED. The count of opens is memory only and is not saved. The objective text and places are the designer's (Build 2), plus later glimmer lines for Heights, the
  Cobblecrest review, and Rook's cart: 26 rows, and 10 of them have a
  Glimmerwell variant (`glimmer: { text, place }` on the entry) that shows while `story.side` is `glimmer`; ids, `when`,
  `done` and targets are shared by both sides. Text is at most 110 characters, places at most 24 (`questCheck` enforces both).
  An accepted town-board slip is a read-only row after the side rows (D194). It shows the slip name and the current step, and it has no TRACK button. A pin alone stays off the panel. The row leaves when that slip is done. Decline does not list it. The QUEST button carries the designer's `icon_quest` (a yellow arrow signpost).
  In modern controls the same button adds the approved corner pip: gold at the top right while a main step is open (the idle "that's all for now" step stays unmarked), and tide blue at the top left while any side quest is open. With two or more side quests that blue pip becomes a blue badge with the number, capped at 9, the same number as SIDE · N. The tracked quest's pip or badge is outlined in lime. Both can show at once. The pip stays after you open the panel. The button still pulses until you open a new main step.
  On the Walk map today's small arrow bobs 1 px above the target tile (a map's top row gets it from below, pointing up). When the target is off screen the same arrow sits at the edge and turns in eight directions, with a bare tile count in a pill (across plus down, and it stops at 99). The arrow and the pill sit in a 44 px box. A quick tap on that box walks like any other map tap, so the cue never blocks movement. Holding still on the box for about half a second opens QUEST and does not walk (D796). A tap on the on-screen arrow still walks. The edge arrow nudges 1 px toward the target, and the on-screen arrow bobs 1 px, both on a 1400 ms cycle, and both stay still when motion is reduced. There is no ground ring and no white blink. An untracked main step is gold. The tracked quest is lime with dark ink and a dark pennant. An accepted slip keeps the sky rail chip in modern controls. Arcade draws that slip as a plain edge arrow, and the main and side cues use the same edge arrow as modern. Main is placed first. Boxes stay 4 px apart and 6 px from the buttons, the joystick, the place chip, the Acorn chip, the walk tip, the partner strip, the d-pad and a slip chip. When the target is on another map the arrow points at the exit that starts the shortest route there (warps and doors). The tip under the d-pad repeats the objective once the first-steps
  tips are done. The chain lives in `quests.js` and is derived from story flags only (nothing to migrate: old saves land
  on the right step; a later flag counts the earlier steps as done). Console: `PixelPets.quest` (read-only),
  `PixelPets.questCheck` (every story flag the data writes is a step or on the not-a-step list; also run at boot).
- Region map (MAP, bottom-right of the d-pad): three buttons under the top bar, ROOM, TOWN and REGION, each 44 px tall. Outdoors, MAP opens on TOWN and ROOM is greyed (a tap plays the denied blip). Indoors, MAP opens on ROOM. SHOW ON MAP still opens REGION. ROOM draws the floor, thin walls, openings, and OUT, UP, DOWN, LIFT or DOOR. A floor you have not stood on reads ??? and "You haven't been up here yet." TOWN draws the outdoor place: roofs, doors and edge exits. A building you have not entered keeps a grey roof and its name. An exit to a place you have not visited reads ???. Tap a visited place, then SEE MAP, to look at that town. Tap a building you have entered, then SEE INSIDE. BACK TO ME returns to where you stand. A blue ring blinks where you are, and stays steady when motion is reduced. The red ring is the next step when that tile is on the map shown. Nothing on the map pans. REGION draws the Amberwild picture under the places, paths, rings and labels. Fog and ??? stay. With debug, forcing the backdrop off restores the parchment. Hearthmoor's line on the map is "Hill village of the Keepers. Home." The town sign reads "HEARTHMOOR · Hill village of the Keepers. Home. East: Route 1." The High Charity room is Trial Hall. Towns are squares, routes are small circles, side places are teal circles. A blue ring is you, a red ring is the next step, and that red ring still blinks. The tracked quest, main or side, is a solid lime ring with a dark edge. While the main story is tracked, that lime ring sits just outside the red one. Untracked side quests stay dim blue dots. Visited ground shows who holds it: green and gold for the Keepers (the same trim as Keeper roofs), cyan and mint for Glimmerwell (the same trim as their ground), split for a shared claim, and wild country has no halo so the picture shows through. Unvisited places stay `???` and do not give the holder away. Hearthmoor, Route 1 and High Charity are Keepers. Fernbrook is shared (the town and the Glimmerwell stand). Route 2 is shared (the Keeper road and the Census). Wickerglen is Glimmerwell. Cobblecrest and the quarry stay Keepers until `story.quarry_bought`, then Glimmerwell. The Heights stay Glimmerwell until `story.sm_done`, then shared. Old Meadow and Mahopac are wild. Hushwater is a wild side place on the stream between the quarry and Wickerglen. It opens after Cobblecrest. The region map names it HUSHWATER. High Charity is the lantern coach, drawn as a green dashed line, and it no longer sits on Mahopac. A gold stamp marks Fernbrook and Cobblecrest once that Seal is earned. Tap a place to read it (the card names the room when you are indoors). Arrows move that reading and do not walk you. CLOSE, Escape, or the dark margin puts the map away. After the pledge, the map says which side you are on. The key under the parchment names every mark. Console: `PixelPets.mapHold(id)` and `PixelPets.mapCheck()` (also at boot). High Charity's roofs wear Keeper gold and green.
- Sides (NEXT_PLAN WP-B0 / Build 3): at the Fernbrook orchard gate (9,10) a
  one-time scene (`side_pick`) lets you help Fen (Keepers) or Tobin (Glimmerwell), with a confirm step. `story.side`
  (`keepers` when absent, so older saves play as before) and `story.side_pick_done` are plain flags; no save version bump.
  The glimmer branch sets the same progression flags as the keepers path (`story.orchard_cleared`, `story.seal1`, ...), so
  gates, the quest chain and the region map are shared. Engine: a scene `X@glimmer` runs instead of `X` while the side is
  glimmer (`sceneSteps`), a trainer `id@glimmer` is merged over `id` (lines merged), objects use `when: ["story.side=glimmer"]`;
  new step `["inc", flag, n?]`, numeric conditions `flag>=n`, `<=`, `>`, `<` (unset counts as 0), and an optional 4th
  element on a `choice` option (`when`, a condition or a list) hides it until earned. When a story beat (a scene that sets
  a `story.*` flag) finishes, `story.beat.<scene>` records which side played it (first play wins). Build 3 replaces the
  Fernbrook glimmer dialog and the Hall #1 audit stub with the Bright Pavilion Tour (four stops on the existing map:
  lantern stand, crate Comfort Check, Hall slideshow, optional Fen match). Those stops, the wait line, and the stage photo use the final D26 lines, spoken by Associate Juniper. The Hall panel still reads `panel` off the
  side-merged `hall1_fen`. Keepers still battle Fen for the Fernbrook Seal. The glimmer win or the skip stores
  `seals.seal_glim_1` ("Bright Tier 1 Lanyard", delivered art) and runs `seal1@glimmer`. A loss wakes you at the Lantern
  House and the tour resumes at stop 4. "Think about it" sets nothing; stepping off the gate toasts one walk-away line
  and the pick re-arms. All of it lives in `data/glimmer_path.json` (ours, not a design copy; registered in
  `tools/gen_mapdata.py` and merged last). Console: `PixelPets.side`, `sceneFor(id)`, `trainerFor(id)`, `glimmerCheck`
  (line length after tokens, choice labels ≤ 30, ambient lines ≤ 40, double spaces, unknown tokens, every variant has a
  base and sets the base's story flags; also run at boot), and with debug `setSide('glimmer' | 'keepers')`.
  The first-wild step follows the live guide creature.
- Keeper House and the phone: Hearthmoor roofs wear gold and green. Glimmerwell ground (the glen, and Cobblecrest after the buyout) wears mint. Officer Bren patrols the Hearthmoor road out to the east gate. Officer Cald stands just north of that gate. The tree that closed the grass there is cut, and the town sign stands south of the path. The north trail signs stand at (11, 2), east of a three-tile mouth at (8, 2), (9, 2) and (10, 2). That trail stays shut until Mom opens it. Coming back from Mahopac lands at (9, 3). Warden's Lodge door is (15, 6) and Rook's House door is (20, 5). The Keepers phone tile is light. The Glimmerwell phone tile stays dark. Fernbrook, Route 2, the glen, and Cobblecrest each have a watch officer. Clerk Mint appears in Cobblecrest after the quarry buyout. The Keeper House south of that road has two floors. Downstairs are Sergeant Bram, Archivist Mo, Clerk Wynn, Constable Corwin, and Cadet Orrin. Upstairs are Captain Lumen, Operator Rue, Signaller Tamm, and Scout Linnea. Both floors use ashlar walls, a slate lozenge, and a zone floor in each room. Your Home keeps its size, its wide honey pine boards, and its door. Its wall is the shared two-tile kit: a warm cap, a pale face, and two windows. Upstairs keeps the loft colours. Stairs read as flights, and every enterable door has a stone step. Every interior uses that same wall kit, in its own colours. Eighteen rooms have calm floors. The rest keep theirs. Flat 5B is 18 by 16. Lizzy's room and Ossabell's room keep the honey floor. Caleb's room uses calm paint-fleck planks. The Hearthmoor Lantern House uses a warm sand checker and cream walls. Cobblecrest's lantern room uses a warm clay floor. Rook's House uses honey oak boards and rose sprig wallpaper. The Warden's Lodge uses a warm grey flagstone, one stone a tile, timber-board walls, and a Keeper-green wainscot. Upstairs is white boards. Breckenridge Observatory uses dusk-violet floorboards with soft seams and a brass compass inlay, and a night-navy dome on a walnut wainscot. South of the stream, the Hearthmoor Schoolhouse and Amberhill Flats stand on the grass. Lizzy teaches at the schoolhouse and lives in flat 5B with her sisters Ossabell and Marilou, and Marilou's partner Caleb. After you meet her, Buddy is on his bed in 5B and beside her desk at school. The drip in the bathroom can go to the Keepers, or you can make Mr. Gristle fix it. Her partner Buddy waits with her until you have a partner of your own. She understands Spanish and answers in English. She talks to you as an old friend. School Lane runs south of the last old grass row. Lizzy and Buddy wait on the grass below it, facing up. When a person on the map would stand under the text box, the box moves to the top. If the top would cover them too, the view eases so they sit higher. Narration stays at the bottom. The lift panel lists floors 1 through 6. Only 5B is a room, and the doors open after you meet her. Mr. Gristle keeps the lobby office. The school hallway is cream linoleum under a red runner. The lobby is pale tile and speckled terrazzo, with a door mat. Flat 5B keeps a terracotta kitchen, a wood bedroom, a green hall runner, and a navy game room. While Mom's trip is the tracked side quest, the walk marker points at the telescope, including after you leave a dream before it ends. Inside the 2004 dream, that marker sits on the popping toy and moves with each push. A Modern tap on the toy walks up and pushes it. In Arcade, TALK does the same when you face it. A Modern tap on a birthday balloon walks up and pops it. Progress stays in story.dream_roll and the balloon flags. Save v stays 2. Before you pledge, they treat you as a citizen. Keepers hear warmer lines as Standing rises. A Glimmerwell pledge gets a cold door. The first side quest is on Route 1, and it only says to go explore. Officer Ness stands at the west end the whole time. Talk to him, or take a few steps past him, and he bumps into you: a Keeper1 is free and required for every holder, by mandate of the Keeper High Court, before the wilds will have you. Warden Ilse gives the first Walkling so a young holder can learn to defend themselves, and she hopes you join the Keepers and use it for good. PHONE (top-left) opens Contacts, Notes, Journal, Friends, KeeperUAV, Ribbit, and BOARD. BOARD is the town post: the masthead, the slogan, the reports that match so far, then slips and the empty bounty line. After Rook's battle, Hearthmoor has one slip, Gate count. Go see them pins it. Cald's yes starts the count. Other towns have no slips. The bounty line stays empty. A pinned slip uses the same blue chevron. The latest pin is the one on the map. Saying yes lists that slip on the QUEST tab. A pin alone does not. In a town it is that town. Indoors it is the outdoor town. On a road it is the last town, and a line says you are between towns. Hearthmoor and Fernbrook stay the Lantern Post even on a glimmer pledge. Cobblecrest becomes Bright Notice after the quarry buyout. Mahopac's board has no masthead. The phone button stays hidden until Keeper1 is issued. The wooden post still opens on foot. Hearthmoor's street widens into a crossing in front of the Keeper House. Fernbrook grows a forecourt north of the path, with a crooked Comfort flyer beside the board. Notes say the Lantern desk can read them. Joining Glimmerwell also puts a Cracked Handset in the bag. The bag shows Keeper1 and the Cracked Handset as keys, with the note to open PHONE, and no USE button. While you are Glimmerwell and carrying it, the phone shell becomes the thin CRACK//HAND, and KeeperUAV is replaced by Botnet (placeholder jobs and parts). The cracked Notes are signed Handset. One of them says jobs and parts live under BOTNET, not here. A blue chevron marks the side quest. The main quest chevron stays yellow. Higher Glimmerwell Standing tints your holder with mint, then silver. Archivist Mo's books fear a child born already listening. That generation is not in the game. The phone has Ribbit, a read-only feed. Block News and Chirp Worldwide post about the towns. Local notes and the trending tags follow the day, the place you are standing, and the story. You cannot post.
- Fernbrook Heights (before the first trial): once you pick a side, Fen or Juniper offers "get to know us" and sends you north. The walk tip shows that objective once the quest has moved on, even if the Hearthmoor wild was never met. Talking to Fen again before the orchard is cleared says the crates are by the gate. The Hall can wait.
  Keepers investigate a smuggling tunnel. The broker's den is packed earth, the crate hold is a warm steel plate, the tunnel is dark rock, and the yard is deep moss under the light well. Those four rooms and the four lab floors use the shared wall kit in their own colours. The lab floors stay as they are. After the haulers step aside, Officer Ken of the Fernbrook watch interviews each Walkling with you, then walks them toward the orchard. Glimmerwell enters the RegenX lab,
  four floors, to copy Atten (a focus aid) and its brewing plans. The lobby, Focus Wing, Records room, and Arbiter bay
  are different rooms. The lobby, Focus Wing, and Records room are 14 by 22, the same size as the Arbiter bay. The lobby keeps the white floor and adds a mint inlay. The Focus Wing has pale blue grout, a pale blue stripe, and sound panels. Records has amber grout and an amber stripe. RegenX does not know the vials sit near The Arbiter,
  ancient Glimmerwell technology. It emits something slowly. Nobody can name the emission, or why the machine was built.
  A floating computer, the VOLT line Bitlet, Hoverbyte, and Archivolt, woke in that bay. It is not a sample. You can befriend it.
  It does not appear in the wild.
  Each Heights beat adds Standing for the side you are on. The trial and the
  Tour's first stop wait until `story.heights_done`. A save that already has Seal 1 is not sent back.
  Some fights are group battles: two foes at once, TARGET to choose, and on the last fight an ally Walkling steps in.
  Stock up at the Heights crate. Key items (Atten Vial, Atten Plans, Route Page) stay in the bag.
- Glimmerwell after Fernbrook (Builds 4–6, still in `data/glimmer_path.json`): Route 2 logs you as a Glow Census
  volunteer. The quiet log gives Rook one `story.rook_bond`. Wickerglen still bumps the lamps and pays 3 Befriend Treats.
  Cobblecrest puts you beside Dorian; Hale loses the quarry; Rook objects to the word "units". Hall slot 2 is Arbiter Testing
  on this branch: Tune my partner or pick another Walkling chips that one Walkling (align 50, locked in the party). Meet the quota
  (three spoken names) or Face the review still close the file with no chip. The snack stays in the bag. Any close grants
  the Bright Tier 2 Lanyard (`seals.seal_glim_2`, `LANYARD_TIER2`: gold rim, mint field, two white marks), 2 Hearty Snacks and 1 Wake Tonic, and sets
  `story.seal2`. One chip per save. The wardrobe HOLDER tab offers the Junior Bright lanyard to a Glimmerwell holder after the pledge (D443, on this branch). A Keepers holder does not see it. On the Brinewick cart, Keepers Rook gets off (`story.rook_end` `"ally"`) and Glimmerwell Rook stays
  (`"stays"`). Both paths set `story.cobble_end` and show the same coming-later card. After that flag, Rook waits on the Cobblecrest east road. The side quest "The last crates" (`rc_meet`) sends you to three crates in the quarry. Keepers quit at R5 (`story.rook_quit` `"r5"`). A Glimmerwell player who stays does not set `rook_quit`; his mint lanyard stays on, and he says the chip makes him nervous. A Glimmerwell player who walks away switches to the Keepers, and that path sets `story.rook_quit` `"offer"`. `story.rook_end` is not rewritten. The lanyard comes off when `story.rook_quit` is set, and it still comes off when `story.rook_end` is `"ally"`. Keepers free the crates and fight Associate Tobin. The walk-away path frees them with Rook. A Glimmerwell player who stays fights Rook (`rival3_rook`). Hale pays the road snacks when the crates go home. Juniper pays an Acorn bonus when they ship. Brinewick stays closed. After that flag, a Keepers save is called to the Lantern Council in Sky-Dock Command (`hc_council`). The fourteen High Charity rooms keep their size. The school, the gym, the apartment, the barracks, the marina, and the hall have calm floors. The other eight keep theirs. Each one uses the shared wall kit in its own colours. Its Lantern House uses warm tiles with sage grout. A Glimmerwell pledge does not see it. A Glimmerwell pledge after Cobblecrest walks The Signal Review: the quarry stage, the Wickerglen lamps, Route 2, and the Arbiter Bay briefing. The quest row covers that pointer until `story.hc_council_done`. Brinewick stays closed. Keepers Route 2 and the Hale trial
  are unchanged. `story.rook_bond` does not gate the cart.
- Standing (Build 2, GLIMMER_PATH v0.2 BS; NEXT_PLAN WP-B "Standing and switching"): each side has a 0-100 meter,
  `S.standing = { keepers, glimmer }` (additive, `v` stays 2; `save.js` fills a missing or bad value with 0 and clamps the
  rest). Tier = the highest threshold reached (0 / 10 / 25 / 45 / 70 by default: Stranger, Friend, Trusted, Hall Friend,
  Warden's Ally for the Keepers; Guest, Associate, Junior Bright, Bright Lead, Founder's Pick for Glimmerwell). **Every
  tier name, blurb, toast, threshold, cap, grant amount, switch cost and cooldown rule lives in `STANDING_CFG` in
  `standing.js` and nowhere else**; the yellow decisions Q2/Q3 are one edit there. No story gate depends on Standing.
  Scenes grant it with `["standing", side, n | null, oneShotId]` (a null amount reads `STANDING_CFG.grants[oneShotId]`;
  `standing.got.<id>` stops a replay from granting twice). Grants wired: the side pick (+10 to the picked side), the orchard
  (+5, either side), Seal #1 / the Bright Tier 1 review (+10 to the side played; the Tour completion is that same grant),
  the optional Tour match (`tour1_match`, +5 glimmer, only on a win), Heights beats (offer, rooms, Ken's interview, finales),
  Builds 4–6 (`glen_g`, `quarry_g`, `seal2_g` on glimmer, `r5_k` on keepers, `r5_g` on glimmer, 5 each, once), and the Lantern Council (`hc_council_k`, +10 keepers, once). The Signal Review grants `gb_relay_g` (+2 glimmer), `gb_callback_k` (+2 keepers), and `gb_brief_g` (+10 glimmer), each once, and those three do not move ALIGN. `cond()` accepts
  `standing.keepers>=2` / `standing.glimmer>=2` (the tier, not points) for later lines and options. Reaching a new tier shows
  that tier's toast once (`standing.top.<side>`). Daily earning (care for the Keepers, output for Glimmerwell) is not built:
  the spec has no numbers yet.
  **Switching** is only through Rook, after The last crates (`story.rc_climax`), and it works both ways. Fernbrook Pledge desks stay removed. The Lantern
  panel is Rest and Leave, and Juniper talks without a desk option. A later end-game switch is not built (D161). The gate scene offers the switch and then writes
  `story.rc_climax`. Rook's letter reads first, then "Really? Glimmerwell Standing 30 → 15" with Yes / Not yet. Yes halves
  the side you leave (floor), keeps the side you join, rewrites `story.side`, counts `story.switches`, records
  `story.switch_chapter`, `story.switch_at` and `story.switch_via` `"rook"`, then plays the review and the welcome. A second
  switch in the same chapter gets the refused line. `chapterOf()` counts `story.seal1`, `story.seal2`, and `story.seal3`
  when that flag exists. Seal 3 is not built, so a current save gets at most one Rook switch after Seal 2. An older save
  that already switched and has no `story.switch_via` loads with `"desk"`. Debug `switchSide(to, true)` is the only free
  switch. Switching never touches progression flags, Seals or lanyards, `story.rook_bond`, `story.rook_end`, or `story.beat.*`.
  The quest overlay gains a read-only **STANDING** tab once the pick is made: a row per side with the emblem, tier name,
  blurb, a bar to the next tier and a PLEDGED marker, plus "Pledged to {faction}" and the explainer
  "Standing is how much a side trusts you. Only Rook can help you change sides." Console:
  `PixelPets.standing` (`{keepers: {points, tier, name}, glimmer: {...}, side, switches, chapter, via, canSwitch}`),
  `standingCfg()`, `standingCheck()`; with debug `setStanding(side, n)`, `switchSide(to, free)`, `rookOffer(to)`.
  The `switch_desk_glimmer` pixels stay in the art table and are retired. They are not placed.
- Reputation (LIZZY_REP v0.2, D174, D175, D178): each person you can meet has a number from 0 to 100 in `S.rep`
  (additive, `v` stays 2; only values that differ from their start are stored). Rook starts at 40. Mom and Dad stay at 100.
  Warden Ilse and Clerk Wynn stay at 50. Everyone else starts at 50. The tiers are hostile 0-19, cool 20-39, neutral 40-59,
  warm 60-79, and close 80-100. A person on your side counts as 10 higher in conversation, and a person on the other side
  counts as 10 lower. The stored number does not move for that. Joining a side, and each later switch through Rook, lowers
  every met person of the side you did not join by 10. People you meet after that stay at their start. `S.repJoins` remembers
  how many joins already applied. Scenes move a number with `["rep", Name, n]`. `cond()` accepts `rep:Lizzy>=60`,
  `rep:Lizzy<20`, `reptier:Lizzy=warm`, and, on that person's own lines, `reptier=warm`. The table is `data/reputation.json`.
  `PixelPets.repGet`, `repTier`, `repEffective`, and `repCheck` are always available. Debug `repAdd(name, n)` writes a number.
  The compass (`#repBtn`) is on screen from a new game. On the modern walk screen it is the top-left button; QUEST, BAG and MAP sit one slot lower. In the header it is the first button, 44 px. It opens PEOPLE. The list is people you have met, most recent first, each with a face, a 0-100 bar and a tier word. Fixed people sit at the end with a lock. Pets are not listed. With nobody met it says "Nobody yet. Go say hi." A face opens a card with the stored number, the tier word, and source lines from `data/reputation.json` (empty until later quests add rows). Under the tier, someone who trusts you shows an icon and where they are, such as Schoolhouse · AT WORK. Mom and Dad read home · AT HOME, with the house icon, and that line stays. Warden Ilse reads Warden's Lodge · AT WORK. Officer Ness reads Route 1 · AT WORK while you are on Route 1, and Hearthmoor · AT WORK otherwise. Rook reads the map he is standing on, such as Cobblecrest Quarry · OUT AND ABOUT. Between those spots he reads home (off the map) · AT HOME, or ASLEEP late. Keeper Marigold reads Stitch & Lantern · AT WORK, with no schedule. Cool or hostile shows Keeps to themself. The footer reads Only people who trust you share where they are. The line follows the in-game minute and refreshes when the panel opens. It is not saved. The list hides while that card is open. BACK on the card returns to the list. BACK on the list, or Esc, closes it.
  The modern walk acorn chip is a nav plate, 44 px tall, just left of the gear. The number is yellow and starts after the acorn. When the count goes up the plate turns blue for a moment. Reduced motion skips that flash, and the first time the count is shown it does not flash. On a meal menu, and when a hurt party is asked to rest at a Lantern House, the chip stays on screen. A spend counts the number down over a short moment; reduced motion snaps to the new number. A free rest leaves the chip hidden. The header count counts down the same way. The bag keeps the small acorn icon. A shop, a meal menu and the Travel Shelf open as one sheet on the bottom of the room. The balance is a pill and it counts down with the chip. A row you cannot buy says why, and BUY still takes one tap.
  Once you have the High Charity letter (`story.hc_invite`), Lizzy, Rook, and Captain Lumen answer it by how much they trust you. The five lines are hostile, cool, neutral, warm, and close. The word they use is the effective tier, so Captain Lumen at 55 is warm for the Keepers and neutral for Glimmerwell. A first meeting, and a later story line such as the council, stay in front of the letter. Usual side and standing lines stay behind it.
- Moves are learned on level-up (prompts after the battle; with 4 moves you pick one to forget, or don't learn) and on
  growing up (each line's grow-up move, then any level moves of the new form). Older saves get missed grow-up
  moves on their next visit ("<name> remembers something from growing up!").

Keeper and follower (MAPS_SLICE Phase K): you walk the map as a keeper, a 16x16 person drawn in 3 layers (body,
outfit, hair; art in `keeper.js`, copied from Design's `keeper_art.js`) with 4 facings (left mirrors right) and 2
walk frames. Six skin tones are new `PAL` keys `1`-`6` (nothing else in `PAL` changed). Your look is
`player.look = {skin, hair, hairCol, outfit, outfitCol, accent}` and your name is `player.name` (both in the v2 save,
no version bump; `normalizeLook()` fixes old or bad looks on load, e.g. the v0.4 draft's `{hair, skin, coat, scarf}`).
- Look picker (`#ovLook`): a big animated preview, NAME, then SKIN (6), HAIR STYLE (short, long, spiky, bun, bob, pony, curls, buzz),
  HAIR COLOUR (14), OUTFIT (coat, hoodie, tunic, vest, sweater, dress), OUTFIT COLOUR (7), ACCENT (7), and ACCESSORY (none, glasses, bow, cap, scarf, and, after a Glimmerwell pledge, the Junior Bright lanyard), plus SHUFFLE. A Keepers holder and a new player do not see the lanyard. A saved lanyard stays in the save and is drawn as none until that pledge is on. The pledge toasts "New look: Junior Bright lanyard." once. The wardrobe HOLDER tab offers the same card. A new player sees
  it first ("WHO ARE YOU?", no CANCEL), then the starter picker; nothing is saved until DONE. DONE stays on the screen while the rows scroll. Each section label shows in full, with clear space above it. The selected ring shows on every side. A cap or a beanie covers the hair above its brim. The name field stays hidden; Ilse asks the name in the Lodge. Picking one in the Lodge plays an upbeat loop, shows that Walkling on a card, and sets them beside you before you step outside. Later, Change look in
  Settings (the header gear) opens it with CANCEL. Names: trimmed, spaces collapsed, `< > { }` and control characters dropped,
  10 characters max, empty = "Wayfarer". Friends live in the phone (FRIENDS app). The tab reads HOLDER and YOUR HOLDER CODE, with twelve slots. ADD stays off until a room code is set and the shared walk is on. Friends see your name. Others see a made-up one. The Pet scene shows a small "HOLDER name"
  label in its top-right corner ("Wayfarer" until named). The bond hearts stay clear of that badge. The accessible name is "Holder {name}".
  FEED, PLAY and REST show their icon on the same line as the word.

Play together (D195–D208, on this branch): with a room code, holders on the same code see each other on Hearthmoor and Route 1. SAY opens a wheel of emotes and set phrases. Tap a holder for their card (WAVE, MUTE, BLOCK). SOLO and interiors drop your spot. Nothing in a room node is free text. Trading is not in this build (D198). Save `v` stays 2. The only new save field is optional `settings.showOthers` (`on`, `friends`, or `solo`; missing loads as `on`). The device key `pixelpets.net` holds the room code, mutes, and blocks, and Start over clears it. The Play together rules were published on Oct 19, 2026. The root `.read` and `.write` rules stay false. This build adds `parties` rules: creates and updates need `/config/coop/on`, and deletes stay open. Hidden holders are polled every 30 s and friends every 60 s. `/config/net` and `/config/coop/on` stay on listeners. `/config/coop/on` is the co-op kill switch: a signed-in holder can read it, and a client cannot write it. `PPNet.coopOn()` is true only when `COOP_CFG.on` is true and that value is true. `COOP_CFG.on` defaults to true for everyone. `?coop=0` turns it off and wins, including on the emulator. Co-op is on for everyone. The server switch `/config/coop/on` is the kill switch. With the switch on, a mutual friend in the room gets WALK TOGETHER. JOIN and NOT NOW answer an invite. The strip reads GROUP n/max. LEAVE GROUP, and Block, end it. A hidden partner greys for 60 s. No co-op entry point shows while the switch is off. The device key also holds `party` while a walk group is up. Start over still clears that key. Save `v` stays 2. This build adds no save field.
- With no Walkling yet the keeper still walks (no energy, food or XP, no wild creatures).
- Follower: your partner walks one tile behind you on the Walk map, taking the tile you just left (it never
  blocks you, wild creatures or spawns), bobs as it goes (half speed and 1px lower while worn out, the 20-minute RESTING nap after a battle), swaps when you
  pick a new partner and changes when it grows up. On load it stands behind you, or under you if that tile is
  solid. Tap it to open its stats card (a wild creature on the same tile wins the tap). Follower on/off in
  Settings turns it off (`settings.follower`, default on). Effects are a separate slot from an adornment (`aura` on the Walkling). Emberwake rises under the partner on the walk map. Lanternfly motes circle at head height, and at night they gain a small halo. Kilnsmoke leaves a puff on a step once it is granted. FULL draws them, CALM holds one still frame, and OFF draws nothing. A phone that asks for reduced motion starts on CALM and stays calm while that request is on. They are off in battle, in scenes, and while a panel is open. The wardrobe preview still draws the selected effect. Settings → Effects cycles FULL, CALM and OFF.

Pet tab scene: drawn from the current map's `backdrop` (town, route, meadow or grove; `MAP_INFO` in `game.js`,
missing or unknown = meadow) with the same time of day and weather as Walk: night
sky with moon and stars plus Walk's night tint, a dull sky in rain/storm/snow/fog, and the same rain, storm
flashes, snow and fog, a little lighter on the small canvas.

Fast mode (debug mode only): the old demo pacing (full to starving in about 17 minutes) for testing.
Turn it on with `?debug=1&fast=1` in the URL (`?fast=0` turns it off), the F key, or
`PixelPets.setFast(true)` / `PixelPets.setFast(false)` in the console. The choice is remembered in
localStorage key `pixelpets.fast` (separate from the save). While it's on, a small FAST tag shows
next to the Walkling's name in the header, and a toast appears on toggle and on load.
Fast mode also shrinks care cooldowns (FEED 20 s, PLAY 10 s, REST 30 s);
the daily XP caps are not scaled (use `PixelPets.resetDailyCaps()`).

Wild creatures: there are no hidden tall-grass rolls any more. 3-4 wild Walklings wander the Walk map
(on grass, shore or woods tiles, blocked by trees/water, never on the path). They bob and blink,
leave after ~2.5-4.5 minutes of Walk time (or sooner when far off-screen) and new ones pop in.
Bump into one, or tap it so your Walkling walks next to it, to start a battle with exactly that
species and form (see Battles above). Second forms are rare (5%, they twinkle). RUN leaves the creature where it
is (it shies away for a moment); befriending it, beating it or letting it flee removes it. If no Walkling can battle
it shies away too. Under 10 NRG the line is "Battles start at 10 NRG. REST first!"; a worn-out team still hears "Your team needs a rest first!".

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
  cold (<= 3 °C), windy (>= 30 km/h), night (the in-game clock, 20:00-05:00).
- The place chip shows the in-game day and time, for example TUE 8:30, a weather glyph when the weather is known, and the place name under that. One in-game day is 42 real minutes. Tap the chip for today: the place, the hour, and a map shortcut. It points you to the compass or a contact for who is where. On a modern walk it sits under the gear and slides down when an exit's tap zone would cover it. In arcade it sits in the row above the map. Dawn and dusk lay a still colour wash on outdoor maps. Night keeps the same dark overlay. Lamps and lit windows are on from 19:00 to 06:00. Interiors stay unwashed. Daily care, the Warm Bowl, and the daily hello stay on the real calendar. The clock is not stored in the save.
- Hearthmoor is 24 by 34. South of the old tree line is Market Row: Lamplight Provisions, Stitch & Lantern, the Parked Coach (coach planks, a kitchen tile zone, and two booth rugs), and Lanternball Court. The store sells the usual snacks. Keeper Teague has the day shift and Keeper Quill the night shift. The diner serves Coach Stew (30), Berry Stack (40) and Hearth Plate (70), and the day's Warm Bowl. Keeper Marigold runs Stitch & Lantern. She says "Stitch & Lantern. Try anything on. Your Walkling too." and opens the wardrobe. Her contact card reads Now: Stitch & Lantern · AT WORK. A cool or hostile tier still reads Keeps to themself. The tap that closes her line does not press a card, even if the finger stays down. Seven Walkling adornments are for sale, including the Amber star at 90 Acorns, plus Emberwake (2,400 Acorns, once the first seal is set; the line is "One coal in the shadow."), plus four holder pieces and four outfit colours. The seven outfit colours already in the game stay free. On a weekday after school, Pip and Wren stand on separate court tiles.
- Hearthmoor Plaza (`hm_plaza`, D797) is through Hearthmoor's west edge at rows 4-6, just left of the home, and is open from the first morning. It is a paved square with a round fountain and a Keeper statue on its island. It also has a market row, benches, cafe tables, flower beds, Keeper banners, lanterns and a pond. Officer Vale holds the west watch in the officer coat (green and gold, his own face). Keeper Pryce trims the lamps in a keeper tunic and cap, not the officer coat. Cadet Lisse wears the green vest and tends the statue. Grete Ash sweeps the fountain, Joss Merrin sells Fernbrook apples, Nella Corrick wove the three baskets Warden Ilse sets out, and Tansy Holt draws in chalk. There are no wild Walklings. After the first partner, Officer Vale asks for a lap of the square, then a reading of the plaza sign. After Cobblecrest, lantern night pays one Heal Snack. Nella names the three starter baskets. Before Rook's gate battle, Tansy Holt says he bounced through at dawn. The town map shows the gate as HEARTHMOOR PLAZA.
- Every outdoor map except Mahopac has a store. Lamplight Provisions also sells the Wick charm. Route 1 has the Waymark Cart (Keeper Halvard). Old Meadow has the Meadow Honesty Box, and Farmer Tibbet stands by it at dawn. Fernbrook has the Orchard Stall (Wynne). The Heights supply crate is headed Heights Supply Crate and sells a Cliff Flapjack. Route 2 has the Watchpost Hatch (Watch Saffie). Wickerglen has Wicker & Willow (Weaver Ilka). Cobblecrest keeps Cairnside Supplies and adds the Lamp-oil Counter. The quarry has the Seam-side Tool Cart (Toolwright Brannoch). High Charity's Lantern Market sells the Hall ribbon and Lanternfly motes (3,000 Acorns; the line is "A few lanternflies, for luck."), and Baker Cole sells an Amber Glaze Bun. The Hushwater Cut has the Fallstair Supply Post (Warden Teodor). A stall snack is eaten on the spot and does not offer the Warm Bowl. An accessory bought at a stall uses the same `wardrobe.<id>` flag as Stitch & Lantern, and an owned one reads OWNED.
- The place chip on the Walk screen shows the place and the hour, and the weather when there is some (tap it for today); rain and
  snow fall over the map, storms flash, fog hazes it and night tints it.

Creatures: 25 lines of 3 forms. The WALKLING JOURNAL lists the 57 forms a keeper can meet in its grid. Every line a keeper
can meet grows up the same way (Lv 12, then Lv 24 with 2 Seals, plus the care floor, then GROW UP). The six newer lines (design spec CREATURES_SLICE):
Pomlet → Pomshell → Orchardon (BLOOM beetle), Loamlet → Burrowbloom → Hedgewarden (BLOOM mole),
Clinkit → Shardpincer → Mosaicrab (TIDE crab), Fuzzwick → Filamoth → Halowatt (VOLT moth),
Vanelet → Vanefledge → Squallvane (GUST, weather form) and Dozmouse → Lullamouse → Moondozer (SHADE dormouse).
Bitlet → Hoverbyte → Archivolt (VOLT `byte`) is a floating computer. It is `labOnly`: the Arbiter bay is where you meet it,
and it is never part of the habitat roll or the 8% any-species roll.
Fetchling → Harvestail → Hearthound (BLOOM `fetch`) is NPC-only. `npcOnly` keeps it out of the wild roll, the starter
baskets, and the journal. A keeper cannot meet one. Hushwater adds four lines a keeper can meet: Tindlet → Cinderskink → Kilncrest (EMBER skink),
Rimelet → Frostrill → Spraymane (FROST otter), Hushlet → Quillhush → Vesperowl (SHADE owl) and Lichlet → Screeback → Cairnshell (STONE snail).
Wild levels on the stream are 19–23. Save `v` stays 2.
Unseen Vanelet-line entries in the Journal show a small cloud ("check back in bad weather").
Nicknames: after a befriend the result card asks "Give it a name?" (optional, up to 10 characters: letters,
digits, spaces and ' . ! ? -). Leave it empty to keep the species name. A nickname shows in the header and on
the Pets tab (with the species name underneath) and is saved in the Walkling's `nick`. The pencil beside the header name on the stats card, and the
NAME field on the Walkling sheet, change a name you already gave. Leave that field empty, or type the species name,
and the species name shows again. Save `v` stays 2.
Save `v` stays 2.
The Answerers (ARBITER_UNITS, `handoff/walklings/ARBITER_UNITS.md`): Tallybat, Dimlamp, Filecrow, Cordhound and Humwisp (SHADE).
Glimmerwell built them as its first relays, before the Tuning chips, and the Arbiter's hum woke them. Each keeps one name and never
grows up. Its tiers, Quiet, Humming and Answering, rise with a HUM meter (`pet.hum`, tiers at 40 and 100) that a won battle, the
first daily visit to a Glimmerwell place and the first daily visit to its own lair fill. HUM shows in the GROW slot. STILL on the stats
card stops the meter. Each has one passive Echo, shown on the stats card. They are met only as bosses on Route 3, the Brinewick road,
which opens past Cobblecrest's east sign after Rook's last crates and that side's chapter end (the Lantern Council or the Signal
Review). A boss opens at Humming with 1.5x HP, cannot be befriended until it shifts to Answering at half HP, returns the next day if not
befriended, and joins at Quiet. Archivist Mo or Associate Quinn opens the side chain "Five that answer"; the close pays 500 Acorns. They
sit in their own journal row, outside the 57. Save `v` stays 2.

Location and privacy: on the first visit to Walk a card asks "Use your location so local creatures
appear? ..." with Allow / Not now. The tap that closes the line before that card does not press
Allow or Not now, even if the finger stays down. Only Allow calls the browser's Geolocation API; the answer is
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
failed lookups fall back to a plain meadow (plus night from the in-game clock); play is never
blocked and the badge shows NO GPS / OFFLINE / DEFAULT.

Pick a place (debug mode only): the badge card has preset buttons (Meadow, City, City rain, Mountain, Lake,
Forest, Desert, Snow, Storm, Night, plus AUTO to go back to real data), saved in
`pixelpets.envOverride`. Environment console hooks (the `set`/`spawn`/`clear` ones need debug mode):
- `PixelPets.env`: current area `{tags, label, status, temp, place, ...}`.
- `PixelPets.setEnv('snow')` or `PixelPets.setEnv(['city','rain'])`; `PixelPets.setEnv(null)` = real data again.
- `PixelPets.refreshEnv()`: only with `?debug=1` (undefined otherwise). Refetches now through the REFRESH path: re-reads the device only if location is allowed and the permission is already granted, else refetches weather for the cached area. Never prompts.
- `PixelPets.spawnWild(sp?, stage?, x?, y?)`: add a creature (default: area-weighted species, near-ish free tile).
- `PixelPets.clearWild()` removes all creatures and pauses auto-spawning; `PixelPets.autoWild()` resumes it.
- `PixelPets.spawnOdds(tags?)`: spawn chances per species for the current (or given) tags.

Sound: tiny chiptune effects synthesized in code with WebAudio (square, triangle and noise; no audio
files) in `sfx.js`: UI tap, feed, play, rest, cooldown/refusal buzz, a quiet footstep every other step,
"noticed" blip when you tap a creature, encounter jingle, befriend fanfare, miss, flee, evolution
build-up + fanfare, level-up and daily-cap chimes, and battle effects (hit, strong/weak hit, stat up/down,
heal, tired, win, move learned). Default volume is low. The AudioContext is only
created on the first tap/key press (iOS and Chrome autoplay rules) and resumed after interruptions;
muted means no audio nodes at all, and browsers without WebAudio just stay silent. Loops play from the same
voices after the first tap: town, route, and battle, plus High Charity, the chapel, and the arcade, the wild
fight cycle, and the two Glimmerwell battle themes. Trial Hall leader fights play `trial`. Rook fights play
`rival`, and that fight does not count as the first Glimmerwell theme. The two Trial Hall rooms play `hall`.
The RegenX floors and the Heights yard play `lab`. Dream rooms play `dream`. A Glimmerwell pledge swaps the
town loop for `town_glimmer`. The quarry and a grove backdrop have their own loops. `harbour`, `route3`, and
`episode_end` are in the catalog for a listening test and play from the debug Music row. An explicit `map.music`
still wins. Music on/off is
`settings.music` (default on) and is separate from the sound-effects mute. The Vol slider beside Music writes
`settings.musicVol` (0 to 1, default 0.5). A volume of 0 is silent and leaves Music on. The iPhone silent switch mutes both.

Font: Jersey 15 by Sarah Cadigan-Fried (SIL Open Font License 1.1), self-hosted as a ~15 KB Latin
subset in `fonts/` with its license (`fonts/OFL.txt`, credits in `fonts/README.md`). `font-display: swap`
with Courier New / monospace as fallback; ★ ♥ and the arrow symbols come from the system font.

Saves (format v2, `save.js`):
- `pixelpets.save.v2` is the save. Walklings live in a **party** (up to 6, the partner is always in it) and a
  **box** (no limit). A 7th befriended Walkling asks which unlocked party Walkling goes to the box. Each row shows that Walkling. The chosen one goes to the box, and the new one joins the party. If every party Walkling is locked, the catch is refused. The WALKLINGS tab
  is six party slots, then the box, then LEFT BEHIND, then the journal (Joined, Met, and Out there 57; unmet forms stay silhouettes).
  The party header reads Party n/6. Each party row and each WALKLING-BOX row shows six tiny bars to the right of the name: HP, NRG, FOOD, JOY, GROW and XP. Each party card also has FEED, PLAY, REST and HEAL for that Walkling, and a small glyph at the top-right of the sprite when that Walkling is hungry, hurt, or tired. Box rows do not. The six bars refresh on the same one-second care tick as the rest of the HUD, and only while WALKLINGS is open. A worn-out row shows RESTING and an empty red HP bar. Tapping the row still opens the Walkling.
  MOVE reorders the party. TO BOX / TO PARTY move one Walkling. RELEASE asks first and will not drop the last Walkling.
  A chipped Walkling stays in the party. TO WALKLING-BOX and RELEASE on that slot are greyed, and the slot says "{name} stays with you now." The same line toasts if a box, release, or later trade still tries, under the collection title. The party slot shows a lock mark beside the name. Locked Walklings are not listed in the box.
  Those labels stay while the WALKLINGS tab is open.
  LEFT BEHIND shows each orphan's reason and the raw data. Hunger pauses in the box.
  A battle SWAP lists the party only. The sheet on a Walkling can use a field snack, rename them, reorder moves,
  hold a Soft Berry, Bracer Band, or Kin Ribbon, pick an adornment you own (Lodge bell, Hall ribbon, Hearth scarf, Orchard sprig, or Amber star), and set a call (Charge, Brace, Dart, or Greet).
  A new save starts with none of those five. The Lodge bell comes when the tour ends, the Hearth scarf from Mom after the first holder match, the Orchard sprig in the orchard, and the Hall ribbon from the first Fernbrook Trial Hall win. That win also puts the line on the win screen. A rematch does not. The Amber star is bought at Stitch & Lantern for 90 Acorns. An older save keeps all five. GEAR lists only the ones you own.
  The five adornment ids stay `bell`, `ribbon`, `scarf`, `leaf`, and `star`. They are drawn on the body so they sit on every Walkling. More adornments unlock from quests later; that list is not built (D75). The partner button is GEAR.
  Walklings name their species by a permanent id (`ember`, `tide`, `bloom`, `stone`, `volt`, `frost`, `gust`,
  `shade`, then `beetle`, `mole`, `crab`, `moth`, `vane`, `dormouse`, then `byte`, then `fetch`, then `skink`, `otter`, `owl`, `snail`); the WALKLING JOURNAL is keyed by form id (`ember/1`).
  The id table (`PPSave.SPECIES_IDS` / `FORM_IDS`, 60 form ids) is append-only: new lines are added at the end
  of `SPECIES` and of the table without a new save version, and a dev check reports any reorder. A v2 Walkling whose
  species id this build does not know stays in the party or the box. Its moves and journal keys stay. The picture is a plain fallback, and the journal names it ???. It is not battle-ready, so it cannot lead and a SWAP skips it. If that pet's id matches another pet, it gets a new id. Every other field stays. The pet is not dropped. Ids stay unique across the party and the box. Save v stays 2. No new top-level key and no new pet field. A row already in `orphans`, and a v1 pet whose index this build cannot read, still stays in `orphans` and comes back to the box only when the species is known.
  Unknown fields are kept on load and save. Save `v` stays 2. B0 adds no field. Effects add the pet field `aura` (one known effect id, dropped when unknown) and `settings.effects` (`full`, `calm`, or `off`). No migrator.
- An old `pixelpets.save.v1` is migrated once, on the first load of this version: every Walkling and its
  cooldown/daily-cap/step fields carry over, away-time decay still applies, the friend code stays the same.
  The v1 key is never changed or deleted (except by Start over), and its raw text is copied once to `pixelpets.save.v1.bak`.
  A v1 Walkling whose species index cannot be read is kept aside in the save's `orphans` list, not dropped. A v2 pet with an unknown species id stays in the party or the box.
- A save that can't be read is copied to `pixelpets.save.corrupt` before anything else happens. A v2 save
  that can't be read falls back to migrating the v1 save again (with a notice). A save from a newer version
  shows "This save is from a newer version of Walklings. Reload to update." and is never overwritten.
- Manual restore of the pre-migration save: in the browser console run
  `localStorage.removeItem('pixelpets.save.v2')` and reload; the game migrates again from the untouched v1
  key (once the v2 key is removed, the open page stops saving so it can't put it back). If the v1 key is gone
  too, first copy the backup back:
  `localStorage.setItem('pixelpets.save.v1', localStorage.getItem('pixelpets.save.v1.bak'))`.

Start over: Settings → Start over (no debug needed) asks
"Start over? Your Walklings will be gone for good." With cloud save on, that line adds "on this device and in your cloud backup", and the hold also erases the cloud copy. SAVE A COPY downloads `walklings-save.json` first (the same
v2 object the game stores; Settings → Save a copy does it any time). Press and hold the red START OVER for 1.5 s (touch, mouse, or
Space/Enter); a bar fills while you hold and letting go early cancels. It removes `pixelpets.save.v2`,
`pixelpets.save.v1`, `pixelpets.save.v1.bak` and `pixelpets.save.corrupt` (so migration can't bring old Walklings
back), then reloads into the new-player path (look picker, then the starter choice). The page stops saving first, and any other open tab stops saving
once it sees the save gone or replaced by a different game (a different `uid`), with a "reset in another tab"
toast, so it can't write the old game back. Per-device keys are kept, never part of the save or the file: `pixelpets.geo`,
`pixelpets.env`, `pixelpets.envOverride` for location, `pixelpets.mute`, `pixelpets.debug`, `pixelpets.fast`.
Start over also clears `pixelpets.cloud` and `pixelpets.cloud.backup`. Save `v` stays 2.
Read a copy (Settings) takes that JSON file back. It must be save `v` 2. The game normalizes it, replaces the
game on this device, and reloads. With no Walklings yet, the gear stays tappable under the opening scene so you
can read the file without finishing the intro. Console: `PixelPets.exportSave()` (the JSON string) and
`PixelPets.importSave(text)` (reads it and reloads).
