# Town boards

Scope for a bulletin board in each town, and a Town Board app on the Keeper1. TB-1 (empty boards, live reports, the phone app) and the Hearthmoor and Fernbrook squares are in the game on main. TB-3, Cald's gate count, is on this branch. Vincent settled the town-list D37 and D38–D49 on Oct 14, 2026. The region-map row that also uses D37 is still open and does not gate this file. Do not renumber either D37.

Q17 (the box screen) and Q18 (the installable app) are already in the game. This document does not rebuild them.

Surveyed on Oct 14, 2026 from the merged maps (`maps_slice`, `civic`, `heights`, `glimmer_path`, `cobblecrest`, `highcharity`, `mahopac`) and from `quests.js`, `game.js` (`phoneApp`, `drawObjectiveCue`, `factionOfMap`), and `index.html`.

## What the player gets

A town has a physical board at its center. The same board lives on the phone as an app named Town Board. The board has three piles:

1. **Slips.** Side jobs from people. The slip names a person and a place. Taking a slip puts a blue marker on that person. The job itself starts when they ask, in conversation.
2. **Bounties.** The same shape as a slip, with a creature as a later step. The first marker is still the person who posted it. The bounty pile is empty in the first build.
3. **Reports.** Short lines about this map: what is open, what the watch has seen, what the weather is doing to the paper. Reports are readable the day the board exists. They are not quests and they set no flags.

Wild maps have no board and no pile. On a road, the phone shows the last town.

Captain Lumen already told the truth about a different board: KeeperUAV is the watch desk, it is blank, and a glimmer pledge does not take jobs from it (`hq_lumen` in `data/civic.json`). Town Board is the cork board in the square. It stays a separate app. NPC slips do not move onto KeeperUAV or Botnet.

## Rules that are already settled by the request

- No quest is wired to a board in the first build. The pins are empty on purpose.
- A job that later appears on a board starts by going to talk to the NPC. The board and the phone can point. They do not set the quest's yes-flag.
- A slip the player takes uses the blue side-quest chevron that already exists (`PAL.c`, `#41a6f6`, drawn in `drawObjectiveCue`). The main story chevron stays yellow (`PAL.y`).
- The jobs are work from people. They are not faction contracts. Standing does not move because a slip was finished. Daily faction earning is wanted and slow (D18). The cap is still open, so it stays unbuilt.
- The paper on the board wears the propaganda of the faction that **holds the town**. The player's pledge changes the phone's shell (Keeper1 vs the cracked handset). It does not restyle Hearthmoor's paper.
- A future quest follows [.cursor/skills/walklings-quests/SKILL.md](.cursor/skills/walklings-quests/SKILL.md). Save `v` stays 2.

D39 and D40 are settled. The phone pins a slip. The NPC's yes is the accept. Board pins are a separate blue list, at most three, and they do not enter Mom's chain.

## Towns, squares, and where the board stands

`factionOfMap()` in `game.js` paints roofs. It is the wrong function for a board: High Charity returns null, and Mahopac returns null. Town control for the paper lives in the board table, not in that function.

Trigger radius is Manhattan (`checkTriggers`). Fernbrook's `fb_glimmer` trigger at (13, 8) with `r: 3` does not reach the proposed Fernbrook square (the nearest proposed tile is 5 away).

| Map | Hold | Square today | First build |
|---|---|---|---|
| Hearthmoor | Keepers | A street. Keeper House sits south of it. No plaza. | Widen a crossing into Lantern Square. Board at (8, 7). |
| Fernbrook | Keepers, with a Glimmerwell stand on the street | Constable Rue calls the west grass "the square." The tiles are a single path. | Add a 4×2 forecourt north of the path. Board at (8, 6). |
| Cobblecrest | Keepers, then Glimmerwell after `story.quarry_bought` | Gravel yard (`c`) north and south of the main street. | Board at (16, 9), on gravel. No new tiles. |
| High Charity | Keepers (capital). `factionOfMap` is null here. | Plaza stone (`P`) already, hundreds of tiles. | Board on open plaza stone. Proposed (31, 17), confirmed empty at survey. Re-check the tile before placing. |
| Mahopac | Neither. Bess: "No banners." | One path on a 20×16 map. People are stuck mid-step. | D38: one uncrested board at (11, 8). No slips for a while. |

