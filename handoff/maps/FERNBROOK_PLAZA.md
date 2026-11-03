# FERNBROOK_PLAZA: the contested plaza (D1243-D1247)

Branch `claude/fernbrook-plaza`. Data: `data/detail_zzz_fernbrook_plaza.json` (one overlay; sorts after `detail_zz_stores`). Engine: `game.js` `fbPlazaPhase` / `fbPlazaIs` (the `fbplaza:` cond prefix) and `stanceFace` / `tickStance` (the `hold`, `faceWhen`, `bangWhen` npc fields). Spec: `tests/fernbrook_plaza.spec.js`. Previews: `handoff/shots/fernbrook_plaza/`.

## Goal

Vincent (Nov 2, 2026; D1243): a plaza east of the orchard crates where Keepers and Glimmerwell holders, each with a Walkling, yell at each other over who controls Fernbrook, ringed by scared townsfolk. Before the first trial they stop and watch the Trial Hall: the Keepers root for the holder to learn from Master Fen; Glimmerwell wants Fen removed and its own lead installed. Neutral holders are told to stay out of it; the holder's own side greets and thanks them; the other side gives a cold brush-off. When the town flips, the side that lost vanishes.

## Layout (rows 10-17 replaced; x17-30 is new, x0-16 and x31 are the base rows)

Row 9 (grass verge on the road), rows 18-19, `h` and the map size (32 x 20) are unchanged, so the south-growth branch can open row 19. Tiles: `P` plaza stone, `c` gravel ring, `w` the old pond (kept, 4 x 4, as the fountain), `g` grass verge, `T` tree.

```
     x 17 18 19 20 21 22 23 24 25 26 27 28 29 30
  r10   g  P  P  P  P  P  P  P  P  P  P  P  P  T
  r11   g  P  c  c  c  c  c  c  P  P  P  P  P  g
  r12   g  P  c  w  w  w  w  c  P  P  P  P  P  g
  r13   g  P  c  w  w  w  w  c  P  P  P  P  P  g
  r14   g  P  c  w  w  w  w  c  P  P  P  P  P  g
  r15   g  P  c  w  w  w  w  c  P  P  P  P  P  g
  r16   g  P  c  c  c  c  c  c  P  P  P  P  P  g
  r17   T  P  P  P  P  P  P  P  P  P  P  P  T  g
```

Standoff: Keepers on x25 (rows 11, 13, 15) with their Walklings on x26; Glimmerwell on x29 with theirs on x28; the gap is x27. Townsfolk: Orchard Hand (27,10) north, Basket Weaver (27,17) south, Stall Hand (30,14) east, Fernbrook Elder (24,12) on the fountain ring west. Odile (27,9), fb_snack (28,16) and every B4 prop keep their tiles. Five B4 decals on new stone move to grass (`replaceObjs`, same ids): puddles (20,10) to (17,13), (28,10) to (29,9), (24,17) to (30,11), (29,15) to (30,16); leaf litter (18,16) to (17,16).

New props: lamp_post (18,10), (18,17); stone_urn (18,12), (18,15); bench_long (21,10), (21,17); banner_keeper (24,10), (24,17) while not `fbplaza:held_glimmer`; comfort_lamp (29,10), (28,17) while not `fbplaza:held_keepers`. Wild zone 2 (`{19,11,10x6}`) is dropped with `set.zones`; zone 1, the orchard `{3,11,13x7}`, is unchanged.

## Phases (`fbPlazaPhase()` in game.js; data reads `fbplaza:<phase>`)

