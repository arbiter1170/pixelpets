# GLIMMERWELL_VEHICLES_BUILDINGS: Glimmerwell's answer to the Keeper Watch Coach

Target path: `handoff/specs/GLIMMERWELL_VEHICLES_BUILDINGS.md` (PUBLIC repo; not `docs/`). **Spec and preview build in one PR.** Everything in this spec is built, but only on a debug preview lot (§11). Normal play does not change: no map, scene, save field or player flow is touched. The vehicles and buildings go into the story (§10) only after Vincent signs off the shots (§12) and rules on the red rows (§14). Player text: June's pass (drafted by Claude in June's role, Vincent to approve; D1346). The lot's lines live in `glimmer_fleet.js` `LINES`; the lines for the story placements are in §10b (text only, not built).

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
| Decision ids | D1333-D1347 (§14). Renumbered twice on Tue Nov 3, 2026: from D1220-D1234 (clashed with Design's Seals block D1210-D1242) to D1295-D1309, then from D1295-D1309 (clashed with Design's HCT and High Charity Trial Hall blocks D1295-D1311) to D1333-D1347 |

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
| Name | **Courtesy Cruiser** (D1333, red). Corporate euphemism for a show of force: it arrives "where you need us" |
| Job | show of force (parks across a square), patrol (runs the road), arrival at a scene (glides in, glow on) |
| Silhouette | long, low lozenge, 44 x 13 visible px inside a 48 x 32 cell (a 3 x 2 tile footprint; it blocks 3 cells when parked). A fastback cabin of tinted glass, a white nose band, a soot body, a wine skirt that runs to the ground, no wheels, no roof light |
| Light | a mint underglow line under the skirt; a honey "lettering" bar on the flank; a white headlamp; a crimson tail light and one crimson pinstripe |
| Frames | idle 2 (700 ms): frame 0 solid glow, frame 1 a dithered glow and a 1 px hover bob. Moving 2 (160 ms): the glow runs, a glow trail and two speed lines behind. Facing right and left (left is a mirror). Up and down facings are later |
| Read vs the Watch Coach at 320 | `cruiser_vs_watch_coach.png`: the Coach is about 30 x 30 and square on two big wheels with a lantern on top; the Cruiser is 44 x 13 (3.4:1), wheel-less, lit from below. In silhouette one is a box on legs, the other a flat pebble. In greyscale the Coach is mid-grey and busy, the Cruiser near-black with one white nose |
| Never | a barrel, a turret, treads, a gun shape, a ram, camouflage, a number plate or any real-world police or military look |
| Moves | fixed scripted paths only (no new system, D1343): end to end on a road with a pause at each end; reduced motion parks it on frame 0 |

## 5. Air unit: the Sky Concierge (the helicopter's job)

| | |
|---|---|
| Name | **Sky Concierge** (D1334, red) |
| Job | overwatch (hovers over a square), fly-by (crosses the map), arrival (hovers with a mint pool of light on the ground under it, the "searchlight") |
| Silhouette | a flat lens, 30 x 10 visible px in a 32 x 20 cell: a white dome, the wine relay ring with six honey studs on the rim, two soot stub fins, a grey underside and a mint lens underneath. No rotors, no blades, no wings |
| Frames | hover 2 (600 ms): running lights blink left and right, the crimson beacon on top swaps with honey. Fly-by 2 (140 ms): tilted 1 px nose-down, two trail lines behind. A 1.5 px sine bob while hovering |
| Ground shadow | a 22 x 4 px soft oval (PAL `k` at 38%) on the ground point, about 2 tiles below the craft (30 px up hovering, 40 px on a fly-by). It shrinks by 2 px at the top of the bob |
| Layer | the shadow and the light pool draw under every actor; the craft draws after every NPC, the holder and the follower, so it is always on top (D1344) |
| Paths | never blocks: it adds no object to the map, and the tile under it stays walkable (tested). Hover at a fixed point; a fly-by every 9 s, 3 s across. Reduced motion: it hovers still and the fly-by is skipped |

## 6. Buildings