### Hearthmoor — Lantern Square

Map stays 24×20. Warps stay put, including the north trail at (9, 0) and the east gate at (23, 8). Officer Bren keeps patrolling row 8. The board is one tile north of that patrol, so he does not walk through the wood.

Replace two rows (civic already replaces row 9; this replacement includes the Keeper House roof):

| Row | New grid |
|---|---|
| 7 | `TggpggppppgpgfggpgggTTTT` |
| 9 | `TgggggppppRRRRpggggggTTT` |

That is path at x=6–9 on rows 7 and 9. Row 8 is already path, so the road runs through a crossing four tiles wide. The south edge stops against the Keeper House roof at x=10. The board prop is (8, 7). A player on the street at (8, 8) faces it. The lodge sign stays at (12, 7). The Keeper House door stays at (11, 11).

### Fernbrook — the forecourt Rue already named

Map stays 32×20. The orchard fence starts at row 10, so the square grows north of the street. The Heights warp at (6, 0) and the side-pick trigger at (9, 10) stay. Juniper and the glimmer stand stay at x=13–14. The faded Fuzzwick tile (13, 7) stays.

| Row | New grid |
|---|---|
| 6 | `TggggpppppfgggggggggggpggggggggT` |
| 7 | `TggggpppppgggggggfggggpggggfgggT` |

Path at x=6–9 on rows 6 and 7 (x=5 was already the lantern path). The flower at (10, 6) stays. Board prop at (8, 6), read from (8, 7) or from the street at (8, 8). Rue stays at (4, 9). His line "A keeper in the square" starts being true of a place.

### Cobblecrest and High Charity

Cobblecrest (16, 9) is gravel, south of the street, east of Clerk Mint's spot at (12, 9). The cairn stays at (18, 6). Two props can share the idea of one board by `when`: `cc_board` while `!story.quarry_bought`, `cc_board_bright` after it. `present()` already hides the other.

High Charity's sky-dock sign already says "Read the board before you step on a pad." That boarding board stays the airship's. The town board is the plaza post. The market chalkboard (`hc_stall_r`) stays a price board.

### Mahopac

A civic square fights the scene: twenty by sixteen, one path, Nora and Cal and Bess frozen, and an explicit lack of banners. D38 is the plain board on the path at (11, 8): no new tiles, no crest, no slogan, and no slips for a while. Reports may show with the other towns.

Growing the map would move `mah_south` at (9, 15) and the Hearthmoor return. That is the wrong size of change for this town.

### No board

| Map | Why it stays wild |
|---|---|
| Route 1, Route 2 | Roads. |
| Wickerglen | A hollow. The census tent is a story prop. Glimmerwell holds the roof color during the census and still gets no town board. A glen errand, later, is posted in Fernbrook. |
| Old Meadow | Wild grass. |
| Cobblecrest Quarry | A pit. Bounties that happen there are posted on the Cobblecrest board. |
| Fernbrook Heights, RegenX, the tunnels | A ridge and interiors. |
| Homes, the Lodge, Lantern rooms | Private or a desk. Lumen's office is not a second cork board. |
| Brinewick | No map yet. The town, when it is built, includes a square and a board in that same pass. |

## Propaganda

The sleeve is the faction. The slip underneath is a person's handwriting, with no crest. A bought town can sticker a slip "posted with permission." The sticker does nothing mechanical. The words of the job stay the NPC's.

| Holder | Masthead | Slogan on the wood | What the object looks like |
|---|---|---|---|
| Keepers | THE LANTERN POST | Leave a light. Leave them wild. | Dark wood, charcoal, a yellow wax seal, torn corners. |
| Glimmerwell | BRIGHT NOTICE | Have a bright day. | The same wood, wrapped in a mint sleeve. One corner of the old post still shows, with a line ruled out. |
| Mahopac, if it has a board | (no masthead) | No seal. The minute is stuck. | Bare board, star-chart paper, no wax. |

