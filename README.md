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
Location lookups are other sites, so the worker leaves them alone, and a failed lookup still falls back to meadow.
Progress saves to localStorage (`pixelpets.save.v2`; see Saves below).
Agent skills, including quest authoring and status-doc upkeep, are in `.cursor/skills/`. The index is `.cursor/skills/README.md`.

Touch: bottom tabs (PARTNER / WALK / WALKLINGS / QUEST); FEED / PLAY / REST; Walk = hold D-pad, tap a tile, or drag on the map;
walk into a wild creature (or tap it and your keeper walks over) to meet it. Tap your partner (the follower) for its stats card.
Keyboard (bonus): Arrows/WASD walk, 1-4 tabs. In a battle: 1-5 or F/B/S/R = Fight / Befriend / Swap / Bag / Run,
Space or Enter skips a message, Space = Befriend on the timing bar, Escape = back.
Sound: the settings gear in the header opens Sound on/off (remembered in `pixelpets.mute`), Music on/off (saved with the game), Follower on/off, Change look, Save a copy, Read a copy, Start over, and Debug.

Debug mode: add `?debug=1` to the URL (remembered in `pixelpets.debug`; `?debug=0` turns it off), or open Settings → Debug and enter the password Larson (any capitalization). Either way the tools turn on immediately. A DBG tag shows in the header; tap it to open the debug panel again, including during a battle. Lock debug in that panel to turn it off on this device. Only in debug mode:
- Keys: E = force-evolve current partner, G = force a wild battle (species weighted by the current area),
  H = heal the whole team (clears HP loss and naps), F = toggle fast mode.
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
While you're away (closed app or background tab) the same rates apply with no time cap, but
away-time never pushes a stat below 10.