Four pieces, all in one exterior language: white panel walls with a soot plinth and a wine trace line, soot panel roofs with a trace, frosted strips for windows, the badge plate beside every door, and the town's faction band (soot ridge and wine band on a Glimmerwell hold; gold and green when the Keepers hold, through the existing `drawFactionBand`).

| | Glow Care (the chip clinic) | Bright Swap (the buy-back stall) | Glimmerwell Relay (the relay mast) | Fleet Bay (the vehicle depot) |
|---|---|---|---|---|
| Footprint | 6 x 3 (roof 2 rows, wall 1), flat roof | a 2 x 2 stall prop (32 x 32 art), blocks 2 cells | a 1 x 3 prop (16 x 48 art), blocks 1 cell | 7 x 4 (roof 2, wall 2), arched roof |
| Door | a deep, recessed glass door (16 x 16). Shut: "By appointment. We'll call you." (natural blocker, CHIP_SECRECY) | open counter, no door | none (a staff mast) | a 48 x 32 roll door with a honey header, slats, a crimson stop light and mint guide strips. Shut: "Fleet staff only." |
| Sign (June's pass, drafted by Claude in June's role, Vincent to approve) | GLOW CARE · A Glimmerwell clinic for Walklings. Members by appointment. Brighter by nature! | BRIGHT SWAP · Old oil lamps in, Glimmer lanterns out. Free! It's a partnership! | GLIMMERWELL RELAY · Keeps the lamps talking to each other. The hum is normal. Have a bright day! | FLEET BAY · Courtesy Cruisers. Arriving where you need us. Have a bright day! |
| Civilian (no rank) | Receptionist: white jacket, soot trim | Swap Clerk: wine apron, white trim | Mast Tech: grey overalls, soot trim, goggles | Bay Attendant: white vest, ice trim |
| Chip and Tuning | the badge plate; frosted glass; nothing inside is ever drawn | free lanterns swapped for oil lamps (canon: the lamps "count Walklings") | the relay ring and the hum ("a chipped Walkling is a relay") | the vehicles hover on the same hum |
| Keepers hold | door shuttered with a Keeper slip "CLOSED PENDING REVIEW. By order."; badge covered by a slip; the Receptionist "just answers the phone" | a cream cloth over the rack, a slip "A LAMP IS A LAMP"; the Clerk is idle | dark cap, grey studs, no blink, a slip "POWER CUT BY ORDER"; the Mast Tech enjoys "the first quiet night since it went up" | the parked Cruiser is gone ("towed to the Keeper yard"), a slip on the roll door "VEHICLES HELD BY ORDER"; no vehicles in the sky or on the road |
| Glimmerwell hold | "Booked through next season"; a Waiting Local queues at the door | half the rack gone; "Half the town swapped already" | ring lit; "Signal's never been stronger" | two Cruisers out, a Sky Concierge with its light pool; two wine banners and two Comfort Lamps line the road |

**Contested (no hold yet):** the base state above. The faction band shows Glimmerwell, the Cruiser patrols, the Concierge hovers without its light pool.

## 7. Rule 10 and CHIP_SECRECY

- **Not a Lantern House:** no Glimmerwell building carries the heart lantern (`lantern_sign`, `TOWN_DOOR_ART`), and Glow Care never heals. A player who walks up to it gets a shut door, not a bed. D1338 (red) asks Vincent to confirm that a Walkling "clinic" is not read as a healing spot; the default is the cover name, the shut door and no heart.
- **Not a General Store:** Bright Swap is a stall that gives lanterns away; it has no acorn board (`+emblem`) and no shop list. Fleet Bay and the mast are not stores.
- **The shared Glimmerwell piece** is the badge plate, beside every door (D1338).
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
| looks `gw_receptionist`, `gw_swap_clerk`, `gw_mast_tech`, `gw_bay_attendant` | NPC looks | 16 x 16 | the look kit | tops w/V/h, trims N/w/s, no lanyard (D1339) | Act 2 |

All of it is engineer draft art (D1345). Pia redraws before anything goes into the story. The 5x sheet is `draft_art_sheet.png`.

## 10. Where each shows up first, and later

Nothing below is built. Each row is its own later build, after #261 and the crackdown build land, with June's lines (§10b). The placements are settled (D1341).

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