Fernbrook stays a Keeper town, so the wood stays the Lantern Post. One extra prop, a glossy flyer pinned crooked, reads "COMFORT LIGHTING. Complimentary. Brighter by nature." It is not a slip. Examining it can point at Juniper's stand. D42 says the flyer ships with the board.

Cobblecrest is the only town whose sleeve changes during Act 1. Before the buyout the post is Keeper paper and the quarry sign is already Glimmerwell's. After `story.quarry_bought` the sleeve goes on overnight. Hale's hall and Dottie's stall remain true; the adjective changes. Clerk Mint's sticker appears on the frame, not inside Hattie's handwriting. (Hattie is a Hearthmoor job. Cobblecrest's own slips are Dottie and Watch Ivo, below.)

A glimmer player reading Hearthmoor's post still gets Keeper paper. The cracked handset tints the phone chrome. The report text is quoted from the town. D41 and D44 confirm that split.

Draft report lines below are implementer voice. D49 decides whether the first build ships them marked placeholder, or waits for the designer. Length budget if they become data: 110 characters, the scene `say` cap. No `{tokens}`.

### Reports that can be true on day one

These read flags the game already writes. They set nothing.

**Hearthmoor**

- East road is Route 1. The watch walks the street.
- Before the starter: the east gate is holding.
- After the starter, before Rook's battle: Rook is at the east gate.
- Before `story.mom_sent`: the north trail can wait.
- After it: the north trail is open, and time feels thick.
- After `story.phone_got`: Keeper1 is live. The wires stay with the watch.
- A glimmer pledge adds one footer, still on Keeper paper: a mint vest was seen. The post did not change hands.

**Fernbrook**

- Before the orchard is cleared: the Trial Hall is latched. Fen is outside.
- After it, before Seal 1: the Hall is open.
- Before Seal 1: Route 2 is under the rockslide.
- After Seal 1: Route 2 is open toward Wickerglen.
- Always: a Glimmerwell stand is on the main street. It is not the town.

**Cobblecrest, Lantern Post**

- Cairnside Supplies is chalked on the stall.
- The quarry road is watched.
- Before Seal 2: Hale's door has a chalk note about the quarry meeting.
- After the buyout the masthead becomes Bright Notice: the quarry is a partnership, the cairn is still the cairn, and visitors are welcome briefly.

**High Charity**

- The plaza is open. The south gate is the coach home.
- The Event Hall is taking games.
- The sky-dock keeps its own boarding board. This post is the town's.
- The Lantern Market is south of this post.

**Mahopac, only if D38 gives it paper**

- The lens remembers. The minute does not move.
- After `story.dream_woke`: someone woke. The path did not.

**Every town, from the live sky**

The env card already knows rain, snow, and night. One line can react: the post is damp, the sleeve fogs, the star-chart curls. That is the dynamic half of "news about this map," and it needs no new flag.

Fernbrook and Cobblecrest also have spawn tables. A report may name one species the grass is known for ("Chillbits take the windfalls"). That line is a field note, not a marker.

## Slips and bounties, unwired

The first build shows the headings and the empty lines: "No slips are pinned up." and "No creature is named today." The catalog below is what a later pass can hang on the pins. Each row except Gate count is still a proposal. Gate count is wired on this branch. D39 is settled.

Taking a slip, once jobs exist, sets a pin flag only (`story.board_<id>_pinned`). The blue marker targets the NPC tile. The NPC scene is a `choice`. The yes branch is the only writer of `story.board_<id>_yes`. The decline branch writes nothing, so the marker stays. Rewards, when someone writes them, are Acorns, a snack, bond, or a journal line.

### Hearthmoor

