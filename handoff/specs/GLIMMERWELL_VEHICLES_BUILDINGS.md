# GLIMMERWELL_VEHICLES_BUILDINGS: Glimmerwell's answer to the Keeper Watch Coach

Target path: `handoff/specs/GLIMMERWELL_VEHICLES_BUILDINGS.md` (PUBLIC repo; not `docs/`). **Spec and preview build in one PR.** Everything in this spec is built, but only on a debug preview lot (§11). Normal play does not change: no map, scene, save field or player flow is touched. The vehicles and buildings go into the story (§10) only after Vincent signs off the shots (§12) and rules on the red rows (§14). All player text is PLACEHOLDER (D1233); June writes the real lines.

## 1. Status and sources

| Item | Value |
|---|---|
| Status | v0.1, Mon Nov 2, 2026, ~11:30 PM ET (build 20261102-2321). Built behind the preview flag in the same PR |
| Ask (Vincent) | Glimmerwell's answer to the Keeper Watch Coach. It does the jobs of a tank and a helicopter (show of force, patrol, arriving at a scene) without being either. Keepers read as law, order and old iron. Glimmerwell reads as tech, corporate and sleek, with the chip and the Tuning running through it, in the black and red palette. A ground vehicle, an air unit, and 3-5 buildings |
| Read first | `handoff/specs/POST_TRIAL_CRACKDOWN.md` (the Watch Coach, §8 and §10; D1202), `handoff/specs/TRIAL_HALL_FERNBROOK_MAP.md` (the contested language, §6.1-§6.3), the live black and red recolour (`PAL` V/N/Q in `sprites.js`; `handoff/shots/glimmer_dark/`), and both style guides: design repo `scoping/GLIMMERWELL_PALETTE.md` v0.3.1 §10 (Glimmerwell) and `specs/WARDROBE_SHOP.md` §4a with the Trial Hall tone bible (Keeper) |
| Canon read | design repo `STORY.md` (Glimmerwell's products, slogans and the Tuning chip, "a chipped Walkling is a relay"; the Relay House on Route 3, "The hum is normal"); `specs/CHIP_SECRECY.md` (the chip is only ever implied; a non-Glimmer player never reads it, sees it done, or walks into the room where it is done) |
| Code base | origin/main `505e835` (build 20261102-2141) |
| Open PRs checked | #261 (draft), #262, #264 (§13) |
| Inspiration | a sub-agent brief (§3), as rule 9 asks for new looks |
| Shots | `handoff/shots/glimmer_fleet/` (§12) |
| Decision ids | D1220-D1234 (§14). Main's header says D1210 is next, but unmerged branches already hold D1210-D1219 (§14) |

## 2. The read, in one table

The Watch Coach is the Keeper material language made institutional: green lacquer, oak, gold and iron, light from a lantern on top, on big wheels. Glimmerwell answers each point with its opposite.

| | Keepers: law, order, old iron | Glimmerwell: tech, corporate, sleek |
|---|---|---|
| Shape | tall and square; bolted plates | long, low and rounded; one seamless shell |
| Ground | big iron wheels | no wheels: it hovers a hand above the road on a mint glow line |
| Light | a brass lantern searchlight on the roof, shining out | light from below (mint underglow) and from inside (a honey bar on the flank) |
| Surface | oak grain, rivets, green lacquer, iron bands | soot gloss, white nose band, wine skirt, a single crimson pinstripe |
| Marks | gold crests, engraved plaques, hand-lettered slips | the honey badge plate (a chip-like square with pins) and honey "lettering" bars |
| What it says | "By order." | "We're here to help." |

**The chip and the Tuning are drawn, never said** (CHIP_SECRECY). They run through every piece as three motifs:
- **The badge plate:** a honey square with two pins on each side and a mint centre. It reads as a logo; it is shaped like the chip. It sits beside every Glimmerwell door, on the Cruiser's door and on the stall.
- **Trace lines:** 1 px wine lines that run along wall bases, roof panels and the relay plinth, each ending in a honey pad, like a circuit.
- **The ring:** the canon relay ring (wine with honey studs, `relay_ring`), worn by the Sky Concierge's rim and the relay mast.

## 3. Inspiration (sub-agent brief, Mon Nov 2, 2026)

Reference situations only; nothing is copied.

| Piece | Situations | Pitfall at 320 and what the build does |
|---|---|---|
| Ground unit | an airport valet lane at night; a hotel courtesy shuttle idling under a canopy; a product-launch stage reveal; a museum night cart on a polished floor | the skirt edge breaking into bumps reads as wheels. The skirt is one unbroken soot line, and frame 0 (also reduced motion) draws the glow as one solid line |
| Air unit | a tethered fair balloon; an overhead stadium camera on cables; a lighthouse beam in fog; a festival lantern drifting past | a small, faint shadow makes it look parked. The shadow is 22 px wide at 38% and sits about 2 tiles below the craft |
| Clinic | a day spa with frosted windows; a dental reception; a members-only fitness club lobby; a "staff only" back door | frosted glass reads as blank wall: the strip has a 1 px white highlight and a slate band; the inside is never drawn |
| Swap stall | a phone trade-in kiosk; a bottle-return machine; a coffee cart queue; a fair ticket booth | mint lamp dots blur into a stripe: 1 px gaps between lamps |
| Relay mast | a ski-lift pylon; a floodlight tower; a seaside weather station | a thin lattice vanishes: a solid 2 px spine with lattice hints only |
| Vehicle bay | a car-wash tunnel mouth; a covered ambulance bay; a showroom with a roll-up door | the dark opening reads as a cave: a honey header bar caps it |
| Shared piece | | the badge plate beside every door, with a trace line to the wall base |

## 3a. Layout of the preview lot (26 x 16, `glimmer_fleet.js` `GRID`)

```
     x 0         1         2
       01234567890123456789012345
y  0   TTTTTTTTTTTTTTTTTTTTTTTTTT
   1   TggggggggggggggggggggggggT
   2   TgRRRRRRggggggggRRRRRRRggT
   3   TgRRRRRRggggggggRRRRRRRggT
   4   TgHHHHHHggggggggHHHHHHHggT
   5   TgggpgggggggggggHHHHHHHggT
   6   TgggpggggggggggggggpgggggT
   7   TgggpggggggggggggggpgggggT
   8   TppppppppppppppppppppppppT
   9   TppppppppppppppppppppppppT
  10   TgggggggggggppgggggggggggT
  ..   (rows 11-14 the same)
  15   TTTTTTTTTTTTTTTTTTTTTTTTTT
```

| Piece | Tiles |
|---|---|
| Glow Care | roof 2-7 x 2-3, wall row 4, door 4,5, badge 3,4, sign 7,5, Receptionist 6,5 |
| Glimmerwell Relay | mast 11,5 (art rows 3-5), sign 10,6, Mast Tech 12,6 |
| Fleet Bay | roof 16-22 x 2-3, wall rows 4-5, roll door 19,6 (art 18-20), badge 21,5, sign 15,6, Bay Attendant 23,6 |
| Cruiser B (parked) | 20-22,7, facing left; blocks its three cells |
| Cruiser A (patrol) | row 9, x 1 to 21 and back, 3.2 tiles/s, 1.4 s pause at each end |
| Bright Swap | stall 5,12 (blocks 5-6), sign 3,12, Swap Clerk 7,12 |
| Sky Concierge | hovers at 16.5,12 (30 px up); a second one crosses from -2,3 to 27,7 every 9 s |
| Glimmerwell hold only | banners 9,7 and 14,7; Comfort Lamps 9,10 and 16,10; Waiting Local 5,6 |
| Start and exit | start 12,12 facing up; exit path 12,14 (back to where the holder was); sign 14,13 |

## 4. Ground vehicle: the Courtesy Cruiser (the tank's job)

| | |
|---|---|
| Name | **Courtesy Cruiser** (D1220, red). Corporate euphemism for a show of force: it arrives "where you need us" |
| Job | show of force (parks across a square), patrol (runs the road), arrival at a scene (glides in, glow on) |
| Silhouette | long, low lozenge, 44 x 13 visible px inside a 48 x 32 cell (a 3 x 2 tile footprint; it blocks 3 cells when parked). A fastback cabin of tinted glass, a white nose band, a soot body, a wine skirt that runs to the ground, no wheels, no roof light |
| Light | a mint underglow line under the skirt; a honey "lettering" bar on the flank; a white headlamp; a crimson tail light and one crimson pinstripe |
| Frames | idle 2 (700 ms): frame 0 solid glow, frame 1 a dithered glow and a 1 px hover bob. Moving 2 (160 ms): the glow runs, a glow trail and two speed lines behind. Facing right and left (left is a mirror). Up and down facings are later |
| Read vs the Watch Coach at 320 | `cruiser_vs_watch_coach.png`: the Coach is about 30 x 30 and square on two big wheels with a lantern on top; the Cruiser is 44 x 13 (3.4:1), wheel-less, lit from below. In silhouette one is a box on legs, the other a flat pebble. In greyscale the Coach is mid-grey and busy, the Cruiser near-black with one white nose |
| Never | a barrel, a turret, treads, a gun shape, a ram, camouflage, a number plate or any real-world police or military look |
| Moves | fixed scripted paths only (no new system, D1230): end to end on a road with a pause at each end; reduced motion parks it on frame 0 |

## 5. Air unit: the Sky Concierge (the helicopter's job)

| | |
|---|---|
| Name | **Sky Concierge** (D1221, red) |
| Job | overwatch (hovers over a square), fly-by (crosses the map), arrival (hovers with a mint pool of light on the ground under it, the "searchlight") |
| Silhouette | a flat lens, 30 x 10 visible px in a 32 x 20 cell: a white dome, the wine relay ring with six honey studs on the rim, two soot stub fins, a grey underside and a mint lens underneath. No rotors, no blades, no wings |
| Frames | hover 2 (600 ms): running lights blink left and right, the crimson beacon on top swaps with honey. Fly-by 2 (140 ms): tilted 1 px nose-down, two trail lines behind. A 1.5 px sine bob while hovering |
| Ground shadow | a 22 x 4 px soft oval (PAL `k` at 38%) on the ground point, about 2 tiles below the craft (30 px up hovering, 40 px on a fly-by). It shrinks by 2 px at the top of the bob |
| Layer | the shadow and the light pool draw under every actor; the craft draws after every NPC, the holder and the follower, so it is always on top (D1231) |
| Paths | never blocks: it adds no object to the map, and the tile under it stays walkable (tested). Hover at a fixed point; a fly-by every 9 s, 3 s across. Reduced motion: it hovers still and the fly-by is skipped |

## 6. Buildings

Four pieces, all in one exterior language: white panel walls with a soot plinth and a wine trace line, soot panel roofs with a trace, frosted strips for windows, the badge plate beside every door, and the town's faction band (soot ridge and wine band on a Glimmerwell hold; gold and green when the Keepers hold, through the existing `drawFactionBand`).

| | Glow Care (the chip clinic) | Bright Swap (the buy-back stall) | Glimmerwell Relay (the relay mast) | Fleet Bay (the vehicle depot) |
|---|---|---|---|---|
| Footprint | 6 x 3 (roof 2 rows, wall 1), flat roof | a 2 x 2 stall prop (32 x 32 art), blocks 2 cells | a 1 x 3 prop (16 x 48 art), blocks 1 cell | 7 x 4 (roof 2, wall 2), arched roof |
| Door | a deep, recessed glass door (16 x 16). Shut: "By appointment. We'll call you." (natural blocker, CHIP_SECRECY) | open counter, no door | none (a staff mast) | a 48 x 32 roll door with a honey header, slats, a crimson stop light and mint guide strips. Shut: "Fleet staff only." |
| Sign (PLACEHOLDER) | GLOW CARE · A Glimmerwell partner clinic. Members by appointment. Brighter by nature. | BRIGHT SWAP · Old oil lamps in, Glimmer lanterns out. Free! It's a partnership! | GLIMMERWELL RELAY · Keeps the lamps talking to each other. The hum is normal. | FLEET BAY · Courtesy Cruisers. Arriving where you need us. |
| Civilian (no rank) | Receptionist: white jacket, soot trim | Swap Clerk: wine apron, white trim | Mast Tech: grey overalls, soot trim, goggles | Bay Attendant: white vest, ice trim |
| Chip and Tuning | the badge plate; frosted glass; nothing inside is ever drawn | free lanterns swapped for oil lamps (canon: the lamps "count Walklings") | the relay ring and the hum ("a chipped Walkling is a relay") | the vehicles hover on the same hum |
| Keepers hold | door shuttered with a Keeper slip "CLOSED PENDING REVIEW. By order."; badge covered by a slip; the Receptionist "just answers the phone" | a cream cloth over the rack, a slip "A LAMP IS A LAMP"; the Clerk is idle | dark cap, grey studs, no blink, a slip "POWER CUT BY ORDER"; the Mast Tech enjoys "the first quiet night in a year" | the parked Cruiser is gone ("towed to the Keeper yard"), a slip on the roll door "VEHICLES HELD BY ORDER"; no vehicles in the sky or on the road |
| Glimmerwell hold | "Booked through next season"; a Waiting Local queues at the door | half the rack gone; "Half the town swapped already" | ring lit; "Signal's never been stronger" | two Cruisers out, a Sky Concierge with its light pool; two wine banners and two Comfort Lamps line the road |

**Contested (no hold yet):** the base state above. The faction band shows Glimmerwell, the Cruiser patrols, the Concierge hovers without its light pool.

## 7. Rule 10 and CHIP_SECRECY

- **Not a Lantern House:** no Glimmerwell building carries the heart lantern (`lantern_sign`, `TOWN_DOOR_ART`), and Glow Care never heals. A player who walks up to it gets a shut door, not a bed. D1225 (red) asks Vincent to confirm that a Walkling "clinic" is not read as a healing spot; the default is the cover name, the shut door and no heart.
- **Not a General Store:** Bright Swap is a stall that gives lanterns away; it has no acorn board (`+emblem`) and no shop list. Fleet Bay and the mast are not stores.
- **The shared Glimmerwell piece** is the badge plate, beside every door (D1225).
- **CHIP_SECRECY rule 1 (a)-(c):** no player line names the chip, the Tuning or an implant (the spec's test scans every line). Glow Care's door is the natural blocker for (b); any interior is Glimmer-side only and is "later". No Keeper line confirms anything (c): the Keeper slips say "review", "power cut" and "held".

## 8. Palette ledger

No new PAL keys. Every key is in `sprites.js` `PAL`.

| Use | Keys |
|---|---|
| Body, roofs, plinths, frames | `N` soot, `d` gloss, `m` panel light |
| Walls, nose band, dome, counter | `w` white, `h` grey, `K` slate |
| Skirt, ring, trace lines, canopy, banners | `V` wine, `p` canopy folds |
| Accent only (under 10% of every figure; tested) | `Q` crimson: the Cruiser's pinstripe and tail light, the Concierge beacon, the mast blink, the bay stop light |
| Marks | `y` honey: badge plates, lettering bars, studs, price tags, pads |
| Lamp glass and glow | `l` mint (art only; the lamp-glass exception in GLIMMERWELL_PALETTE §10.7) |
| Glass | `s` ice, `c` sky |
| Keeper-hold marks only | `C` cream slip, `F` writing, `G` paper edge, `J` Keeper green tape, `A` cloth |

Keeper green `g` and deep green `J` appear on no Glimmerwell piece (tested), except the Keepers' own slips.

## 9. Asset table

| Sprite | Kind | Size (px) | Frames | Palette | First story use (§10) |
|---|---|---|---|---|---|
| `gw_cruiser` | vehicle, idle | 48 x 32 (3 x 2 tiles) | 2, 700 ms; left = mirror | N d m w h s V Q l y | the crackdown |
| `gw_cruiser_move` | vehicle, moving | 48 x 32 | 2, 160 ms; left = mirror | as above, plus h speed lines | the crackdown |
| `gw_concierge` | air, hover | 32 x 20 | 2, 600 ms | w h s V y N m d l Q | the pick |
| `gw_concierge_fly` | air, fly-by | 32 x 20 | 2, 140 ms | as above | the crackdown |
| `roof_gw_panel` | tile | 16 x 16 | 1 | N d m V y | Act 2 |
| `wall_gw_panel` | tile | 16 x 16 | 1 | w h V y N d | Act 2 |
| `win_strip_gw` | window | 16 x 16 | 1 | N h w K | Act 2 |
| `door_gw_glass` | door | 16 x 16 | 1 | N d s c w V y | Act 2 |
| `door_gw_bay` | wide door | 48 x 32 | 1 | N y d m h K Q l | Act 2 |
| `gw_badge` | decal | 16 x 16 | 1 | h w y N l V | Act 2 |
| `gw_sign` | sign | 16 x 16 | 1 | m h N d y l w V | Act 2 |
| `gw_swap_stall` | prop | 32 x 32 | 1 | V p w N m d l y h | the pick (Glimmer) |
| `gw_relay_mast` | prop | 16 x 48 | 2, 900 ms | N d V y h m l w Q | Act 2 |
| `gw_banner` | prop | 16 x 32 | 1 | h w m N V p y l | the pick (Glimmer) |
| `gw_badge_slip`, `gw_door_shut`, `gw_swap_stall_shut`, `gw_relay_mast_off` | Keepers-hold props | as their base | 1 | adds C F G J A | Act 2 (Keepers) |
| looks `gw_receptionist`, `gw_swap_clerk`, `gw_mast_tech`, `gw_bay_attendant` | NPC looks | 16 x 16 | the look kit | tops w/V/h, trims N/w/s, no lanyard (D1226) | Act 2 |

All of it is engineer draft art (D1232). Pia redraws before anything goes into the story. The 5x sheet is `draft_art_sheet.png`.

## 10. Where each shows up first, and later

Nothing below is built. Each row is its own later build, after #261 and the crackdown build land, with June's lines. These are defaults for D1228 (red).

| Beat | What appears | Why there |
|---|---|---|
| **The crackdown** (POST_TRIAL_CRACKDOWN Beat 3) | Juniper flees east to 30,8, where a **Courtesy Cruiser** waits beside the rubble and glides off east (it is hidden at the rubble like her). As the Watch Coaches roll in (Beat 1), one **Sky Concierge** makes a fly-by over the square | the first sight of Glimmerwell's fleet is a getaway, not a fight: it balances the ledger (§8 there) without a clash. The Keepers bring iron; Glimmerwell is already watching from above |
| **The pick, dawn** (`fb_side_pick`; Juniper's pitch at 30,8) | a **Sky Concierge** hovers over Juniper's crew camp past the rubble with its light pool. On a Glimmer pick the result scene adds a parked **Cruiser** at the road east, a **Bright Swap** stall and two banners on Fernbrook's east road (the hold flip, D1171). On a Keepers pick the Concierge does one fly-by east and leaves | it puts the faction's look on the pick itself, the way the hold flip already does |
| **Act 2** | **Cobblecrest** after `story.quarry_bought` (already a Glimmerwell town by `factionOfMap`): a **Glimmerwell Relay** mast at the Bright Quarry and a **Fleet Bay** by the quarry road. **Glow Care** opens in the Act 2 Glimmerwell town Story picks (Cobblecrest or Brinewick, beside the depot). Keepers-hold variants show in any town the Keepers take back | Act 2 is where the chip thread starts (Hall 2: Quinn's Tuning; the Signal Review), so its buildings arrive with it |

**Later:**
- Glow Care's interior, Glimmer-side only (CHIP_SECRECY), and Fleet Bay's interior.
- The Watch Coach build itself (POST_TRIAL_CRACKDOWN §10), and a Keeper yard where held Cruisers sit.
- Cruiser up and down facings, a turning frame, and a scene step to move vehicles (with D1204's `walkAll` and prop glide).
- A sweeping searchlight for the Concierge, night running lights.
- Sounds: a hum and a soft chime. iPhone audio is red; not before Vincent.
- Region-map and town-map icons for Fleet Bay and the mast; Block News stories ("Courtesy Cruisers arrive to reassure").
- A debug-panel button for the preview (today it is the console call in §11).
- Real placements read the hold through D1191's `hold:` term, not copied strings.
- A Glimmerwell-side vehicle the holder can ride (the Lantern Coach's answer), if Story wants one.

## 11. The build in this PR (behind the flag)

| Piece | Where |
|---|---|
| Art, the preview lot, vehicle paths, open and close | `glimmer_fleet.js` (new root file, loaded before `game.js`, in the service-worker shell) |
| Hooks | `game.js`: one line in `save()` (no write while the lot is open), one in `factionOfMap` (the lot follows its chosen hold), three in `drawMap` (shadows, y-sorted Cruisers, the air layer), and the `?debug=1` API (`fleetPreview`, `fleetExit`, `fleetState`) |
| Test | `tests/glimmer_fleet.spec.js` |

**How to open it:** on a `?debug=1` page, in the console: `PixelPets.fleetPreview('split')`, `('keepers')` or `('glimmer')`. Walk the path south, or call `PixelPets.fleetExit()`, to go back.

**Why it changes nothing in normal play (D1229):**
- Without `?debug=1`, `fleetPreview` returns false, no art is installed, no map exists, and `factionOfMap('gw_preview')` is null (tested).
- The lot is built in memory only. It is never in `data/`, `MAPDATA` or a save.
- While it is open, `save()` writes nothing (tested: the stored save is byte-for-byte the same).
- Leaving puts the game state back as it was before the preview, keeps the holder where they left to, and saves once. Reloading inside the preview loads the save from before it.
- Save stays `pixelpets.save.v2`, `v` 2, no migrator, no new field (tested).
- Normal-play before and after shots at 390 and 320 are pixel-identical except the clock minute.

## 12. Shots for sign-off (rule 9: 390 and 320)

In `handoff/shots/glimmer_fleet/`:
- `normal-play-hearthmoor-{before,after}-{390,320}.png`: main vs this build, same save and spot.
- `preview-{split,glimmer,keepers}-{390,320}.png`: the lot in each hold (reduced motion, so the patrol Cruiser is parked on the road).
- `preview-motion-flyby-{390,320}.png`: motion on, the fly-by mid-crossing over the Glimmerwell hold.
- `closeup-{clinic,bay,mast,stall,concierge,cruiser}-{hold}-{390,320}.png`: the map view standing beside each piece.
- `draft_art_sheet.png`: every sprite and frame at 5x.
- `cruiser_vs_watch_coach.png`: colour, silhouette, greyscale and in-game size at 320.

## 13. Open PRs checked (Mon Nov 2, 2026, ~11:00 PM ET)

| PR | Conflicts with this PR | Game-logic findings |
|---|---|---|
| #261 (draft, Day 1 to Trial 1) | build-stamp lines in `index.html`, `version.json`, `tools/GAMEJS_MAP.txt` (regenerate). Its `drawMap` hunk ends 3 lines above this PR's hook, so `game.js` should merge cleanly; nothing else overlaps | should-fix: `sceneTails.seal1` (`data/detail_zz_day1.json:728`) has no guard, so old saves that already picked (a1, a2) hear Fen's "orchard gate" line after the pick. should-fix with #262: the new cast entry `Ash` (`data/reputation.json:22`) has no rank, so once both are in, `tests/npc_ranks.spec.js:93` fails. Notes: the three Hall holders have no `when` (Seal-1 saves meet them on a Fen rematch); `hall1`'s `npcIds` points the Glimmer save's tour card at Fen; the class rows stack two kids on one desk (copied from main) |
| #262 (rank-first names, side badge) | build-stamp lines only | no blockers. Notes: four new read-only API getters are not behind `?debug=1` (like their neighbours); `FOLD_KEYS` copies old keys at normalize (additive); `sidesShown` is now always true on purpose (D1164) |
| #264 (docs: Vincent's Trial Hall rulings) | none (no shared files) | none. It conflicts with #261 in `CHANGELOG.md` and `OPEN_DECISIONS.md` text |

Merge order advice: #264, then #262, then #261 (merge main, fix the two text hunks, give Ash a rank, restamp, rerun both generators). This PR can go before or after any of them; whichever lands second restamps (`bump_build.py`) and regenerates `GAMEJS_MAP`. It changes no data file, so `gen_mapdata.py` is not needed for it.

## 14. Decisions (D1220-D1234)

Checked with walklings-decision-ids on Mon Nov 2, 2026, ~11:00 PM ET:
- main's header says next free D1210;
- unmerged branches already hold D1210-D1219: `claude/fernbrook-plaza` D1210-D1214 and `claude/fernbrook-homes` D1215-D1219 (renumbered Tue Nov 3; #261's `OPEN_DECISIONS.md` lists both and says next free D1220);
- no branch and the design repo use D1220 or higher.
- **Reserved: D1220-D1234. Next free: D1235.**

| Id | Colour | Call | Default |
|---|---|---|---|
| D1220 | **red** (naming) | The ground vehicle's name. Alternatives: "Escort Glider", "Brightline" | **Courtesy Cruiser** |
| D1221 | **red** (naming) | The air unit's name. Alternatives: "Hover Lamp", "Glow Scout" | **Sky Concierge** |
| D1222 | **red** (naming) | The building names: Glow Care, Bright Swap, Glimmerwell Relay, Fleet Bay | As named |
| D1223 | **red** (canon) | Glimmerwell runs a fleet: vehicles that hover on the hum (no wheels, no rotors, no weapons), sent to reassure a town. A Keepers hold holds them at a Keeper yard | Yes; the hover is drawn, never explained |
| D1224 | **red** (canon, CHIP_SECRECY) | Glow Care is where the chip is fitted, implied only: a member clinic for Walklings with a shut door. Its inside is Glimmer-side only and later | Yes, as §6-§7 |
| D1225 | **red** (rule 10) | Glimmerwell buildings never carry the Lantern House heart or the store acorn; a "clinic" for Walklings never heals; the badge plate is the one piece every Glimmerwell building shares | Yes |
| D1226 | yellow | The four civilians: no rank, Glimmerwell-lock colours (tops w/V/h, trims N/w/s), no lanyard, and not on the WS-PALETTE locked list (they are not uniformed staff) | As built |
| D1227 | yellow | What changes on a Keepers or Glimmerwell hold (§6) | As §6 |
| D1228 | **red** (story placement) | First appearances: the crackdown (a Cruiser getaway for Juniper, a Concierge fly-by), the pick (a Concierge over Juniper's camp; Glimmer-pick props on the east road), Act 2 (Cobblecrest mast and bay; Glow Care in Story's Act 2 Glimmerwell town) | As §10; each is its own build |
| D1229 | green | Build behind a flag: a `?debug=1` preview lot in memory, no save writes, nothing in normal play | Built |
| D1230 | yellow | Vehicles move on fixed scripted paths in `glimmer_fleet.js`, not a new system; a scene step that moves them waits for D1204 | Built |
| D1231 | yellow | The air unit draws above everyone, never blocks, casts a shadow, and is grounded on a Keepers hold | Built |
| D1232 | green | All art is engineer draft in PAL; Pia redraws before any story placement | Drafts on the preview only |
| D1233 | green | All lines are PLACEHOLDER for June; none names the chip, the Tuning or an implant | Ship nothing to the story until June's pass |
| D1234 | yellow | `glimmer_fleet.js` (about 37 KB) loads on every page; the art installs only when the preview opens; the per-frame cost is one check | Load always (simplest, cached by the service worker). Option: load it only on `?debug=1` |

## 15. Acceptance tests (`tests/glimmer_fleet.spec.js`; 320, 375, 390)

| # | Check |
|---|---|
| T1 | Off in normal play: no preview, no state, `factionOfMap` null, the save's map unchanged, without `?debug=1` |
| T2 | Each hold builds its own lot: the objects and vehicles per §6; no two objects share a tile; nobody stands on a wall, roof or tree; the exit, every door and a neighbour of every person, sign and prop are reachable; the road is open end to end; the air units add no object and the tile under the hover is open; four civilians, no rank |
| T3 | No save write while the lot is open (byte-identical); leaving restores the state (v 2, same keys, same values apart from `last` and care decay) |
| T4 | The exit path leaves and restores the same way |
| T5 | Reduced motion: every vehicle parked on frame 0, no bob, no fly-by |
| T6 | Motion on: Cruiser A patrols end to end and turns; the fly-by crosses and ends |
| T7 | Art: PAL only; crimson under 10% of each figure; no Keeper green except the Keepers' slips; soot on every Glimmerwell piece; the Cruiser at least 40 px long, at most 16 px tall and over 2.5:1 (the Watch Coach is about 1:1) |
| T8 | Lines: 110 characters or fewer; no chip, Tuning or implant, and none of the AGENTS rule 1 words; Keeper capitalised |
| T9 | The lot fits the phone: the canvas shows at least 9 x 9 tiles at every width |
| T10 | Zero console errors in every test (`trackErrors`) |