## 10b. Lines for the placements (D1341)

June's pass (drafted by Claude in June's role, Vincent to approve). **Text only: nothing here is built.** Each placement is its own later build (§10), which takes these lines into its scene steps and tests. Rules, as T8: every line 110 characters or fewer, no chip, Tuning or implant, none of the AGENTS rule 1 words, "holder", capital-K Keeper, Acorns. Speakers are the existing cast (POST_TRIAL_CRACKDOWN §3) or narration; new bodies keep role names only (a personal name is a naming call, red). Lines marked *optional* can be cut without breaking the beat. Anything that would need a new fact is an open question at the end of this section, never a line.

Voice: Glimmerwell is bright and corporate ("Brighter by nature!", "It's a partnership!", "Have a bright day!", "relocating"); the fleet is never explained, only seen and heard (D1336). Keeper text is terse and official and confirms nothing (CHIP_SECRECY rule 1 (c)). The Keeper vehicles are never named in these lines (see Q-G5).

### A. The crackdown (POST_TRIAL_CRACKDOWN Beats 1 and 3)

| Where | Speaker | Line |
|---|---|---|
| Beat 1, after 1d (both Keeper vehicles parked), as the Sky Concierge crosses the square | (narration) | Overhead, a white lens glides across the square, humming. A Sky Concierge. It doesn't stop. |
| Beat 1, after 1f (the officers are cast) (*optional*) | Officer | Glimmerwell. Eyes front. Orders. |
| Beat 3, during 3a and before the escort at 3c (Juniper reaches 30,8, after her "Brighter... somewhere else!"; see Q-G1 for the camera) | (narration) | At the rubble, a long black shell waits a hand above the road. Juniper hops in. |
| Beat 3 | Associate Juniper | (from the window) It's fine! Everything's fine! Have a bright day, Fernbrook! |
| Beat 3 | (narration) | The Courtesy Cruiser glides off past the rubble, glow on. |

### B. The pick at dawn (`fb_side_pick`; Juniper's pitch at 30,8)

| Where | Speaker | Line |
|---|---|---|
| On the walk up to 30,8 at dawn | (narration) | Past the rubble, a Sky Concierge hangs over Juniper's camp. Mint light pools under it. |
| Juniper's pitch (`story.pitch_g`), opener | Associate Juniper | See our Sky Concierge? Warm light, no curfew, nobody shut indoors. Brighter by nature! |
| Glimmer pick, the result scene (the hold flip, D1171) | (narration) | The east road brightens. A Courtesy Cruiser parks by the rubble. Wine banners go up. |
| Glimmer pick, the result scene, after her P6g line (see Q-G2) | Associate Juniper | Yay! The Bright Swap's open on the east road. Free lanterns for everyone! Have a bright day! |
| Glimmer pick, the stall sign | sign | BRIGHT SWAP · Old oil lamps in, Glimmer lanterns out. Free! It's a partnership! |
| Glimmer pick, the stall | prop | as the lot (`LINES.stall`, by hold) |
| Glimmer pick, the parked Cruiser | prop | A Courtesy Cruiser, parked by the east road. It hums. Arriving where you need us. |
| Glimmer pick, the two banners | prop | BRIGHTER BY NATURE |
| Keepers pick, the result scene | (narration) | The Sky Concierge turns and slides away east. The east road is quiet again. |
| Keepers pick, right after (*optional*; see Q-G2) | Constable Rue | (watching it go) Quiet suits Fernbrook, citizen. |

### C. Act 2: Cobblecrest's Bright Quarry, and Glow Care

After `story.quarry_bought` (Cobblecrest is already a Glimmerwell town by `factionOfMap`). On a Keepers hold every piece uses the lot's Keepers lines and slips unchanged (`LINES` `keepers`).