| Slip | Person | What they actually want, after you talk |
|---|---|---|
| Shy crabs | Hattie, by the south fence | Walk the Route 1 stream and come back with the color of glass the crabs liked. A watch, not a battle. |
| The other glove | Mrs. Calloway, in Rook's house | Rook left a glove on the east path. She will not say which bush until you are in the room. |
| Gate count | Officer Cald | Wired on this branch. Look at the east sign after Rook's battle and tell Cald it is still standing. The pin, the talk, the yes, and the decline. Other catalog rows stay proposals. |

### Fernbrook

| Slip | Person | What they actually want |
|---|---|---|
| Windfall | Odile | A windfall apple from the orchard grass, brought back. Not Fen's trial. |
| The hungry wick | Keeper Amos | A lantern in his house that eats its wick. Look at it with him. No item leaves the bag. |
| Leave the flyer | Constable Rue | Read the crooked Comfort flyer and leave it up. He does not want it torn down. |

### Cobblecrest

| Slip | Person | What they actually want |
|---|---|---|
| Three smooth stones | Dottie, at the stall | Talk to her, then three stones in the quarry, then back. The quarry has no board of its own. |
| The cairn ribbon | Watch Ivo | Someone moved a ribbon on the cairn. Look, then tell him. After the buyout, Mint's sticker says "approved." Ivo's ask stays Ivo's, and he is sour about it. |

### High Charity

| Slip | Person | What they actually want |
|---|---|---|
| Plaza picnic | Baker Cole | A basket left on the plaza stone. |
| Canal kite | Kit | A kite caught over the canal. |
| Unclaimed crate | Porter Quin, at the sky-dock | The marker starts on Quin. The crate is the second step, inside the terminal. This is the test that a delivery still begins with a person. |

### Mahopac

No slips until D38 and `story.dream_woke`. Nora finishing her wave is Mom's dream, and it should not also be a board job. A later slip, if any, is Nora asking for one star copied onto paper, and she still has to ask in person.

### Bounties (second pile, still later)

A bounty is a slip whose second step is a creature. The first blue marker is the poster.

- Ollie watches moths on Route 1, which has no board. Fernbrook's bounty pile can name a grey moth at dusk. The pin marks Ollie. After he talks, the marker moves to a grass tile. Befriending or wearying a moth while that step is current finishes it. The battle-end hook does not exist yet. D47 says to wait.
- Tam's glass crabs can be the Hearthmoor version of the same shape, posted by Hattie, resolved on Route 1.

Until that hook exists, the bounty heading is an empty sentence.

## Phone

Home screen today (`index.html`): Contacts, Notes, Walklings, Friends, KeeperUAV / Botnet, Ribbit, BOARD. Walklings opens the WALKLINGS tab. Town Board is `data-app="board"`. The pane title is TOWN BOARD. The button label is BOARD if TOWN BOARD clips the 320px grid (D44). The cracked handset keeps the hack shell. The pane still says TOWN BOARD, because the paper is the town's.

The app and the prop call one renderer, so the lists cannot drift.

| Where you are | What the app shows |
|---|---|
| A town with a board | That town's masthead, reports, and empty piles. |
| An interior | The `outdoor` town (`hm_home_in` shows Hearthmoor). |
| A road, a hollow, a quarry, the Heights | The last town whose map you entered. A line says you are between towns. |
| Before any town, or before `story.phone_got` | The phone button stays hidden, as it does today. The physical board still works on foot. |

`S.board.lastTown` is the memory. It is an additive object in `normalizeV2`, same pattern as `S.standing`. No version bump.

The button on a slip says "Go see them." Gate count uses that button on this branch. It pins the marker. It does not say Accept. D39 is settled: the NPC's yes is the accept.

## How the blue marker fits the quest log

`sideActive()` in `quests.js` lists every open side chain. The SIDE card shows the tracked one: phone, then Mom. Board pins stay a separate list and do not enter `SIDE_CHAINS`. D194 narrows D40: an accepted slip (`story.board_<chain>_yes`) is a read-only row on the QUEST panel after the side rows. A pin alone is not on the panel. The row leaves when `_done` is set. Decline never sets `_yes`, so it never lists the slip.

Settled draw (D40, narrowed by D194):