Care balance: each Walkling has its own cooldown per action (FEED 20 min, PLAY 10 min, REST 15 min),
saved with the Walkling so reloading doesn't reset it. A button on cooldown greys out and shows the time
left; tapping it explains the wait. Gains shrink as the stat fills, band by band: the part of a gain
that lands below 50 counts in full, between 50 and 80 at half, above 80 at a quarter (PLAY +20 joy,
REST +30 energy at full rate). FEED is +40 FOOD with simpler bands: full value below 80 FOOD, a quarter at 80
and above, so FEED from 20 / 50 / 80 ends at 60 / 82.5 / 90 (the Warm Bowl's +15 comes on top).
Daily XP caps (per Walkling, reset at local midnight):
- Care XP (FEED +2, PLAY +5, REST +1): up to 25 a day. After that, actions still restore stats but give no XP.
- Explore XP: up to 30 a day, shared by walking (1 XP per 5 steps; leftover steps carry over, even
  across sessions) and befriending (+5, or whatever still fits under the cap). Befriending a Walkling
  always works, even at the cap; only the XP stops.
- Walking cost: each step costs the partner 0.15 FOOD (`STEP_FOOD` in `game.js`); NRG is not drained by walking
  (`STEP_NRG` = 0), so you can keep exploring even when energy is low. FOOD still drops 15 per 100 steps.
So a Walkling can earn at most 55 XP a day: stage 2 (40 XP) on day 1 and stage 3 (120 XP) around day 3
for a player who maxes both caps, or day 2 and day 5 with care only. The Pet tab shows
"Today: care XP 12/25 · explore XP 8/30"; the Walk tab shows the same explore count as TODAY 8/30.
A counter turns green when maxed.

Levels, types and stats (`stats.js`):
- Two progress tracks per Walkling. **Growth XP** (`xp`, the GROW bar) comes from care and exploring, is
  daily-capped as above and drives evolution (40 / 120, plus care). **Battle XP** (`bx`) comes only from
  battles (wins and befriends), is not capped per day and sets the **Level** shown in the header and on the Pets tab
  (`bx` for level L = 4 x (L-1)^2, Lv 1-50). Care and exploring never change the Level, and battles never
  give growth XP. The level-up chime plays when battle XP raises the Level ("<name> grew to Lv N!").
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
- Stats card: tap STATS (top-left of the Pet tab scene) or the follower. The WALKLINGS tab opens the Walkling sheet instead, and that sheet includes the same stats. It shows the type badge, Level,
  GROW left to the next form, HP now/max with a RESTING, TIRED or GLOWING tag, HP/ATK/DEF/SPD at the Walkling's level with bars
  scaled to the highest value of that stat among all 42 forms at the same level, and one type-chart line
  ("Strong vs X · Weak to Y"). It's an overlay (tabs lock, decay pauses); CLOSE, a
  tap outside it or Escape closes it. Any tab can open it with a Walkling id (`openStatsCard(id)` in `game.js`).

Battles (design spec BATTLE v0.3.1; moves, learnsets, trainers and battle text in `moves.js`):
- Bump into a wild creature (or tap it) and a turn-based battle opens: "A wild X wanders out!", "You're up, <partner>!".
  Your partner leads (or the first party Walkling that can battle). Each turn pick FIGHT (up to 4 moves with limited
  uses; with none left a Walkling uses Wobble), BEFRIEND, SWAP, BAG (any battle item you carry) or RUN. Faster Walklings act
  first; damage uses ATK/DEF, level, type, same-type bonus, mood, stat stages (-2..+2) and rare critical hits.
- Bag (INVENTORY v1): Walk map corner + Pet tab BAG open the Bag overlay; Travel Shelf sells snacks in the Lantern House.
- Items (INVENTORY v1): Heal Snack (+40% HP), Hearty Snack (+75% HP), Wake Tonic (wakes a napping Walkling early at 25% HP),
  Befriend Treat (wild battles, once per battle), Energy Sip (NRG +40) and Joy Crumb (JOY +20). Trainers pay Acorns.
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
  and Walklings that fought share the battle XP. If your whole team is worn out you wake at the last Lantern House,
  still hurt. The way out stays shut until you rest the whole party. A rest there costs 5 Acorns and heals everyone
  (the keeper covers the fee if you are short). A nap in your own bed is still free.
- Trainers summon their creatures ("{trainer} has summoned {foe}!", "{title} {trainer} challenges {player}!",
  "{player} summons {pet}!"; your keeper name, or "Wayfarer"). You can't run from or befriend a trainer's creature.
  Route 1's Pia, Tam and Ollie and Fernbrook's Tobin spot you when you step into their sight line ("!", they walk up,
  then the summon lines); after that only a bump starts a rematch until you win. Master Fen's Trial Hall in Fernbrook
  opens once the orchard is cleared: "Begin trial", and a win earns the Fernbrook Seal (Seal card, 420 Acorns, 2 Heal Snacks).
  Seal #1 opens Route 2 (the creek, Wickerglen, and the Glow Census). Past the quarry gate is Cobblecrest: Dottie's
  stall, the buyout, Rook's second battle, and Master Hale's Stone Hall. Cobblecrest's roofs, windows and
  rooms get their own trim. A loss after you arrive wakes you in the
  Cobblecrest Lantern House.
- The Walkling Journal (PHONE, top-left of the d-pad once the Route 1 officers issue it, then the Journal app, and the WALKLINGS tab) keeps a page for each form you have seen:
  the species line, a short note, and how you met the ones who joined you. A new form's first befriend opens that page.
  After Rook's first battle, one wild Walkling waits in the grass by Hearthmoor's east path.
- Next step (QUEST, `#questBtn` on the bottom bar where Friends used to sit; NEXT_PLAN WP-C): the tab stays on the bar. It opens once you have a Walkling, and the bar locks during scenes, battles,
  and overlays. It pulses until you open it on a new objective (`questSeen`, additive). The panel (NEXT STEP) has one or
  two lines, a place line, the last three done steps, SHOW ON MAP (the region map rings the target's node in red and names
  the place under it) and CLOSE; Esc closes. If nobody on your team can battle it adds "Your team is worn out. Rest the
  whole party at a Lantern House. A rest costs a few Acorns." (the other two stuck lines are kept as data in
  `PPQuests.STUCK`). The objective text and places are the designer's (Build 2), plus later glimmer lines for Heights, the
  Cobblecrest review, and Rook's cart: 26 rows, and 10 of them have a
  Glimmerwell variant (`glimmer: { text, place }` on the entry) that shows while `story.side` is `glimmer`; ids, `when`,
  `done` and targets are shared by both sides. Text is at most 110 characters, places at most 24 (`questCheck` enforces both).
  The QUEST button carries the designer's `icon_quest` (a yellow arrow signpost).
  On the Walk map a yellow arrow bobs above the target tile (a map's top row gets it from below, pointing up); when the
  target is off-screen an arrow sits at the viewport edge; when it is on another map the arrow points at the exit that
  starts the shortest route there (warps and doors). The tip under the d-pad repeats the objective once the first-steps
  tips are done. The chain lives in `quests.js` and is derived from story flags only (nothing to migrate: old saves land
  on the right step; a later flag counts the earlier steps as done). Console: `PixelPets.quest` (read-only),
  `PixelPets.questCheck` (every story flag the data writes is a step or on the not-a-step list; also run at boot).
- Region map (MAP, bottom-right of the d-pad): parchment of the Amberwild. Towns are squares, routes are small circles, side places are teal circles. A blue ring is you, a red ring is the next step, a cyan ring is the side task. Visited ground shows who holds it: green and gold for the Keepers (the same trim as Keeper roofs), cyan and mint for Glimmerwell (the same trim as their ground), split for a shared claim, bare parchment for wild country. Unvisited places stay `???` and do not give the holder away. Hearthmoor, Route 1 and High Charity are Keepers. Fernbrook is shared (the town and the Glimmerwell stand). Route 2 is shared (the Keeper road and the Census). Wickerglen is Glimmerwell. Cobblecrest and the quarry stay Keepers until `story.quarry_bought`, then Glimmerwell. The Heights stay Glimmerwell until `story.sm_done`, then shared. Old Meadow and Mahopac are wild. High Charity is the lantern coach, drawn as a green dashed line, and it no longer sits on Mahopac. A gold stamp marks Fernbrook and Cobblecrest once that Seal is earned. Tap a place to read it (the card names the room when you are indoors). Arrows move that reading and do not walk you. CLOSE, Escape, or the dark margin puts the map away. After the pledge, the map says which side you are on. The key under the parchment names every mark. Console: `PixelPets.mapHold(id)` and `PixelPets.mapCheck()` (also at boot). High Charity's roofs wear Keeper gold and green.
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
  lantern stand, crate Comfort Check, Hall slideshow, optional Fen match). The Hall panel still reads `panel` off the
  side-merged `hall1_fen`. Keepers still battle Fen for the Fernbrook Seal. The glimmer win or the skip stores
  `seals.seal_glim_1` ("Bright Tier 1 Lanyard", delivered art) and runs `seal1@glimmer`. A loss wakes you at the Lantern
  House and the tour resumes at stop 4. "Think about it" sets nothing; stepping off the gate toasts one walk-away line
  and the pick re-arms. All of it lives in `data/glimmer_path.json` (ours, not a design copy; registered in
  `tools/gen_mapdata.py` and merged last). Console: `PixelPets.side`, `sceneFor(id)`, `trainerFor(id)`, `glimmerCheck`
  (line length after tokens, choice labels ≤ 30, ambient lines ≤ 40, double spaces, unknown tokens, every variant has a
  base and sets the base's story flags; also run at boot), and with debug `setSide('glimmer' | 'keepers')`.
  The first-wild step follows the live guide creature.
- Keeper House and the phone: Hearthmoor roofs wear gold and green. Glimmerwell ground (the glen, and Cobblecrest after the buyout) wears mint. Officer Bren patrols the Hearthmoor road out to the east gate. Officer Cald stands just north of that gate. The tree that closed the grass there is cut, and the town sign stands south of the path. Fernbrook, Route 2, the glen, and Cobblecrest each have a watch officer. Clerk Mint appears in Cobblecrest after the quarry buyout. The Keeper House south of that road has two floors: Sergeant Bram, Archivist Mo, and Clerk Wynn downstairs; Captain Lumen and Operator Rue upstairs. Before you pledge, they treat you as a citizen. Keepers hear warmer lines as Standing rises. A Glimmerwell pledge gets a cold door. The first side quest is on Route 1: two officers stop you and issue a Keeper1. PHONE (top-left) opens Contacts, Notes, Journal, Friends, KeeperUAV, Ribbit, and BOARD. BOARD is the town post: the masthead, the slogan, the reports that match so far, then the empty slip and bounty lines. In a town it is that town. Indoors it is the outdoor town. On a road it is the last town, and a line says you are between towns. Hearthmoor and Fernbrook stay the Lantern Post even on a glimmer pledge. Cobblecrest becomes Bright Notice after the quarry buyout. Mahopac's board has no masthead. The phone button stays hidden until Keeper1 is issued. The wooden post still opens on foot. Hearthmoor's street widens into a crossing in front of the Keeper House. Fernbrook grows a forecourt north of the path, with a crooked Comfort flyer beside the board. Notes say the Lantern desk can read them. Joining Glimmerwell also puts a Cracked Handset in the bag. While you are Glimmerwell and carrying it, the phone shell becomes the thin CRACK//HAND, and KeeperUAV is replaced by Botnet (placeholder jobs and parts). A blue chevron marks the side quest. The main quest chevron stays yellow. Higher Glimmerwell Standing tints your keeper with mint, then silver. Archivist Mo's books fear a child born already listening. That generation is not in the game. The phone has Ribbit, a read-only feed. Block News and Chirp Worldwide post about the towns. Local notes and the trending tags follow the day, the place you are standing, and the story. You cannot post.
- Fernbrook Heights (before the first trial): once you pick a side, Fen or Juniper offers "get to know us" and sends you north.
  Keepers investigate a smuggling tunnel. After the haulers step aside, Officer Ken of the Fernbrook watch interviews each Walkling with you, then walks them toward the orchard. Glimmerwell enters the RegenX lab,
  four floors, to copy Atten (a focus aid) and its brewing plans. RegenX does not know the vials sit near The Arbiter,
  ancient Glimmerwell technology. It emits something slowly. Nobody can name the emission, or why the machine was built.
  Each Heights beat adds Standing for the side you are on. The trial and the
  Tour's first stop wait until `story.heights_done`. A save that already has Seal 1 is not sent back.
  Some fights are group battles: two foes at once, TARGET to choose, and on the last fight an ally Walkling steps in.
  Stock up at the Heights crate. Key items (Atten Vial, Atten Plans, Route Page) stay in the bag.
- Glimmerwell after Fernbrook (Builds 4–6, still in `data/glimmer_path.json`): Route 2 logs you as a Glow Census
  volunteer. The quiet log gives Rook one `story.rook_bond`. Wickerglen still bumps the lamps and pays 3 Befriend Treats.
  Cobblecrest puts you beside Dorian; Hale loses the quarry; Rook objects to the word "units". Hall slot 2 is a Sacrifice
  stub: offer a snack (it stays in the bag), meet a free quota of three spoken names, or battle Hale. Any close grants
  the Bright Tier 2 Lanyard (`seals.seal_glim_2`, `LANYARD_TIER2`: gold rim, mint field, two white marks), 2 Hearty Snacks and 1 Wake Tonic, and sets
  `story.seal2`. The player look picker still has no lanyard. On the Brinewick cart, Keepers Rook gets off (`story.rook_end` `"ally"`) and Glimmerwell Rook stays
  (`"stays"`). Both paths set `story.cobble_end` and show the same coming-later card. After that flag, a Keepers save is called to the Lantern Council in Sky-Dock Command (`hc_council`). A Glimmerwell pledge does not see it. The quest row covers that pointer until `story.hc_council_done`. Brinewick stays closed. Keepers Route 2 and the Hale trial
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
  Builds 4–6 (`glen_g`, `quarry_g`, `seal2_g` on glimmer, `r5_k` on keepers, `r5_g` on glimmer, 5 each, once), and the Lantern Council (`hc_council_k`, +10 keepers, once). `cond()` accepts
  `standing.keepers>=2` / `standing.glimmer>=2` (the tier, not points) for later lines and options. Reaching a new tier shows
  that tier's toast once (`standing.top.<side>`). Daily earning (care for the Keepers, output for Glimmerwell) is not built:
  the spec has no numbers yet.
  **Switching** happens at a Pledge desk: an extra option on Keeper Amos's Lantern House panel in Fernbrook (to the
  Keepers) and on Associate Juniper's line at the Fernbrook stand (to Glimmerwell), only after `story.side_pick_done`, never
  mid-scene or mid-battle, and only where it would be a change. A reference letter from the side you join reads first, then
  "Really? Keepers Standing 30 → 15" with Yes / Think about it; Yes halves the side you leave (floor), keeps the side you
  join, rewrites `story.side`, counts `story.switches`, records `story.switch_chapter` and `story.switch_at`, and plays a
  short "performance review" line from the side you left (the letter and review lines are placeholders awaiting copy).
  Cooldown: one switch per chapter, where a chapter is the number of Seals earned (`chapterOf()` in `standing.js`; the
  spec does not define "chapter", see OPEN_DECISIONS). Switching never touches progression flags, Seals or lanyards,
  `story.rook_bond`, the current objective, or `story.beat.*`; unplayed scenes simply resolve to the new side's variant.
  The quest overlay gains a read-only **STANDING** tab once the pick is made: a row per side with the emblem, tier name,
  blurb, a bar to the next tier and a PLEDGED marker, plus "Pledged to {faction}" and the explainer. Console:
  `PixelPets.standing` (`{keepers: {points, tier, name}, glimmer: {...}, side, switches, chapter, canSwitch}`),
  `standingCfg()`, `standingCheck()`; with debug `setStanding(side, n)`, `switchSide(to, free)`, `pledgeDesk(to)`.
  The designer's `switch_desk_glimmer` kiosk art is in the world-art table but not placed on any map yet.