| Phase | Read today | Notes |
|---|---|---|
| argue | before watch | sides face each other, `!` balloons, townsfolk face in |
| watch | `story.lizzy_class & !story.seal1`, or `story.heights_done & !story.seal1` | the first trial is next. On the Day 1 flow (#261) the Hall door opens after Lizzy's class and `story.heights_done` only comes after the pick, so the class is the read; `story.heights_done` stays for older saves (trialReady's read) (D1244; Morgan's review of #266, Nov 3, 2026) |
| after | `story.seal1`, no `story.side_pick_done`, no `story.crackdown` | the argument resumes; lines react to the Seal (the short gap between the Seal and the crackdown) |
| curfew | `story.seal1 & story.crackdown`, no `story.side_pick_done` | POST_TRIAL_CRACKDOWN §5 (D1200, D1207): the curfew read `story.crackdown & !story.side_pick_done`. Every plaza person and Walkling is indoors (`!fbplaza:curfew` in their `when`); lamps, benches, banners and Comfort Lamps stay. It lifts at the pick result, the same read that flips the hold |
| held_keepers | `story.side_pick_done & story.seal1 & !story.side=glimmer` | Vincent's D1171; Glimmerwell, their Walklings and Comfort Lamps vanish |
| held_glimmer | `story.side_pick_done & story.seal1 & story.side=glimmer` | Vincent's D1171; Keepers, their Walklings and banners vanish |

`fbplaza:held` matches either held phase and `fbplaza:contested` the others. No flag is written and the save gains no field. REGION_MAP / `matchHold` are not touched here: #261 built the map-hold flip (`matchHold` rules on `story.side_pick_done`, `story.seal1` and `story.side`), the same rule the held phases read.

## Engine hook (D1247)

- `hold: true`: no walk route (`wanderable`), skipped by `tickWander` (no glance, no turning to watch the holder). A talk still turns the npc to the holder (`faceKeeper`) and `endScene` turns it back.
- `faceWhen: { cond: facing, ..., else: facing }`: first passing cond picks the drawn facing (`drawObj`, debug `objPos`).
- `bangWhen: cond | [conds]` (any passes): `tickStance` pulses an `emote_bang` balloon every 2.6-4.4 s while the holder is within 7 tiles. Balloons are not motion, so reduced motion keeps them.
- Debug read: `PixelPets.fbPlazaPhase()`. Every field is inert on npcs that lack it.

## NPCs

| id | label | look / Walkling | tile | facing (argue / watch / held) | present |
|---|---|---|---|---|---|
| `fbp_constable` | Constable | officer | (25,11) | right / up / down | !fbplaza:held_glimmer |
| `fbp_sergeant` | Sergeant | captain | (25,13) | right / up / down | !fbplaza:held_glimmer |
| `fbp_cadet` | Cadet | clerk | (25,15) | right / up / down | !fbplaza:held_glimmer |
| `fbp_associate` | Associate | associate | (29,11) | left / up / down | !fbplaza:held_keepers |
| `fbp_bright_lead` | Bright Lead | glimclerk | (29,13) | left / up / down | !fbplaza:held_keepers |
| `fbp_junior_bright` | Junior Bright | holder_glimmer_set | (29,15) | left / up / down | !fbplaza:held_keepers |
| `fbp_constable_pet` | Hushlet | owl/0 | (26,11) | pet (no facing) | !fbplaza:held_glimmer |
| `fbp_sergeant_pet` | Burrowbloom | mole/1 | (26,13) | pet (no facing) | !fbplaza:held_glimmer |
| `fbp_cadet_pet` | Fetchling | fetch/0 | (26,15) | pet (no facing) | !fbplaza:held_glimmer |
| `fbp_associate_pet` | Bitlet | byte/0 | (28,11) | pet (no facing) | !fbplaza:held_keepers |
| `fbp_bright_lead_pet` | Voltwhisk | volt/1 | (28,13) | pet (no facing) | !fbplaza:held_keepers |
| `fbp_junior_bright_pet` | Filamoth | moth/1 | (28,15) | pet (no facing) | !fbplaza:held_keepers |
| `fbp_orchard_hand` | Orchard Hand | fbp_orchard_hand | (27,10) | down / up / down | always |
| `fbp_weaver` | Basket Weaver | fbp_weaver | (27,17) | up / up / down | always |
| `fbp_stall_hand` | Stall Hand | fbp_stall_hand | (30,14) | left / up / down | always |
| `fbp_elder` | Fernbrook Elder | fbp_elder | (24,12) | right / up / down | always |

Cast rows (`data/reputation.json`): the Keepers `keepers`, Glimmerwell `glimmer`, townsfolk `none`. Townsfolk looks are new, built from existing creator parts only, outside both faction palettes (D1245).

## Every line, by condition (first match wins; placeholders for Design, D1245)

### Constable (`fbp_constable`)

| Talk key | Line |
|---|---|
| `fbplaza:held_keepers` | Fernbrook's ours again, and you helped keep it. Thank you, truly. |
| `fbplaza:watch&story.side=glimmer` | Master Fen teaches anyone who knocks. Even you. Mind your manners. |
| `fbplaza:watch` | Master Fen's waiting. Listen more than you swing. You'll learn plenty. |
| `fbplaza:after` | A Seal from Master Fen, and still no side? Then stay out of this. |
| `!story.side_pick_done` | Not your quarrel, traveller. Stay out of it. |
| `story.side=glimmer` | Mint vest. We've nothing to say to you. |
| `else` | Good to see a Keeper here. Thank you for standing with Fernbrook. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Quiet square. Lovely. |
| `fbplaza:watch` | Eyes on the Hall, all of you. |
| `else` | This town is under Keeper care! |

### Sergeant (`fbp_sergeant`)

| Talk key | Line |
|---|---|
| `fbplaza:held_keepers` | The lanterns stay lit in Fernbrook. You helped. The Keepers won't forget. |
| `fbplaza:watch&story.side=glimmer` | You'll face Master Fen like anyone else. Roots first. No shortcuts. |
| `fbplaza:watch` | Go and learn from Master Fen. Roots first, then blossoms. We're with you. |
| `fbplaza:after` | You've earned Master Fen's Seal. Pick your lantern, or step back. |
| `!story.side_pick_done` | This is between the Keepers and that lot. Step back, please. |
| `story.side=glimmer` | We're busy. Take your lanyard elsewhere. |
| `else` | There's our Keeper! Thank you for helping us hold this square. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Fernbrook breathes easy now. |
| `fbplaza:watch` | Shh. The trial's soon. |
| `else` | Fernbrook was ours before your stand! |

### Cadet (`fbp_cadet`)

| Talk key | Line |
|---|---|
| `fbplaza:held_keepers` | We did it! Well, you did most of it. Thank you! |
| `fbplaza:watch&story.side=glimmer` | Master Fen's fair. Fairer than your lot, anyway. |
| `fbplaza:watch` | Learn everything Master Fen shows you. Then teach me! |
| `fbplaza:after` | You beat the Trial! But it's still not safe here. Stay back. |
| `!story.side_pick_done` | Please, it's not safe here. Stay out of it. |
| `story.side=glimmer` | Sergeant says I'm not to talk to mint vests. |
| `else` | A Keeper! Thank you for helping us hold the square. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Best shift ever. |
| `fbplaza:watch` | Is it starting? Is it starting? |
| `else` | You don't scare us! Much. |

### Associate (`fbp_associate`)

| Talk key | Line |
|---|---|
| `fbplaza:held_glimmer` | Fernbrook's on the quarterly report now, partner. Thanks for the push! |
| `fbplaza:watch&story.side=glimmer` | Go show Master Fen how a review is done. Then we bring in our own lead. |
| `fbplaza:watch` | Enjoy Master Fen while it lasts. Contracts change. |
| `fbplaza:after` | Tier 1 and no lanyard? Stay out of it till you sign, guest! |
| `!story.side_pick_done` | Nothing to see here, guest! Stay out of it, brightly. |
| `story.side=glimmer` | Partner! Thanks for helping us bring Fernbrook on board. |
| `else` | Keeper colours. Hm. Our office hours are closed. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Brighter by nature! |
| `fbplaza:watch` | Eyes on the venue, team! |
| `else` | Quarterly targets say this town is ours! |

### Bright Lead (`fbp_bright_lead`)

| Talk key | Line |
|---|---|
| `fbplaza:held_glimmer` | Fernbrook's ours, partner. You helped close the deal. Have a bright day! |
| `fbplaza:watch&story.side=glimmer` | Master Fen's had a long run. Win this, and a Bright Lead runs that Hall. |
| `fbplaza:watch` | Go on, see Master Fen. Retirement suits old roots. |
| `fbplaza:after` | A Seal holder with no employer. Stay out of it, or come talk terms. |
| `!story.side_pick_done` | This is a business discussion. Stay out of it, please and thank you. |
| `story.side=glimmer` | My favourite partner! You're why Fernbrook is nearly on our books. |
| `else` | No pitch for Keepers today. Move along. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Targets met. Smiles on. |
| `fbplaza:watch` | One review from a new Hall lead. |
| `else` | Fen's time is up. Smile, Keepers! |

### Junior Bright (`fbp_junior_bright`)

| Talk key | Line |
|---|---|
| `fbplaza:held_glimmer` | We got Fernbrook! You helped so much, partner. Lanyard high five! |
| `fbplaza:watch&story.side=glimmer` | Beat Master Fen's review, partner. Then the Hall gets a Glimmerwell lead! |
| `fbplaza:watch` | Master Fen won't be here forever. We have a shortlist. |
| `fbplaza:after` | You passed! Now stay out of it till you pick the bright side. |
| `!story.side_pick_done` | Ooh, careful! Stay out of it till the paperwork's done. |
| `story.side=glimmer` | Partner! Thanks for helping us take the square. Bright work! |
| `else` | Sorry, Keeper. My lead says no chatting with competitors. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | New town, new targets! |
| `fbplaza:watch` | Review day! So exciting! |
| `else` | Your lanterns are so last quarter! |

### Orchard Hand (`fbp_orchard_hand`)

| Talk key | Line |
|---|---|
| `fbplaza:held_keepers` | The Keepers held. The orchard can get back to picking. |
| `fbplaza:held_glimmer` | Glimmerwell runs things now. They count our apples. |
| `fbplaza:watch` | They've all stopped to watch the Hall. Strange, the quiet. |
| `else` | Every day they shout. One day they'll do worse. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Back to the apples, then. |
| `fbplaza:watch` | Everyone's watching the Hall. |
| `else` | Not again. Not in the square. |

### Basket Weaver (`fbp_weaver`)

| Talk key | Line |
|---|---|
| `fbplaza:held_keepers` | Lanterns up, shouting done. I can weave in peace. |
| `fbplaza:held_glimmer` | Quiet now. Too quiet. Mint everywhere. |
| `fbplaza:watch` | Look at them, all hoping. Whoever wins, I still weave. |
| `else` | Keep back, dear. Their Walklings are bristling. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Peace at last. Mostly. |
| `fbplaza:watch` | Who'll win, do you think? |
| `else` | Please don't fight here... |

### Stall Hand (`fbp_stall_hand`)

| Talk key | Line |
|---|---|
| `fbplaza:held_keepers` | The Keepers kept it. My stall's still mine. |
| `fbplaza:held_glimmer` | Glimmerwell says my stall is a kiosk now. |
| `fbplaza:watch` | Even the Bright Lead's gone quiet. All eyes on the Hall. |
| `else` | If they start, I'm hiding under the stall. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Business as usual. |
| `fbplaza:watch` | Shh. Look at the Hall. |
| `else` | They'll knock my crates over! |

### Fernbrook Elder (`fbp_elder`)

| Talk key | Line |
|---|---|
| `fbplaza:held_keepers` | Keepers again. Fernbrook always comes back to its lanterns. |
| `fbplaza:held_glimmer` | Glimmerwell's lamps now. Fernbrook has seen bigger storms. |
| `fbplaza:watch` | They always go quiet before a trial. The shouting comes after. |
| `else` | This square has never been this close to blows. |

| Chatter key (<= 40) | Bubble |
|---|---|
| `fbplaza:held` | Calm again. Good. |
| `fbplaza:watch` | Hush now. The Hall. |
| `else` | Mind the little ones! |

### The Walklings (narration, no speaker)

| Scene | Line |
|---|---|
| `fbp_kpet_argue` | The Walkling plants itself in front of its Keeper. It will not budge. |
| `fbp_kpet_watch` | The Walkling has turned toward the Hall, as still as its Keeper. |
| `fbp_kpet_calm` | The Walkling dozes at its Keeper's feet. The square is calm. |
| `fbp_gpet_argue` | The Walkling crackles beside its Glimmerwell lead, waiting for a signal. |
| `fbp_gpet_watch` | The Walkling dims to a polite glow. Everyone is watching the Hall. |
| `fbp_gpet_calm` | The Walkling glows steadily, logged and content. The square is calm. |

Keeper Walklings use `fbp_kpet_*`, Glimmerwell's `fbp_gpet_*`: `fbplaza:held` calm, `fbplaza:watch` watch, else argue.

## Open questions

- D1244: the phase reading ("prior to the first trial" = watch). Retarget the watch line when the Day 1 flow moves the Hall-door gate.
- D1245: labels, looks, Walkling species and every line need Design sign-off.
- D1246: Vincent sees the previews before it deploys. Row 18 was left as is for the south-growth branch.
- D1247: once slice 8b flips REGION_MAP, a Glimmerwell-held Fernbrook also counts as a Glimmerwell place for the hum and align-glow arrivals (existing systems). Building faction art (`factionOfMap`) still says keepers for Fernbrook.
- Overlap with #255 (DAY1_TRIAL1_FLOW): slice 7 (contested Fernbrook signs, props, NPC lines) may want to reuse or replace these lines; slice 8 (Hall roster) is `fb_hall_in` only and does not overlap; slice 8b (flip) owns REGION_MAP.