| Where | Speaker | Line |
|---|---|---|
| The relay mast at the Bright Quarry, sign | sign | GLIMMERWELL RELAY · Bright Quarry. Keeps the lamps talking to each other. The hum is normal. |
| The mast | prop | as the lot (`LINES.mast`, by hold) |
| A Mast Tech at the quarry (*optional*; a new body, role name only, Q-G4) | Mast Tech | New owners, new mast! Don't mind the hum. It's normal. Have a bright day! |
| The same Mast Tech, Keepers hold | Mast Tech | as the lot (`LINES.mast_tech.keepers`: "First quiet night since it went up" fits a new mast) |
| Fleet Bay by the quarry road, sign | sign | FLEET BAY · Bright Quarry. Courtesy Cruisers. Arriving where you need us. |
| The bay door | door | as the lot (`LINES.bay_door`, by hold) |
| A Bay Attendant (*optional*; a new body, role name only, Q-G4) | Bay Attendant | The quarry road gets its own Cruiser now. Nothing's wrong! We just like to reassure. |
| Glow Care, in the Act 2 Glimmerwell town (Q-G3): sign, door, Receptionist, Waiting Local | | as the lot (`LINES.clinic_sign`, `clinic_door`, `receptionist`, `queue`, by hold). No new line: the door stays shut (CHIP_SECRECY rule 1 (b)) |

### Open questions (not facts; for the Chief of Staff to number and route)