- Moves are learned on level-up (prompts after the battle; with 4 moves you pick one to forget, or don't learn) and on
  growing up (each line's grow-up move, then any level moves of the new form). Older saves get missed grow-up
  moves on their next visit ("<name> remembers something from growing up!").

Keeper and follower (MAPS_SLICE Phase K): you walk the map as a keeper, a 16x16 person drawn in 3 layers (body,
outfit, hair; art in `keeper.js`, copied from Design's `keeper_art.js`) with 4 facings (left mirrors right) and 2
walk frames. Six skin tones are new `PAL` keys `1`-`6` (nothing else in `PAL` changed). Your look is
`player.look = {skin, hair, hairCol, outfit, outfitCol, accent}` and your name is `player.name` (both in the v2 save,
no version bump; `normalizeLook()` fixes old or bad looks on load, e.g. the v0.4 draft's `{hair, skin, coat, scarf}`).
- Look picker (`#ovLook`): a big animated preview, NAME, then SKIN (6), HAIR STYLE (short, long, spiky, bun, bob, pony, curls, buzz),
  HAIR COLOUR (14), OUTFIT (coat, hoodie, tunic, vest, sweater, dress), OUTFIT COLOUR (7), ACCENT (7), and ACCESSORY (none, glasses, bow, cap, scarf), plus SHUFFLE. There is no lanyard. A new player sees
  it first ("WHO ARE YOU?", no CANCEL), then the starter picker; nothing is saved until DONE. Later, Change look in
  Settings (the header gear) opens it with CANCEL. Names: trimmed, spaces collapsed, `< > { }` and control characters dropped,
  10 characters max, empty = "Wayfarer". Friends live in the phone (FRIENDS app) and show "KEEPER  name" above the friend code. The Pet scene shows a small "KEEPER  name"
  label in its top-right corner ("Wayfarer" until named).
- With no Walkling yet the keeper still walks (no energy, food or XP, no wild creatures).
- Follower: your partner walks one tile behind you on the Walk map, taking the tile you just left (it never
  blocks you, wild creatures or spawns), bobs as it goes (half speed and 1px lower while worn out, the 20-minute RESTING nap after a battle), swaps when you
  pick a new partner and changes when it grows up. On load it stands behind you, or under you if that tile is
  solid. Tap it to open its stats card (a wild creature on the same tile wins the tap). Follower on/off in
  Settings turns it off (`settings.follower`, default on).

Pet tab scene: drawn from the current map's `backdrop` (town, route, meadow or grove; `MAP_INFO` in `game.js`,
missing or unknown = meadow) with the same time of day and weather as Walk: night
sky with moon and stars plus Walk's night tint, a dull sky in rain/storm/snow/fog, and the same rain, storm
flashes, snow and fog, a little lighter on the small canvas.

Fast mode (debug mode only): the old demo pacing (full to starving in about 17 minutes) for testing.
Turn it on with `?debug=1&fast=1` in the URL (`?fast=0` turns it off), the F key, or
`PixelPets.setFast(true)` / `PixelPets.setFast(false)` in the console. The choice is remembered in
localStorage key `pixelpets.fast` (separate from the save). While it's on, a small FAST tag shows
next to the Walkling's name in the header, and a toast appears on toggle and on load.
Fast mode also shrinks care cooldowns by the same ratio (~1/57: FEED ~21s, PLAY ~10s, REST ~16s);
the daily XP caps are not scaled (use `PixelPets.resetDailyCaps()`).

Wild creatures: there are no hidden tall-grass rolls any more. 3-4 wild Walklings wander the Walk map
(on grass, shore or woods tiles, blocked by trees/water, never on the path). They bob and blink,
leave after ~2.5-4.5 minutes of Walk time (or sooner when far off-screen) and new ones pop in.
Bump into one, or tap it so your Walkling walks next to it, to start a battle with exactly that
species and form (see Battles above). Second forms are rare (5%, they twinkle). RUN leaves the creature where it
is (it shies away for a moment); befriending it, beating it or letting it flee removes it. If no Walkling can battle
it shies away too, with "Your team needs a rest first!".

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

Creatures: 14 lines of 3 forms (42 WALKLING JOURNAL entries), all befriendable and all growing up the same way
(growth XP 40 / 120 plus care, then GROW UP). The six newer lines (design spec CREATURES_SLICE):
Pomlet → Pomshell → Orchardon (BLOOM beetle), Loamlet → Burrowbloom → Hedgewarden (BLOOM mole),
Clinkit → Shardpincer → Mosaicrab (TIDE crab), Fuzzwick → Filamoth → Halowatt (VOLT moth),
Vanelet → Vanefledge → Squallvane (GUST, weather form) and Dozmouse → Lullamouse → Moondozer (SHADE dormouse).
Unseen Vanelet-line entries in the Journal show a small cloud ("check back in bad weather").
Nicknames: after a befriend the result card asks "Give it a name?" (optional, up to 10 characters: letters,
digits, spaces and ' . ! ? -). Leave it empty to keep the species name. A nickname shows in the header and on
the Pets tab (with the species name underneath) and is saved in the Walkling's `nick`.

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
build-up + fanfare, level-up and daily-cap chimes, and battle effects (hit, strong/weak hit, stat up/down,
heal, tired, win, move learned). Default volume is low. The AudioContext is only
created on the first tap/key press (iOS and Chrome autoplay rules) and resumed after interruptions;
muted means no audio nodes at all, and browsers without WebAudio just stay silent. Loops play from the same
voices after the first tap: town, route, and battle, plus High Charity, the chapel, and the arcade, the wild
fight cycle, and the two Glimmerwell battle themes. A Glimmerwell pledge swaps the town loop for `town_glimmer`.
The quarry and a grove backdrop have their own loops. An explicit `map.music` still wins. Music on/off is
`settings.music` (default on) and is separate from the sound-effects mute. The iPhone silent switch mutes both.

Font: Jersey 15 by Sarah Cadigan-Fried (SIL Open Font License 1.1), self-hosted as a ~15 KB Latin
subset in `fonts/` with its license (`fonts/OFL.txt`, credits in `fonts/README.md`). `font-display: swap`
with Courier New / monospace as fallback; ★ ♥ and the arrow symbols come from the system font.

Saves (format v2, `save.js`):
- `pixelpets.save.v2` is the save. Walklings live in a **party** (up to 6, the partner is always in it) and a
  **box** (no limit). A 7th befriended Walkling goes to the box ("<name> was sent to your box."). The WALKLINGS tab
  is six party slots, then the box, then LEFT BEHIND, then the journal (Joined, Met, and Out there 42; unmet forms stay silhouettes).
  MOVE reorders the party. TO BOX / TO PARTY move one Walkling. RELEASE asks first and will not drop the last Walkling.
  LEFT BEHIND shows each orphan's reason and the raw data. Hunger pauses in the box.
  A battle SWAP lists the party only. The sheet on a Walkling can use a field snack, rename them, reorder moves,
  hold a Soft Berry, Bracer Band, or Kin Ribbon, pick an accessory, and set a call (Charge, Brace, Dart, or Greet).
  Walklings name their species by a permanent id (`ember`, `tide`, `bloom`, `stone`, `volt`, `frost`, `gust`,
  `shade`, then `beetle`, `mole`, `crab`, `moth`, `vane`, `dormouse`); the WALKLING JOURNAL is keyed by form id (`ember/1`).
  The id table (`PPSave.SPECIES_IDS` / `FORM_IDS`, 42 form ids) is append-only: new lines are added at the end
  of `SPECIES` and of the table without a new save version, and a dev check reports any reorder. A Walkling whose
  species an older build didn't know sits in `orphans` there and comes back to the box once the species exists.
  Unknown fields are kept on load and save.
- An old `pixelpets.save.v1` is migrated once, on the first load of this version: every Walkling and its
  cooldown/daily-cap/step fields carry over, away-time decay still applies, the friend code stays the same.
  The v1 key is never changed or deleted (except by Start over), and its raw text is copied once to `pixelpets.save.v1.bak`.
  Walklings that can't be read (unknown species) are kept aside in the save's `orphans` list, not dropped.
- A save that can't be read is copied to `pixelpets.save.corrupt` before anything else happens. A v2 save
  that can't be read falls back to migrating the v1 save again (with a notice). A save from a newer version
  shows "This save is from a newer version of Walklings. Reload to update." and is never overwritten.
- Manual restore of the pre-migration save: in the browser console run
  `localStorage.removeItem('pixelpets.save.v2')` and reload; the game migrates again from the untouched v1
  key (once the v2 key is removed, the open page stops saving so it can't put it back). If the v1 key is gone
  too, first copy the backup back:
  `localStorage.setItem('pixelpets.save.v1', localStorage.getItem('pixelpets.save.v1.bak'))`.

Start over: Settings → Start over (no debug needed) asks
"Start over? Your Walklings will be gone for good." SAVE A COPY downloads `walklings-save.json` first (the same
v2 object the game stores; Settings → Save a copy does it any time). Press and hold the red START OVER for 1.5 s (touch, mouse, or
Space/Enter); a bar fills while you hold and letting go early cancels. It removes `pixelpets.save.v2`,
`pixelpets.save.v1`, `pixelpets.save.v1.bak` and `pixelpets.save.corrupt` (so migration can't bring old Walklings
back), then reloads into the new-player path (look picker, then the starter choice). The page stops saving first, and any other open tab stops saving
once it sees the save gone or replaced by a different game (a different `uid`), with a "reset in another tab"
toast, so it can't write the old game back. Per-device keys are kept, never part of the save or the file: `pixelpets.geo`,
`pixelpets.env`, `pixelpets.envOverride` for location, `pixelpets.mute`, `pixelpets.debug`, `pixelpets.fast`.
Read a copy (Settings) takes that JSON file back. It must be save `v` 2. The game normalizes it, replaces the
game on this device, and reloads. With no Walklings yet, the gear stays tappable under the opening scene so you
can read the file without finishing the intro. Console: `PixelPets.exportSave()` (the JSON string) and
`PixelPets.importSave(text)` (reads it and reloads).