- The quest panel's side card keeps phone, then Mom. Accepted slips are read-only rows after those side rows. Pins stay off the panel.
- A pinned slip draws with the same blue chevron.
- When both would sit on one tile, the slip's chevron shifts 7px, which is the offset the side chevron already uses against the yellow one.
- At most three pins. The map shows the latest. The phone lists all three.
- `devCheck` counts `CHAIN`, `SIDE`, and `BOARD` done flags, plus `NOT_STEPS`. The pin flag is in `NOT_STEPS`. The yes, sign, and done flags are `done` on `BOARD` steps. Those steps stay out of `SIDE_CHAINS`.

TB-3 adds `story.board_gate_pinned` (`NOT_STEPS`) and the yes, sign, and done flags as `BOARD` steps. They do not enter `SIDE_CHAINS`.

## Work, in build order

Each block is one PR after the decisions it names. Sizes use the backlog scale as a label only: what changes is in the block.

### TB-1 — Empty boards, live reports, phone app

The calls are settled (town-list D37, D41, D43, D44, D46, D48, D49). This build is on main. Hearthmoor (8, 7) and Fernbrook (8, 6) landed with their squares. Cobblecrest, High Charity, and the Mahopac path board can take a prop with no retile. Mahopac's board gets reports and no slips. Every future town gets a board in the same pass as its map.

- New `data/town_board.json`, registered last in `tools/gen_mapdata.py` `names`, then `python3 tools/gen_mapdata.py`. Slice patches add the props. Words live in this file: masthead, slogan, reports with `when` clauses the scene runner already understands.
- `sprites.js`: `bulletin_keepers`, `bulletin_glimmer`, `bulletin_plain`, and `flyer_glimmer` are the 16×16 grids from `data/town_board_art.json`.
- `index.html` button, `game.js` `phoneApp('board')`, one board overlay used by the prop and the phone, `S.board.lastTown` in `save.js`.
- `tests/town_board.spec.js`: every town in D37 has a board object; Route 1, Wickerglen, Old Meadow, the quarry, and Heights do not; the phone shows Hearthmoor's masthead in Hearthmoor and the last town on Route 1; `story.quarry_bought` swaps Cobblecrest's masthead; `story.side=glimmer` leaves Hearthmoor's masthead on the Lantern Post; slips are empty; `PixelPets.state.v === 2`.
- Screenshot the phone and one board at 320 and 390.

KeeperUAV copy and `hq_lumen` stay as they are.

### TB-2 — Squares

D45 and D38 are settled. The Hearthmoor and Fernbrook row strings above are in the game on main. Mahopac does not grow a square. After the patch, walk Bren's patrol, the east gate, the Lodge door, the Keeper House door, Fernbrook's glimmer trigger, the side-pick tile, Tobin's sight line, and the Heights warp. No warp coordinate changes.

### TB-3 — First real slip

D39, D40, and D47 are settled. One slip only, the Gate count for Cald, is wired on this branch. It teaches the pin, the talk, the yes, and the decline. A later PR can add the rest of the catalog. Mahopac gets no slip. Bounties wait on the battle-end hook. That heading stays empty.

### Art and writing for the designer

| Id | What | Size | Priority |
|---|---|---|---|
| `bulletin_keepers` | Wood post, paper, yellow wax seal | 16×16 | must for TB-1 |
| `bulletin_glimmer` | Same post in a mint sleeve, one old corner showing | 16×16 | must for TB-1 |
| `bulletin_plain` | Bare board, star-chart paper, no seal | 16×16 | must. Mahopac has a board (D38) |
| `flyer_glimmer` | Crooked glossy flyer | 16×16 | should. It ships with the Fernbrook board (D42) |
| Mastheads, slogans, report lines, empty-pile sentences | See the drafts in this file | ≤ 110 chars | D49: empty-pile lines and the two mastheads may ship. Report lines stay marked placeholder |

Voice stays the one in `DESIGN_HANDOFF.md`: Keepers plain and warm, Glimmerwell cheerful and corporate, slips in the speaker's own mouth. The flyer may say "Have a bright day." A slip may not.
