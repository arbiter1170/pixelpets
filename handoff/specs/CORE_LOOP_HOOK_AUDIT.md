# CORE_LOOP_HOOK_AUDIT: what the core loop needs so it hooks players

Target path: `handoff/specs/CORE_LOOP_HOOK_AUDIT.md` (PUBLIC repo; not `docs/`). **Audit only, no code.** Nothing here is built and nothing builds from this file; each recommendation needs its own clearance (Morgan), and every red row needs Vincent. All player text quoted as a suggestion is PLACEHOLDER for June.

## 0. TL;DR

- **The opening is good. Leave it.** Partner day, the mirror, Ilse, the basket pick, Rook's counter-pick and the walk to the Lantern House lead to the first befriend and the NEW JOURNAL ENTRY card at **~6 minutes**: a real "one more" moment.
- **The loop is strong at the ends and thin in the middle.** Story, set pieces, the befriend bar and growing up at Lv 12 pull hard. Between Route 1 and the Hall the holder meets the same seven species (Fernbrook repeats 6 of Route 1's 8 rows), and the 5% rare form isn't signalled.
- **Trial 1 now lands at ~30-40 minutes** on live 2259 (#261): ~11 min to Fen, ~16 min of Day 1, home trip and class (mostly reading, ~110 boxes), ~3 levels to gain, and a real four-match Hall. Most first sessions will stop in Day 1 or the home trip. That's fine if the next session has a reason to start.
- **Retention is built but hidden.** Daily needs, the Warm Bowl, the hello, walk finds, three NEWS editions a day and the clock all exist. But a returning holder lands on WALK, the hello fires only on PARTNER, there are no daily goals, the board has one slip and no bounties, and Bond pays nothing.
- **The Seal is the biggest untapped hook.** Vincent settled the Seals canon last night (a Seal is a key to a Hall Stone room, written on the Seal roll, threatened in the crackdown). On screen today the Seal is a badge and a silent cap raise.
- **Two difficulty spikes, one cheap fix:** EMBER holders hit a wall at Tam (2× TIDE), and TIDE holders at the BLOOM Hall. The counters live on Route 1, but nothing says so (R9).
- **Three quick wins this week (S, no red):** R1 a return card on WALK, R2 "today" ticks on TODAY, R3 a sparkle on rare wilds. Plus two green cue fixes: the Hall arrow points at the exit; the unlock tip opens mid-battle.

## 1. Method, build and sources

| Item | Value |
|---|---|
| Live builds played | **20261102-2259** (`version.json` on https://arbiter1170.github.io/pixelpets/, Tue Nov 3, 2026): #258 partner day plus #261/#265 Day 1 to Trial 1. This is the main run. The opening was also played on **20261102-2141** (before #261) for comparison; it differs only by the mirror-arrow fix. Main is `37802ab`. |
| Not on live | #262 (ranks, place-chip control) merged after the play (`dd6d78b`), so its rank-first names and the hold stripe on the place chip were not seen; POST_TRIAL_CRACKDOWN (now v0.3.1 on main, aligned with the Seals canon) and TRIAL_HALL_FERNBROOK_MAP, both specs only; the LANTERN_HOUSE_FERNBROOK spec (LH-1 to LH-5). The `post_trial` slot is a placeholder Fen line today. |
| How it was played | A Playwright script at **390×844**, touch on, fresh `localStorage`, **arcade** controls (so TALK is a button), `?debug=1` used only to **read** state (`PixelPets.scene`, `.quest`, `.battle`, `.lesson`, `.findPath`). It moved with real arrow-key steps (the game's 170 ms step) and tapped real buttons. No `goto`, `winBattle` or flag writes. **One exception:** the Trial Hall was reached with the game's own `hall1_holders` debug checkpoint on the real save (party and levels kept), skipping Day 1, the home trip and the class, which are estimated from data in §2.4. When the script got stuck it was fixed and resumed from the save it wrote at the last quest change (a page reload; the resume time isn't counted). Firebase traffic was blocked: no sign-in, no cloud writes (rule 7). Zero console errors in every run. |
| Battle and befriend policy | Pick the strongest move after the shown type hint; swap once if the best move is resisted; befriend any species not yet in the party (tap when the marker is inside the zone); on Route 1 and in Fernbrook, meet up to 5 visible wilds before following the cue (a casual holder's habit; the first 2141 run went straight down the road). Unlock tips: SKIP. Picks: ARCADE, "Looks good!", Ilse's pick (Pipkit, EMBER), first choice elsewhere. |
| Human time | Script time advances each text box the moment it finishes typing. **Human time = script time + reading time** at 15 characters a second (a steady adult reader; a child or a skimmer will differ) + 0.3 s per tap. Both columns are in §2. |
| Code read | `quests.js` CHAIN, `game.js` (by `tools/GAMEJS_MAP.txt` ranges), `stats.js`, `moves.js`, `minigames.js`, `net.js`, `clock.js`, `news.js`, `data/town_board.json`, `data/highcharity.json`. `file:N` cites origin/main `37802ab`. |
| Docs read | `AGENTS.md`, `CLAUDE.md`, `roles/morgan-hale.md`, design `STORY.md` v0.7.10 (§2 incl. "What Seals are", §3, §8, §9, §11) and `specs/STORY_DECISIONS.md` v0.65, `handoff/specs/DAY1_TRIAL1_FLOW.md`, `POST_TRIAL_CRACKDOWN.md`, `TRIAL_HALL_FERNBROOK_MAP.md`, CHANGELOG Oct 26 to Nov 3, #258 / #261 / #262 bodies, OPEN_DECISIONS open rows. |
| Skills | `gamedev-rpg-systems`, `gamedev-game-feel`, `gamedev-game-ui-ux`, `walklings-quests`, `walklings-decision`, `walklings-decision-ids`, `walklings-wording-check`, `walklings-pr-handback`. |

## 1a. The core loop as it plays

```
            ┌──────────────── story (Rook, Fen, the factions, the Seal) ─────────────────┐
            │  STRONG                                                                     ▼
 walk ──► find ──► befriend ──► care ──► battle ──► level ──► Trial Hall ──► Seal ──► next town
 STRONG   THIN     STRONG       HALF     OK         OK/THIN   OK             THIN      (Route 2)
   ▲                                                                                    │
   └──────────── daily return: hello · Warm Bowl · finds · NEWS (BUILT but HIDDEN) ◄────┘
                 town-board slips / bounties (MISSING) · Bond payoff (MISSING)
```

| Link | Mark | Why |
|---|---|---|
| Walk | **Strong** | Short, readable maps; the cue is always on; steps feed XP, Bond and finds. Walking is cheap: Route 1 end to end is ~74 steps, about 13 s. |
| Find | **Thin** | Wilds are visible and met by bumping (no random grass rolls), which is good on a phone. But Route 1 and Fernbrook share 6 of 8 species, and the rare 5% grown-up form isn't signalled (§5). |
| Befriend | **Strong** | The timing bar plus the NEW JOURNAL ENTRY card is the best beat in the loop. The first one lands ~6 min in. |
| Care | **Half** | The needs, the floors and the tray all work; the Warm Bowl and the hello reward a daily visit. But Bond pays nothing, and the return isn't surfaced (§3). |
| Battle | **OK** | Type counters matter and are taught (Rook's counter-pick, the counter guide wild). Matches run long on a phone: 40-55 s for a two-Walkling holder at normal text speed (tapping skips text). No status effects (leave it, R10). |
| Level | **OK / thin** | The curve is fast early (§4). The Lv 12 "Growing up" moment is a big payoff, landing at the first Hall holder. Between Fernbrook and the Hall the XP comes only from the same seven species. |
| Trial Hall | **OK** | With #261, three holders (Lv 10-12, two Walklings each) then Fen (12/13/14). A real gauntlet: the script's Lv ~10 team lost the first holder 3 times before winning at Lv ~11.6. |
| Seal | **Thin** | It gives a real cap raise and three unlocks, but says almost none of it. The settled Seals canon (a key, the roll, the crackdown) isn't on screen yet (§6, R5). |
| Story | **Strong** | Ilse's warning, Rook's secret, Fen's worry, Day 1's Two Lights, Lizzy's class, the contested town. Story is what pulls a player from beat to beat. |

## 2. First session: the first 5, 15 and 30 minutes

### 2.1 Measured stretches (live, 390 px)

"Script s" is what the script took. "Est. human" adds reading (15 characters a second) and taps (§1). Battle times are at normal text speed with no text taps, so they're an upper bound. Builds: rows 1-8 are 20261102-2259 (2141 gave the same opening within 10 s). Rows 9-11 continue on 2259 from that save. Row 12 is the Hall, reached from the real save with the game's own `hall1_holders` checkpoint (Day 1, the home trip and the class skipped; their cost is estimated in §2.4).

| # | Stretch (main step) | Script s | Boxes | Chars | Battles | Est. human | Cum. (min) | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | `wake` (Lizzy and Buddy burst in) | 3 | 10 | 494 | 0 | 0:39 | 0.7 | Controls pick inside the scene. |
| 2 | `dress` (mirror, first look) | 34 | 3 | 140 | 0 | 0:44 | 1.4 | Script time includes the look picker. |
| 3 | `wake` (Mom and Maze) | 5 | 7 | 445 | 0 | 0:37 | 2.0 | |
| 4 | `lodge` (Ilse, the basket pick, naming) | 17 | 29 | 1,704 | 0 | 2:20 | 4.3 | **The longest text stretch**: 29 boxes. Both lore hints sit near its end. |
| 5 | `rival1` (Rook at the gate) | 22 | 3 | 183 | 1 (lost) | 0:35 | 4.9 | Counter-pick: TIDE Lv 5 against EMBER Lv 5. Battle tips F1-M7 show once. |
| 6 | `first_wild` (walk to the Lantern House with Rook, Della, then the guide wild) | 18 | 10 | 635 | 1 | 1:04 | 6.0 | **First "one more" moment**: Drizzlet befriended, NEW JOURNAL ENTRY, "Your first wild page." |
| 7 | `route1` | 4 | 0 | 0 | 0 | 0:04 | 6.0 | |
| 8 | `fernbrook` (Route 1, with 5 wilds met on the way) | 146 | 8 | 380 | 7 (3 W, 4 befriended) | 2:54 | 8.9 | Route 1 holders Pia (GUST) and Tam (2× TIDE). A Shardpincer (5% grown-up) befriended, with no signal. "Your phone" tip. |
| 9 | `glimmer` (Fernbrook square) | 118 | 3 | 169 | 6 (5 W, 1 L) | 2:10 | 11.1 | |
| 10 | `fen` | 1 | 2 | 155 | 0 | 0:12 | 11.3 | |
| 11 | `crates` (Day 1 opens; Fernbrook wilds) | 254 | 6 | 300 | 6 (5 W, 1 L) | 4:36 | 15.9 | Fernbrook wilds took 29 s on average. |
| 12 | `hall1_holders`, first holder (Linden, Lv 11/12) | 231 | n/a | n/a | 4 (3 L, 1 W) | ~4:00 | n/a | Lv ~10 → ~11.6 by the win; "Growing up" (Lv 12) fires right after. |

Holder matches averaged **47.5 s** in the Hall and **40 s** on Route 1; Route 1 wilds **12.5 s**, Fernbrook wilds **28.6 s**. Acorns at Fen: **177** (three holder wins plus the wild cap). Partner level at Fen: **~9.6** (battle XP 296).

### 2.2 The first 5, 15 and 30 minutes

- **0-5 minutes: strong, but text-heavy.** About 55 boxes and ~2,950 characters before the starter is in hand: the house morning (good, playful, short boxes) and Ilse's 29 boxes. It reads well, but it's the one place a phone player taps blind. **First tap of agency**: the mirror (~1 min). **First Walkling**: ~4.3 min.
- **5-15 minutes: the hook lands.** Rook's counter-pick loss, the walk to the Lantern House (a smart way to teach healing), and then **the first befriend at ~6 min, which is the first "one more" moment.** Route 1 then gives quick befriends (8-13 s each) and the first holder wins with Acorns. **Quit risk at ~9 min: Tam.** On build 2141, with an EMBER lead and only the Lv 3 guide Drizzlet, the script lost to Tam's two TIDE crabs 11 times in a row (13 in all), and a loss walks you back to Hearthmoor. On 2259, after befriending two BLOOM Walklings on Route 1, it cleared Route 1's holders with one loss. The answer is on Route 1, but nothing says so (R9).
- **15-30 minutes: Day 1, the home trip, and the gap to the Hall.** On live, Day 1 starts at ~16 min. Before the Hall, the holder now reads Day 1, Fen's go-home talk, Mom's trip and Lizzy's class (§2.4), and needs about 3 more levels for Fen (12/13/14). **Most holders will not reach Trial 1 in a 30-minute first session**; they'll stop somewhere in Day 1 or the home trip. That's fine *if* the stop point is a cliffhanger (Fen's "go home for now" is a good one) and *if* the next session has a reason to start (R1, R2).
- **Long text:** Ilse (29 boxes), Mahopac (up to 58 boxes, ~3,300 characters) and Day 1's Two Lights choice scene (10 boxes, ~800 characters).
- **Repeated tutorials:** none seen on 2259. The battle tips show once (#258/#249 fixed the repeats). **Tips over battles:** the "Your Party: SHOW ME / SKIP" unlock card opened **inside a wild battle**, covering the battle buttons, right after the second befriend (seen on 2259; screenshot kept with the run). It should wait for the battle to end (small fix, green).

### 2.3 Cues seen during the play

| What | Build | Status |
|---|---|---|
| After the mirror, the `wake` cue stayed on the mirror | 2141 | **Fixed in 2259** (#261/#265). |
| Inside the Trial Hall, the `hall1_holders` cue points at the **exit door**: its target is the Hall door on the Fernbrook map (`quests.js` `hall1_holders`, fernbrook 22,6), so `pointOnMap` sends you back out (`routeExit`, `game.js:7638`). The bot followed it out twice. | 2259 | **Open, small fix (green):** give the step `npc`/`npcIds` for the three holders (#261's `npcSpot` already supports this), or an in-Hall target. |
| `crates`: the cue sits on Tobin, but the task is to tap three crates around him; Tobin's line says "Tap a crate." | 2259 | Minor. A human reads it; a skimmer may tap Tobin twice. Optional: cue the nearest untapped crate. |
| Care walk versus `first_wild`: on a resumed save standing near the guide wild, the care lesson said "Stand still, then tap Pipkit" while the cue pointed at the wild, which was moving away | 2141 | Seen once; QA to check on a phone. |

### 2.4 What #261's middle adds before the Hall (estimate from its data)

Counted from `data/detail_zz_day1.json` and `data/mahopac.json`, at the §1 reading rate, plus walking at 170 ms a step:

| Piece | Boxes | Chars | Est. time |
|---|---|---|---|
| Day 1: three crates, Fen with Russet, Two Lights (Amos, the cot, Juniper, the choice), Fen at dusk | 37 | ~2,800 | ~4-5 min (with the wick errand) |
| Fen's go-home talk | 7 | ~610 | ~0:45 |
| Walk Fernbrook → home | 0 | 0 | ~0:15-0:30 (≈ 80 steps, plus any Route 1 holder you haven't beaten) |
| Mom's trip to Mahopac (if not done) | up to 58 | ~3,300 | ~5-6 min |
| Mom's ask and Lizzy's class | 10 | ~850 | ~1:15 |
| Walk back to Fernbrook | 0 | 0 | ~0:30 |
| Three Hall holders and Fen (no losses) | n/a | n/a | ~3:30 (3 × ~47 s + ~75 s) |
| **Total, Fen's first talk → Seal** | **~110** | **~7,500** | **~16 min without losses or grinding** |

With the ~3 levels needed for Fen and a loss or two, **Seal 1 lands around 30-40 minutes** for a new holder: a full first session and part of a second. The walking is cheap (rides are not needed). The reading is the cost: Mahopac and Day 1 together are about 95 boxes. June's trim pass on Ilse and Mahopac would buy back several minutes.

## 3. Retention across days

What brings a holder back tomorrow and next week. Ratings: **BUILT** (works and is visible), **HALF** (exists but hidden, thin or gated), **MISSING**.

| Hook | Rating | What exists today (evidence) | What it lacks as a pull |
|---|---|---|---|
| Daily care and needs | **BUILT** | FOOD 3/h, JOY ~5/h (doubles when FOOD < 25), NRG ~4.2/h; floors at 20/20/10 while away, nothing dies or leaves (`game.js:45-55`, `18752-18762`). Low needs cost 10% ATK/SPD/DEF in battle (`stats.js:117-120`). FEED/PLAY/REST on cooldowns (`game.js:100-101`). | The kind floors are right for a phone game. What's missing is a reason to look: needs only matter in battle, and the balloon only shows on WALK when one is low. |
| Warm Bowl, hello, walk finds | **HALF** | First FEED of the day gives +15 FOOD +5 JOY (`BOWL`, `game.js:59`). A daily hello gives +1 bond (`pumpHello`, `game.js:2069`). Walk finds at 60 and 140 steps a day give 10-25 Acorns or an item (`FINDS`, `game.js:6129`). The welcome-back line comes after 14 h away (`game.js:2083-2097`). | **The hello only fires on PARTNER** (`screen !== 'pet'` returns, `game.js:2071`), but every boot lands on WALK (`game.js:1489`). The welcome-back fires on a visibility return, not on a cold boot. So a returning holder often sees none of it, and nothing lists what's waiting today. |
| Bond with the partner | **HALF** | Five levels at 0/20/60/120/200 points. Sources: hello 1, pat 1 (5/day), finds 2, steps 3/day, wins 1 (3/day), side scenes +2 (`BOND`, `game.js:3336`). About 12-16 points on a full day, so Bond 5 takes about two weeks. | **Bond unlocks almost nothing**: a stretch idle at Bond 3 and the heart row (`game.js:3792`, `3810`). It's the slowest-burning, most personal meter in the game, and it pays nothing. |
| Town board and bounties | **HALF / MISSING** | Six town boards with TEMP report lines; one slip (Cald's "Gate count", reward bond +2; `data/civic.json:474`). The code passes `bounties: []` and says "no bounty logic now" (`game.js:13413`, `15525`). Q19 town boards are **on hold (Vincent)**. | No repeatable or daily task anywhere on the main loop. |
| Collection (the Journal) | **HALF** | 25 species × 3 stages; the Journal counts "Joined · Met · Out there" (`game.js:17425`). Each first befriend shows a NEW JOURNAL ENTRY card naming where you met it. Storm/snow-only Vanelet shows a cloud on its ??? cell (`game.js:17407`). TODAY lists likely species for the place (`#envCardLikely`). | No per-area tally, no completion reward, no rare signal in the field (§5). |
| Outfits and looks | **BUILT** | 12 outfits, 8 hair, 6 skin, 14 hair colours, 11 outfit colours, 10 accessories, free at the mirror (`keeper.js:1726-1750`). Wardrobe at Stitch & Lantern: 7 pet adornments 90-220, 4 holder accessories 150-300, 4 colours 60 (`game.js:6203-6219`). Trails: Emberwake 2400 (needs Seal 1), Lanternfly 3000. | Fine as is. Price points sit well above what the first session earns (§4), which is good: they are week-two goals. |
| Acorns and stores | **BUILT** | Wild win 2 × level (min 4, max 40; 25% after 60 a day), holder win 10 × top level (×3 at a Hall; Fen pays 420), finds 10-25 ×2/day (`game.js:15519-15548`, `6129`). Sinks: snacks 40-400, Lantern rest 5, wardrobe. | The only early sinks are snacks and rests. There's nothing small and fun to buy between the first holder win and the wardrobe. |
| Clock, schedules, news | **BUILT** | Game day = 42 real minutes, with time windows (`clock.js`). NPCs follow schedules; NEWS has three editions a real day, seeded by day and flags (`news.js:13-15`); Ribbit too. | Strong flavour, but it's a reason to *read*, not to *do*. Nothing in the news points at a thing to go and do today. |
| Play Together | **HALF** | Co-op (2 holders) in Hearthmoor and Route 1 only, needs Firebase; the host gets the befriend and the Acorns, the guest gets XP (`net.js:32-55`; guest no Acorns, `game.js:15527`). | Only the first two maps, and the guest gets less. Fine to leave until Phase 2. |
| Trading | **MISSING** | TRADE_CODES is a reserved id block (D641-D648), with no code. | Leave for later (needs cloud and policy). |
| Minigames | **HALF** | 5 solo and 3 pass-the-phone games at the High Charity Event Hall, 3 clears a day each, +1 bond (max 3/day), 80/40 then 25/15 Acorns (`minigames.js:1-56`). | **Gated behind the faction pledge, High Charity and Ilse's letter** (`data/highcharity.json:4`, `1731`). A new holder can't reach the best two-minute session filler until after Trial 1 and the pick. |
| Streaks, calendar, daily goals | **MISSING** | none | A short "today" list would turn the built dailies (bowl, finds, hello, the wild-Acorn cap, care XP cap) into visible goals. |

**Read across:** almost every daily system is already built. The gap is *showing* it: on return, on WALK, in one place, with a tick. That's why two of the three quick wins in §8 are surfacing work, not new systems.

## 4. Progression feel

Numbers from `stats.js` and the play:

| Item | Value | Feel |
|---|---|---|
| Curve | Battle XP to reach level L = 4(L−1)²: Lv 5 = 64, Lv 10 = 324, Lv 12 = 484, Lv 13 = 576, Lv 15 = 784 (`stats.js:47`) | Gentle quadratic, fast early. |
| XP per wild | (4 + 2.5 × foe Lv) × stage × level-diff clamp (0.25-1.5) (`stats.js:111-116`); holders ×1.5. Measured: 15-25 per Route 1/Fernbrook wild at Lv 6-10. | ~3-4 wins a level at Lv 6-10; ~4-5 at Lv 11-13. |
| Measured pace | Lv 5 → ~9.6 from minute 4 to minute 11 (13 battles); ~11.6 after the first Hall holder | Good: a level every ~2 minutes early. |
| The gap before Fen | Fen fields 12/13/14 (BLOOM); the holders field 10-12. A no-grind holder arrives at ~Lv 10. | **~3 levels short = 12-15 wild wins, ~4-6 minutes**, unless Day 1 and the home trip are fought through. Not a grind wall, but it's the same seven species again. |
| Caps and growing up | Cap 15 before Seal 1, 22 after; growing up at Lv 12 (no Seal) and Lv 24 (2 Seals) (`stats.js:75-76`) | The Lv 12 "Growing up" moment lands right at the Hall: a big "one more" beat. Leave it. |
| Moves | 3 at the start, then at 9 / 12 / 15 / 18 / 20 / 25 / 30, plus one on growing up (`moves.js`) | Lv 9 and 12 land in the first session; good telegraphing. |
| Acorns per minute | 177 Acorns by Fen at ~11 min (about 25 a minute after Route 1 starts); a wild win pays 2 × level (min 4), so 12-20 per Fernbrook wild; 60 a day before the 25% rate (`game.js:15519`) | Snacks (40-150) are affordable; the first wardrobe item (60-90) is in reach by Fernbrook; Emberwake (2400) is a week-two goal. **The early middle has nothing small to buy that's fun** (R4, R6 help). |
| Difficulty to Fen | Rook (counter, lost by design) → guide (counter, befriended) → Pia (GUST Lv 4) → Tam (2× TIDE 5/6) → Ollie → Fernbrook wilds 6-10 → three holders → Fen | **Spikes at Tam for EMBER** and **at the Hall for TIDE**: 7 of the Hall's 9 foes are BLOOM, which resists TIDE, and the 2 VOLT moths hit TIDE double. A Drizzlet holder needs a non-TIDE partner from Route 1. R9's counter hint covers both. |
| Battle variety | 8 types with a 2× / 0.5× / 0 chart; stat stages and heals; no status effects; signature moves; per-type move FX | Enough for Act 1. Leave it (R10). |
| Empty stretches | Fernbrook square → Fen → crates, if the holder grinds: the same species as Route 1, at 29 s a match | R6 (area-own species) is the fix. |

## 5. Collection and discovery

| Area | Wild species (spawn table) | Levels | Notes |
|---|---|---|---|
| Hearthmoor | the guide wild only (`placeGuide`, `game.js:10510`): the counter of your starter, Lv 3, with a befriend bonus | 3 | Good: you befriend the type that beat you. |
| Route 1 | beetle 30, mole 20, moth 15, crab 12, dormouse 10, vane 8 (storm/snow only), gust 6, frost 2 (`SPAWNS.route1`, `game.js:10421`) | 2-6, following the lead (cap 9) | 6 species on a normal day. |
| Fernbrook | beetle 30, mole 25, moth 10, dormouse 10, crab 8, vane 7, shade 5, frost 3 (`SPAWNS.fernbrook`) | 6-10, following the lead (cap 13) | **6 of the 8 rows repeat Route 1**; only shade is new. |
| Everywhere | 5% "grown-up" second forms (`stage2: 0.05`); 8% any-species roll on maps without a table (`game.js:10407-10408`) | | The 5% second form is the game's real "rare" moment, and **nothing in the field signals it**. |

- **Variety:** the first two outdoor areas share their roster. A holder who has met beetle, mole, moth and dormouse on Route 1 finds nothing new in Fernbrook except a 5% shade. That's the main reason the Fernbrook stretch reads as grind.
- **Rare spawns:** the storm/snow Vanelet, tied to real weather (Open-Meteo, `env.js`), is a lovely "check back in bad weather" idea. Today it shows only as a cloud on a ??? Journal cell. The 5% second forms are invisible until the battle opens.
- **Secrets:** 17 one-time map pickups in the game, 3 of them on Route 1 / Fernbrook; three faded-creature side tasks (`quests.js:28-32`). Optional places (Mahopac, Hushwater, High Charity) are story-gated, not secret.
- **Reasons to leave the path:** few, before Trial 1. The cue is always on, the roads are short, and off-path grass holds the same species.
- **Leave it:** the befriend mini-game (a timing bar whose zone grows as the foe tires; `moves.js:1936-1947`), the NEW JOURNAL ENTRY card, and the counter-type guide wild. These are the strongest collection beats in the game.

## 6. Story pull

| Thread | Pull today | Notes |
|---|---|---|
| Ilse's hints in the Lodge (#258) | **Strong** | "Someone will offer to make Robin brighter… Ask what it costs" plants the Glimmerwell question in the first 2 minutes. |
| Rook | **Strong** | Counter-pick, a lost first match, the walk to the Lantern House, "I'm meeting someone". A competitor with a secret is a hook. |
| The faction struggle | **Strong in writing, late in play** | On live, Glimmerwell's stand and Fen's worry arrive with Fernbrook; with #261, Lizzy's class explains both sides. The pick comes after Trial 1 (D1055, D1169, D1172). |
| The Seals | **Thin in play, rich in canon** | **In play today**, Seal 1 raises the cap 15 → 22 (`stats.js:76`), opens Emberwake (2400), lets starter lines spawn in Old Meadow at ×0.2 (`game.js:10433`) and unlocks Fen's rematch, and the holder is told almost none of it. **In canon (settled by Vincent Mon Nov 2, ~10:19-10:40 PM ET; STORY v0.7.9 §2 "What Seals are", SEALS-A to SEALS-AD, D1210-D1239)**, a Seal is far more: it is tuned to its pair, it is **a key** to the small sealed Hall Stone room under each dais ("one plate of old lore"; SEALS-B), it is written on the Seal roll in High Charity (an old muster law; SEALS-L, Y), all eight together matter later (SEALS-C), and who controls the supply is a story detail (SEALS-R, X; private design STORY.md §2). A both-path buy-back stall says "We buy old Seals. Fair Acorns." This is the strongest long-term hook in the game: a reason to want *every* Seal that isn't the level cap. **None of it is built yet.** R5 asks for the first two visible pieces. |
| Cliffhangers | **Good** | Rook's teaser after Hall 1 ("Rook has news"), then the Route 2 Census. With #261 and the crackdown (D1197), Trial 1 ends on a threat instead of a pat on the back. |
| The post-Trial crackdown (POST_TRIAL_CRACKDOWN v0.3.1 on main, aligned with the Seals canon per D1242; not built; the `post_trial` slot is a placeholder Fen line on live) | **Potentially the best hook in Act 1** | The holder wins, then the law they trusted locks the town and threatens their Seal. In canon the Seal goes dull in the Commander's hand and comes back (SEALS-G), and the President speaks on the Lantern House TV. Fen defies the Commander, a curfew night in the Lantern House, and dawn at the orchard gate for the pick. It turns the Seal from a trophy into a thing someone wants to take, which makes the next Seal matter. **Risks as a hook:** (a) it lands right after the longest stretch (the Hall), so it must be short (the spec's 8 beats; keep reading time under ~3 minutes at 15 cps); (b) it needs the Seal to *mean* something on screen first (the canon now exists; R5 shows it), or "no new Seals in Fernbrook" has no weight; (c) Story must keep it ambiguous enough that the Keepers pick stays attractive (the spec's §8 ledger, D1209). |
| #261's home trip (Day 1 → home → Mahopac → Lizzy's class → back to Fernbrook), now live | **Good, if the text is trimmed** | The walk costs little (Route 1 is ~74 steps, ~13 s, and wilds are visible and avoidable), so no fast travel is needed. The cost is reading: the trip adds about 110 text boxes before the Hall (§2.4). |

## 7. Phone fit

| Check | Finding | Rating |
|---|---|---|
| Resume speed | From a cold load of the live URL to a playable state took **1.5-2.2 s** (the `boot` events in the log, desktop Chromium on a fast link; a real iPhone on 4G will be slower). The holder lands on WALK at the saved tile; there's no title screen and no Continue button (`game.js:1489`, `18984`). Autosave every 5 s, on `pagehide` and after scenes (`game.js:19012`, `18673`). | **Strong.** Leave it. |
| What a returning holder sees | The map and the cue. The daily hello, the welcome-back, the Warm Bowl and today's finds are all silent until PARTNER is opened (§3). | **Thin.** R1, R2 |
| Session length | The first befriend lands ~6 min into a fresh game (§2). After that, a "unit" of play is one wild match (8-45 s in the script, less if the holder taps through the text) plus walking. Holder matches ran 40-55 s at normal text speed (47.5 s on average in the Hall). A 2-minute bus-stop session can do 2-3 wild matches and a care tap, but has nothing to *finish* (no slip or daily to tick). | **OK**; R2 gives a short session an end. |
| Long text in one sitting | The first 4.3 minutes (estimated) are about **55 text boxes and ~2,950 characters** before the starter is in hand: the house morning, Mom, then Ilse's Lodge speech (29 boxes, ~1,700 characters, the longest single stretch). Each line is short and well written. But on a phone, a stack of 29 boxes is where a skimmer starts tapping blind and then misses the Glimmerwell hint. | **Watch.** Story could trim Ilse's speech by a third without losing either hint. |
| One hand | Modern (tap to walk, the default since Oct 27) and arcade (pad and TALK) both work one-thumbed at 390. Battle buttons sit in the bottom half. The befriend bar is a single tap. | **Strong.** |
| Interrupts | A worn-out Walkling naps for 20 minutes unless you rest at a Lantern House (5 Acorns) or use a Wake Tonic (`stats.js:52`, `138`). A wipe sends you to the last Lantern House. On a phone this is fine: it's short and clearly told ("RESTING 20m"). | **Fine.** |

## 8. Recommendations

Ranked by hook value against effort. Effort: **S** about a day, **M** 2-4 days, **L** a week or more, engineer time only. "Who" says who else must touch it besides the engineer: Design, **Pia** (Sprites), **June** (Story), or **code only**. Colours follow `walklings-decision`. Ids are reserved in §9. **QW** marks the three quick wins that could ship this week.

| # | What to build | Why it hooks | Where in the loop | Depends on | Effort | Who | Colour (id) |
|---|---|---|---|---|---|---|---|
| R1 **QW** | **Return card on WALK.** On the first boot of a real day (and after 14 h away), show one small card on WALK instead of a stack of toasts: the partner's hello line, the lowest need, "Warm Bowl ready", "2 walk finds today", and one NEWS headline. One tap closes it; it reuses `pumpHello`, `noteWelcome`, `bowlHint` and the FINDS state, and moves the hello's bond point there. | Turns built dailies into a visible reason to play *now*. Today the hello is missed by anyone who never opens PARTNER. | Care → walk (session start) | none; shots at 390/320 | S | code only (copy already approved: `HELLO_LINES`, `WELCOME_LINE`) | yellow (D1312) |
| R2 **QW** | **"Today" ticks on the TODAY card.** Three rows: Warm Bowl, walk finds (0/2), wild Acorns (n/60). No new reward at first, just the ticks; the place-chip pulse when one is ready. | Gives a two-minute session a goal and an end. Uses caps that already exist, so it's honest and needs no balance pass. | Walk / care | R1 nice to have | S | code only; June for three ≤ 40-char labels | yellow (D1313) |
| R3 **QW** | **Make rare wilds visible.** A wild second form (5%) and a weather-only Vanelet draw the existing `spark` glyph the guide wild uses (`game.js:10564`); the first one per day shows a ≤ 40-char toast; the Journal cell gets a small star once met. | The 5% second form is already the game's best surprise, but no one sees it coming. A sparkle makes walking the grass a lottery ticket. | Find → befriend | none | S | code only (glyph exists); June for the toast | yellow (D1314) |
| R4 | **Bond pays.** Each Bond level (2-5) unlocks one small thing for that partner: a new idle or trick (2), a free kit adornment from the existing five (3), a partner-only line in Lantern Houses (4), and a small befriend-zone bonus when that partner leads (5, ≤ +0.03; the cap stays 0.50). A toast and a heart burst on each level. | The slowest, most personal meter becomes a week-two goal, and daily care gets a payoff beyond battle. | Care → bond → befriend | Design for the unlock list; Pia only if a new trick needs frames | M | Design, June; Pia optional | yellow (D1315) |
| R5 | **Make the Seal a key on screen.** (a) After the Seal scene, a short card lists what it opened: "Lv cap 22", "Fen's rematch", "Emberwake in the wardrobe", "new Walklings in Old Meadow". (b) Build Fernbrook's Hall Stone room behind the Seal read (SEALS-B: a small sealed room under the dais, one plate of old lore), opened from the Hall after the pick. | Turns a trophy into a key. It gives the crackdown's threat its weight, and gives every later Hall a second reward beyond the cap. The canon is settled, so this is build work, not story invention. | Trial → Seal → story | (a) none; (b) the Seals canon (settled), June's plate text, Design's room packet, rule 9 previews, after the crackdown's build | (a) S, (b) M | (a) code only; (b) Design, June, Pia for the stone and plate | (a) yellow (D1316); (b) **red (D1317)**: a new room, rule 9 |
| R6 | **Fernbrook gets its own Walklings, plus area tallies.** Give Fernbrook (and every later area) 2 species Route 1 doesn't have, using roster species already in `sprites.js`. Add a Journal tally per area ("Route 1 · 5 of 6 met") and a one-time Acorn gift when an area's tally is full. | Fixes the "same seven" middle stretch, gives a reason to explore off the path, and sets a reachable collection goal per area. | Walk → find → befriend | Design picks species by habitat (creature canon, STORY §11); spawn tables are game data (`SPAWNS`), not verbatim design files | M | Design, June (tally copy) | yellow (D1318) |
| R7 | **Daily slips on the town board.** Three rotating slips seeded by the day (the NEWS seed): "Meet a mole on Route 1", "Win 3 wild matches in Fernbrook", "Walk 300 steps". Each pays 15-30 Acorns or +2 bond through the existing wild-win seam (`wildWinRewards`, which already reserves the bounty hook). They are accepted at the board, per `walklings-quests`. | The single biggest missing retention system: a fresh, small reason to play every day. | Walk → battle → reward | **Q19 town boards are on hold (Vincent)**; Design for the slip catalog (TOWN_BOARD.md) | M | Design, June | **red (D1319)**: core functionality and an on-hold area. Default: hold; offer it as the first board pass when Q19 reopens |
| R8 | **One booth before the pick.** One solo Event Hall game (e.g. lantern) as a booth on an existing walkable tile in Hearthmoor Plaza, same daily caps, before the pledge. | The best two-minute session filler today is locked until after Trial 1 and the pick. | Between story beats | Design picks the spot (no room change, so no rule 9; a new prop on a walkable tile needs shots) | M | Design | yellow (D1320) |
| R9 | **A counter-type nudge after a holder loss.** After the first loss to a holder whose team counters the lead (e.g. Tam's two TIDE crabs against an EMBER partner), the wake-up line at the Lantern House adds one hint naming a counter type and where it lives on this map, read from the spawn table and the TODAY "likely" list ("TIDE hates BLOOM and VOLT. Beetles and moths live on Route 1."). Once per holder, ≤ 110 characters. | On build 2141 the script, leading with EMBER Pipkit (Lv 7) and a Lv 3 Drizzlet, lost to Tam 11 times in a row (13 in all). On 2259, after befriending two BLOOM Walklings on the way, it cleared Route 1's holders with one loss (§2.2). A child would quit at the first case. Route 1 already holds the answer (beetle and mole BLOOM, moth VOLT); the game just never says so. | Battle → befriend | none | S | code; June for the line template | yellow (D1321) |
| R10 | **Leave the battle system alone until Episode 1 ships.** There are no status effects (only stat stages and heals), but the 8-type chart, the counter-pick and the befriend bar carry Act 1. Revisit after Brinewick. | Saying no protects the team's time. Every other row here hooks harder per day of work. | Battle | none | none (L if ever built) | none | red if ever proposed (D1322). Default: not before Episode 1 is done. This is the one gamedev-skill-inspired core idea (see §9.2) |

**Leave it (no work needed):** the opening (#258 partner day through the first befriend), Rook's counter-pick and the walk to the Lantern House, the befriend timing bar, the NEW JOURNAL ENTRY card, outfits and looks, the floors on needs, autosave and resume, and the three NEWS editions.

**Small fixes (green, no id needed; for the next build that touches these files):**
- `wake` cue: on build 2141 the cue stayed on the mirror after dressing. **Fixed on 2259** (#261/#265, "the quest arrow leaves the mirror once dressed"); seen fixed in the run.
- **Trial Hall cue points at the exit** (seen on 2259): give `hall1_holders` the three holders as `npc`/`npcIds` (or an in-Hall target), so the arrow leads to the next unbeaten holder, not back out the door (§2.3).
- **Unlock tips wait for the battle to end** (seen on 2259): "Your Party: SHOW ME / SKIP" opened inside a wild battle, over the battle buttons (§2.2).
- `crates` cue (optional): point at the nearest untapped crate rather than Tobin.
- Care walk versus `first_wild`: on a save that stood still near the guide wild, the care lesson said "Stand still, then tap Pipkit" while the main cue pointed at the wild, which was moving away. Seen once on a resumed save, not on the clean run. QA should check it on a phone (§2.3).
- Hello on WALK: see R1.

## 9. Risks and decision ids

### 9.1 Risks

| Risk | With | What to watch | Default |
|---|---|---|---|
| Canon | STORY §11 (creature roster), STORY §2 "What Seals are" (SEALS-A to AD), the crackdown (D1197-D1209, v0.3.1) and the Lantern House wire set (LH-1 to LH-5), D1173 (town steering) | R5b's plate text and R6's species picks must come from June and Design, not from this audit. "bellgold" stays out of player text (name check pending). R7's slips may name no faction job (`walklings-quests`: no Standing grants, no faction or KeeperUAV/Botnet jobs). | Nothing in §8 adds a story fact. Placeholders are marked |
| Rule 9 and visible changes | AGENTS rule 9, CLAUDE.md "Visible changes" | R1, R2, R3, R5 and R8 are visible: each ships before and after shots at 390 and 320. None redesigns a room. R8 adds one booth prop on an existing walkable tile, which is not a redesign, but Morgan should not merge it without Vincent seeing the shots. | Shots for every visible row |
| Big interface change (rule 3, red) | R1 (a new card on boot), R2 (TODAY rows) | Both are small and reuse existing surfaces. If Vincent reads R1 as an interface change, it goes red. | Yellow with that note; Morgan decides the routing |
| Save v2 | rule 2 | R1-R3 need no new save key (they read `daily.*`, `S.care` and the Journal's save key). R4 needs at most one additive key per partner (e.g. `bondSeen`), via `normalizeV2`. R6's one-time gift needs a `story.area_<id>_full` flag. R7 needs a `daily.slips` object. `v` stays 2 and nothing is renamed. | Additive only |
| Open decisions | D1159-D1165 (#262), D1186-D1188 (#261), D1189-D1196 and D1197-D1209 (#263; D1242: the settled Seals calls win over the crackdown's rows), the Seals calls D1210-D1239, Q19 (town boards on hold) | R5b must follow SEALS-B exactly; R7 waits on Q19; R9 reads `SPAWNS` and the TODAY list only. | This block starts at D1312 |
| One build in flight | `roles/morgan-hale.md` | The quick wins touch `game.js`; #262 has merged (`dd6d78b`), so they build on top of it. | Queue R1-R3 as one small `game.js` build when Morgan clears it |
| Pacing debt | #261 + crackdown | Day 1, the home trip, the class, three Hall holders, Fen and the crackdown night all come before the pick. Seal 1 already lands at ~30-40 min (§2.4); the crackdown adds a few minutes of reading after it. | Trim text before adding any more required beats before the pick |

### 9.2 The gamedev-skill rule

`walklings-decision` says a core-mechanic change inspired by a gamedev-* skill is always red, and only one may be raised per packet. This audit was asked to read those skills. Only one row comes from them, R10 (status effects), and it is raised to say **no**. Every other row reuses a system already in the game (dailies, Bond, the spark glyph, spawn tables, the board seam, the Event Hall), so none is a skill-inspired mechanic.

### 9.3 Decision ids (reserved here)

Checked with `walklings-decision-ids` on Tue Nov 3, 2026, ~12:30 AM ET:
- main's header (`af1ba3f`): D1243-D1252 plaza and homes, D1253-D1254 design (unused), D1255-D1281 Design's HIGH_CHARITY v0.1, D1282-D1286 Design's Lantern House; next free D1287;
- design master `specs/STORY_DECISIONS.md` (v0.67 and later): D1287-D1294 WARDROBE_SHOP v0.3, D1295-D1311 HIGH_CHARITY_LAYOUT v0.2; **next free D1312**. Their paste lines are now in the game header too;
- every origin branch and open PR: nothing at or above D1312.

This block was first written as D1255-D1265, then D1287-D1297, as Design's blocks landed while this audit was being written. It moved up both times before anything merged.

**Reserved: D1312-D1322. Next free: D1323.**

| Id | Colour | Call | Default |
|---|---|---|---|
| D1312 | yellow | R1 return card on WALK | Yes, built on top of #262 (merged); shots at 390/320 |
| D1313 | yellow | R2 TODAY ticks for the existing dailies, no new reward | Yes |
| D1314 | yellow | R3 sparkle and toast for 5% second forms and the weather-only Vanelet | Yes |
| D1315 | yellow | R4 Bond levels 2-5 unlock small things for that partner | Yes; Design writes the list |
| D1316 | yellow | R5a Seal card listing what the Seal opened | Yes |
| D1317 | **red** | R5b Fernbrook's Hall Stone room behind the Seal read (SEALS-B; a new room, rule 9) | Design packet and previews first; build after the crackdown |
| D1318 | yellow | R6 two area-own species per area, plus per-area Journal tallies and a one-time gift | Yes; Design picks species |
| D1319 | **red** | R7 daily town-board slips (core functionality; Q19 on hold) | Hold until Vincent reopens Q19 |
| D1320 | yellow | R8 one Event Hall booth in Hearthmoor Plaza before the pick | Yes; Design picks the tile |
| D1321 | yellow | R9 one counter-type hint after the first loss to a countering holder | Yes |
| D1322 | **red** | R10 status effects or other battle-system additions before Episode 1 ships | No |