| # | Colour | Question | Default in these lines |
|---|---|---|---|
| Q-G1 | yellow | In the crackdown, does the Cruiser carry Juniper away, or only past the rubble to her crew camp? And does the camera show it (at 3c it follows the holder west to 5,6)? | Partly answered by canon: her crew camp is at 30,8 and `juniper_east` stands there from the crackdown to the pick (design `specs/POST_TRIAL_CRACKDOWN.md` §6, lines 292 and 308), so the Cruiser only takes her past the rubble. The camera is still open. The getaway plays during 3a, before the escort, with the camera panning east and back; if the build can't show it, cut the three getaway lines. Note: that spec's tone line (line 418) still says Glimmerwell in this quest is "only Juniper and her emptied stand"; D1341 now adds the Cruiser and Concierge, so Design should update it |
| Q-G2 | green | Is Juniper in the Glimmer-pick result scene to say her line, and Constable Rue in the Keepers-pick one? | Partly answered: in June's pick arc, Juniper and Tobin stand at the gate with Fen, and Juniper speaks the Glimmer result line "Welcome to the partnership, {name}!..." (P6g; design `story/drafts/PICK_ARC_OVERHAUL_2026-10-31.md` lines 214 and 225). So her line here plays after P6g and doesn't say "partnership" again. Rue is not in that scene (lines 214-226): cut Rue's line unless the build puts him there |
| Q-G3 | yellow (Story's call under D1341) | Which Act 2 town gets Glow Care (§10 leaves it to Story)? | Open. Canon notes: Act 2's towns are Brightgate (Glimmerwell's HQ, Hall 4) and Kilnmouth (Hall 5) (design `story/drafts/ACT2_BEAT_SHEET_2026-10-30.md` line 6); Cobblecrest and Brinewick are Episode 1, Halls 2 and 3 (design `STORY.md` lines 756-765). Brightgate HQ already has a planned Tuning wing behind a front desk (design `specs/CHIP_SECRECY.md` §3). Tamsin's signed line points to a "free check-up" at Cobblecrest's quarry (CHIP_SECRECY §6, slot 8). The lines are the same in any town |
| Q-G4 | red (naming) | Personal names for the four civilians and any Act 2 bodies | None: role names only (Receptionist, Swap Clerk, Mast Tech, Bay Attendant, Waiting Local), the same way the hint slots use new townsfolk (design `specs/CHIP_SECRECY.md` §7 ruling 4). At the Bright Quarry, built Clerk Mint could speak instead of a new body (design `STORY.md` line 703) |
| Q-G5 | yellow | Is the Keeper vehicle's name player-visible (POST_TRIAL_CRACKDOWN says "tanks"; §1 here says "Watch Coach")? | Still open: design D1202 (red) uses "Keeper tank" in narration as PLACEHOLDER until Vincent picks (design `specs/POST_TRIAL_CRACKDOWN.md` lines 625 and 648). "Watch Coach" appears nowhere in the design repo. These lines never name it |
| Q-G6 | yellow | The Glimmerwell Relay sign is seen on both paths. June's drafts keep "relay" out of every line that isn't Glimmer-only (design `story/drafts/CHIP_HINTS_2026-10-29.md` "Canon kept"; `ACT2_BEAT_SHEET_2026-10-30.md` line 9), because a chipped Walkling is "a relay" in game. Does the sign keep the word? | Yes: the name is settled (D1335), and CHIP_SECRECY keeps the built "RELAY HOUSE · Staff only. The hum is normal." sign as a good hint (§2, R3). No NPC line and no Keeper says "relay"; Keepers say "the lamps" (R1) |
| Q-G7 | yellow | When do the Cobblecrest mast and bay appear? `story.quarry_bought` comes in Episode 1 (design `STORY.md` line 756), but D1341 places them in Act 2, which starts at `story.ep1_end` (CHIP_SECRECY §7 ruling 7) | Open. The lines work either way ("New owners, new mast!" holds once the quarry is sold) |

## 11. The build in this PR (behind the flag)

| Piece | Where |
|---|---|
| Art, the preview lot, vehicle paths, open and close | `glimmer_fleet.js` (new root file, loaded before `game.js`, in the service-worker shell) |
| Hooks | `game.js`: one line in `save()` (no write while the lot is open), one in `factionOfMap` (the lot follows its chosen hold), three in `drawMap` (shadows, y-sorted Cruisers, the air layer), and the `?debug=1` API (`fleetPreview`, `fleetExit`, `fleetState`) |
| Test | `tests/glimmer_fleet.spec.js` |

**How to open it:** on a `?debug=1` page, in the console: `PixelPets.fleetPreview('split')`, `('keepers')` or `('glimmer')`. Walk the path south, or call `PixelPets.fleetExit()`, to go back.

**Why it changes nothing in normal play (D1342):**
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
| #261 (draft, Day 1 to Trial 1) | test merge: `CHANGELOG.md`, `OPEN_DECISIONS.md` (keep both sides) and the build stamp (`index.html`, `version.json`, `tools/GAMEJS_MAP.txt`: restamp and regenerate). `game.js` merges cleanly (its `drawMap` hunk ends 3 lines above this PR's hook) | should-fix: `sceneTails.seal1` (`data/detail_zz_day1.json:728`) has no guard, so old saves that already picked (a1, a2) hear Fen's "orchard gate" line after the pick. should-fix with #262: the new cast entry `Ash` (`data/reputation.json:22`) has no rank, so once both are in, `tests/npc_ranks.spec.js:93` fails. Notes: the three Hall holders have no `when` (Seal-1 saves meet them on a Fen rematch); `hall1`'s `npcIds` points the Glimmer save's tour card at Fen; the class rows stack two kids on one desk (copied from main) |
| #262 (rank-first names, side badge) | test merge: `BACKLOG.md` (keep both) and the build stamp. `game.js` merges cleanly | no blockers. Notes: four new read-only API getters are not behind `?debug=1` (like their neighbours); `FOLD_KEYS` copies old keys at normalize (additive); `sidesShown` is now always true on purpose (D1164) |
| #264 (docs: Vincent's Trial Hall rulings) | test merge: `CHANGELOG.md` only (keep both) | none. It conflicts with #261 in `CHANGELOG.md` and `OPEN_DECISIONS.md` text |

Merge order advice: #264, then #262, then #261 (merge main, fix the two text hunks, give Ash a rank, restamp, rerun both generators). This PR can go before or after any of them; whichever lands second keeps both sides of the doc entries, restamps (`bump_build.py`) and regenerates `GAMEJS_MAP`. It changes no data file, so `gen_mapdata.py` is not needed for it.

## 14. Decisions (D1333-D1347)

First reserved as D1220-D1234 (Mon Nov 2, 2026, ~11:00 PM ET). Those ids clash with Design's Seals block (D1210-D1242, STORY_DECISIONS v0.65), so the block was renumbered in order on Tue Nov 3, 2026 to D1295-D1309. Those clash with Design's HCT and High Charity Trial Hall blocks (D1295-D1311, STORY_DECISIONS v0.68), so the Supervisor renumbered it again in order, about 1:20 AM ET: D1295 is now D1333, through D1309, now D1347 (the first free block after Design's SEALS_BOTH_PATHS, D1323-D1332). Morgan's review proposed D1287-D1301, which collides with WARDROBE_SHOP (D1287-D1294), so it starts above that (Vincent's call).
- Checked with walklings-decision-ids over main (`af1ba3f`), every origin branch and the design repo (STORY_DECISIONS v0.67): High Charity holds D1255-D1281, the Lantern House D1282-D1286, WARDROBE_SHOP D1287-D1294.
- **Reserved: D1333-D1347. Next free: D1310.**

| Id | Colour | Call | Default |
|---|---|---|---|
| D1333 | **red** (naming) | The ground vehicle's name. Alternatives: "Escort Glider", "Brightline" | **SETTLED: yes** (**Courtesy Cruiser**; Vincent, Tue Nov 3, 2026, 7:44 AM ET) |
| D1334 | **red** (naming) | The air unit's name. Alternatives: "Hover Lamp", "Glow Scout" | **SETTLED: yes** (**Sky Concierge**; Vincent, Tue Nov 3, 2026, 7:44 AM ET) |
| D1335 | **red** (naming) | The building names: Glow Care, Bright Swap, Glimmerwell Relay, Fleet Bay | **SETTLED: yes** (As named; Vincent, Tue Nov 3, 2026, 7:44 AM ET) |
| D1336 | **red** (canon) | Glimmerwell runs a fleet: vehicles that hover on the hum (no wheels, no rotors, no weapons), sent to reassure a town. A Keepers hold holds them at a Keeper yard | **SETTLED: yes** (Yes; the hover is drawn, never explained; Vincent, Tue Nov 3, 2026, 7:44 AM ET) |
| D1337 | **red** (canon, CHIP_SECRECY) | Glow Care is where the chip is fitted, implied only: a member clinic for Walklings with a shut door. Its inside is Glimmer-side only and later | **SETTLED: yes** (Yes, as §6-§7; Vincent, Tue Nov 3, 2026, 7:44 AM ET) |
| D1338 | **red** (rule 10) | Glimmerwell buildings never carry the Lantern House heart or the store acorn; a "clinic" for Walklings never heals; the badge plate is the one piece every Glimmerwell building shares | **SETTLED: yes** (Yes; Vincent, Tue Nov 3, 2026, 7:44 AM ET) |
| D1339 | yellow | The four civilians: no rank, Glimmerwell-lock colours (tops w/V/h, trims N/w/s), no lanyard, and not on the WS-PALETTE locked list (they are not uniformed staff) | As built |
| D1340 | yellow | What changes on a Keepers or Glimmerwell hold (§6) | As §6 |
| D1341 | **red** (story placement) | First appearances: the crackdown (a Cruiser getaway for Juniper, a Concierge fly-by), the pick (a Concierge over Juniper's camp; Glimmer-pick props on the east road), Act 2 (Cobblecrest mast and bay; Glow Care in Story's Act 2 Glimmerwell town) | **SETTLED: yes** (As §10; each is its own build; Vincent, Tue Nov 3, 2026, 7:44 AM ET) |
| D1342 | green | Build behind a flag: a `?debug=1` preview lot in memory, no save writes, nothing in normal play | Built |
| D1343 | yellow | Vehicles move on fixed scripted paths in `glimmer_fleet.js`, not a new system; a scene step that moves them waits for D1204 | Built |
| D1344 | yellow | The air unit draws above everyone, never blocks, casts a shadow, and is grounded on a Keepers hold | Built |
| D1345 | green | All art is engineer draft in PAL; Pia redraws before any story placement | Drafts on the preview only |
| D1346 | green | All lines are PLACEHOLDER for June; none names the chip, the Tuning or an implant | **June's pass (drafted by Claude in June's role, Vincent to approve)**: the lot's `LINES` and §10b. Ship nothing to the story until Vincent approves the copy |
| D1347 | yellow | `glimmer_fleet.js` (about 37 KB) loads on every page; the art installs only when the preview opens; the per-frame cost is one check | Load always (simplest, cached by the service worker). Option: load it only on `?debug=1` |

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
