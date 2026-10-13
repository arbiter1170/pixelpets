# Get to know us — Fernbrook Heights, Keepers path

The good path through Fernbrook Heights. Fen offers it after the player has met her and pledged to the Keepers, and before the Trial Hall opens. Four rooms, then the walk home. `story.heights_done` is the gate: the Hall can be offered only after the return.

The other Heights door is the Glimmerwell quest. Same district, same ending flag, different door (`story.heights_path` = `tunnels`). This file does not change that quest's cast, items, or reveals.

Tone: care, proof, bringing them home. Cozy and serious. The crates are clean. The people are careful. The Walklings are fine, and they are still not home.

## Four rooms

1. **Yard.** A tidy loading yard under the fruit shed. Wet rope, apple crates, no logo. Two lookouts block the stair with a Clinkit and a Dozmouse. It is a match, and then they pour water and step aside. A pencil scrap from Jed points down.
2. **Tunnel.** Swept planks and a water tin by every third crate. Jed, the crate clerk, tells the truth of the ring, lifts a stuck bar with the player, and hands over apple slices. He is not a Glimmerwell agent. He clerks for Mara, and he has stopped.
3. **Holding room.** Four warm crates. Tags in orchard names. Two haulers and their Walklings stand over the lids; after the match they sit and leave the wood alone. The latches open. A Pomlet hops for the daylight crack, and the others follow, whole, up toward the orchard.
4. **Den.** Mara Quill's lamplit office, one night route inked on the wall. Her Dozmouse and Clinkit face the player while Jed's Pomlet stands beside `{pet}`. She gives the route page. The lamp stays lit.

**Emotional turn.** The player comes for a rescue and finds good housekeeping. Straw, water, names in a book. Nobody down there is a monster, and the Walklings are not hurt. The turn is the latch: they are not carried, they hop toward the trees because the way is open. Mara's last line is the proof that care without a way home is only a list. The route page is how the Keepers will be early next time. Then the Hall can open, because the player has already done the thing the trial is about.

## When it plays

- After `story.met_fen`, `story.side_pick_done`, and `story.side` = `keepers`.
- Before the Trial Hall. Until `story.heights_done`, the Hall door can say that the trial waits.
- A save that already has `story.seal1` is not sent back.
- Offered at the pledge. Tobin's orchard crates can still be there. These are the other crates: night carts, no logo.
- The player may stock up and leave the Heights before the yard stair. After the stair, the rooms run in order: tunnel, holding room, den, then the yard again for Fen.
- A loss wakes the team at the Fernbrook Lantern House. Cleared rooms stay cleared. Lids that are not open yet stay shut. Nobody in a crate is worse off for the loss.

## Cast

- **Master Fen.** Offers the walk and meets the player in the grass at the end. She does not go below. Roots, noses, the kettle, the Hall last.
- **Jed.** Crate clerk inside the ring. Ink on his cuff, a pencil, a Pomlet he took the job to feed. He wanted the pay, then a nose came through a slat. He leaves latches a notch loose, shows the player the names, and in the den his Pomlet fights beside `{pet}`. He does not report to Glimmerwell. He is not a double agent. After the battle he is not a partner; he walks up into the light.
- **Mara Quill.** Broker. A coat the colour of dry paper, a lamp, a careful book. She believes water, straw, and a list are kindness. She is wrong, and she is not cruel. She does not bar the door. She slides the route page across.
- **Lookouts and haulers.** Night workers with calm, brushed partners. They lose a match and sit down. They do not speak in the scene bank. They do not touch a Walkling after the lids open.

No one is injured. Nothing is graphic. The freed Walklings are not a catch and not a battle. They hop away toward the orchard.

## What the player leaves with

- **Route page**, from Mara, after the den. Not from Jed. A key page, not a snack. Name: `Route page`. Blurb: `The night road, in Mara's hand.`
- **Apple slices**, from Jed in the tunnel: one Heal Snack, placed in his hands. A second snack on the ground would double the gift.
- Fen's green thread around the page, at the return. That is the moment `story.heights_done` becomes true.

Jed may show that the tags exist. He does not hand over the road.

## Battles

Two foes at once. People step back. Their partners do the match.

| Where | Who | Field | About |
|---|---|---|---|
| Yard | Night lookouts | Clinkit and Dozmouse, about level 8 | Before the Hall. They pour water after. |
| Holding room | Crate haulers | Clinkit and Loamlet, about levels 9 and 10 | Before any latch opens. Then they sit. |
| Den | Mara Quill, with Jed beside the player | Mara: Dozmouse and Clinkit, about level 11. Jed's Pomlet, about level 10 | The route page comes after the win. |

Forms, if the battle table needs them: Clinkit `crab/0`, Dozmouse `dormouse/0`, Loamlet `mole/0`, Pomlet `beetle/0`.

Suggested flags, in order: `story.know_us` and `story.heights_path` = `tunnels` at the offer; `story.sm_yard`; `story.sm_look` after the yard; `story.met_jed` in the tunnel; `story.sm_haul` then `story.sm_freed` in the hold (the den door waits for both); `story.sm_done` when the page is given; `story.heights_done` only on Fen's return. A small Keepers regard bump may land with the return. Nothing story-critical waits on regard.

## Line bank

Say-lines only. Each line is at most 110 characters, with no double space. The only tokens are `{name}`, `{player}`, and `{pet}`. An empty speaker is narration. Play a room's lines in order. Run the battle at the marker before the next line. Battle-screen intro, win, and lose sit under the room and use the same rules. If a battle-screen win would repeat the next scene line, speak it once.

Choice labels, if used, stay within 30 characters: `I'll go now`, `I'll stock up first`.

### Offer (before the yard)

1. ["say", "Master Fen", "{name}. You stood with us. Before any trial, get to know us."]
2. ["say", "Master Fen", "We keep by going to look. A Hall ribbon can wait until we know who is missing."]
3. ["say", "Master Fen", "Under the Heights, night carts move Walklings. Not Tobin's crates. No logo. No lamps."]
4. ["say", "Master Fen", "I will stay with the trees, in case they come home while you are still below."]
5. ["say", "Master Fen", "If a latch opens, let them hop toward the orchard. Bring me the road they were on."]
6. ["say", "Master Fen", "Stock up before the door. Snacks, a rest, a full team. The tunnel does not loop kindly."]
7. ["say", "Master Fen", "The people down there may love their own partners, and still ship someone else's."]
8. ["say", "", "Fen points up the north path. A supply crate sits in the grass before the doors."]

Again, if the player comes back unready: ["say", "Master Fen", "I'll be here. Eat, rest, and come back when {pet} is ready."]

Hall door, while `story.heights_done` is still false: ["say", "Master Fen", "The trial can wait. Walk the Heights first, and get to know what we keep."]

### Yard

1. ["say", "", "The yard smells of apples and wet rope. Unmarked crates stand in neat rows."]
2. ["say", "", "A note in Fen's hand is nailed to a post. Night carts. Crates that breathe. Bring them home."]
3. ["say", "", "Two lookouts block the stair. A Clinkit and a Dozmouse wait, brushed and calm."]
4. ["say", "", "{pet} puts an ear to a slat. Something small answers, hopeful, from the straw."]
5. ["say", "", "A slat ticks. The lookouts look tired. They still do not move."]

Battle. Then:

6. ["say", "", "When it ends, they step aside and pour water. The stair is open."]
7. ["say", "", "A pencil scrap is tucked in the rail. Keeper? Don't break the slats. Come quiet. J"]
8. ["say", "", "Cool air rises from the tunnel. Daylight stops a few steps down."]

Battle screen (speaker empty; the UI may still name the lookouts):

- intro: ["say", "", "Two partners come forward together. Take it gently."]
- win: ["say", "", "When it ends, they step aside and pour water. The stair is open."]
- lose: ["say", "", "The lookouts wait, polite. The Lantern House is back down the path."]

### Tunnel

Jed's gift is one Heal Snack at line 7. He does not give the route page.

1. ["say", "", "The tunnel is planked and swept. A water tin sits by every third crate."]
2. ["say", "Jed", "Don't shout. I'm Jed. I clerk the crates. I left that scrap, and I hoped you'd come."]
3. ["say", "Jed", "This is not Glimmerwell. No bright speech. A night road, a price, and my pencil."]
4. ["say", "Jed", "I took the pay so my Pomlet could eat. Then a nose poked a slat, and I knew the load."]
5. ["say", "Jed", "Mara calls it care. Water, straw, names in a book. She ships them anyway."]
6. ["say", "Jed", "The hold door sticks. Lift with me. It slides if you are patient, and jams if you shove."]
7. ["say", "", "The bar slides. Jed folds a cloth of apple slices into your hands."]
8. ["say", "Jed", "For {pet}, when the walk gets long. I'll walk with you as far as the den."]

Later, if the player talks to him after the crates are empty: ["say", "Jed", "The crates are empty. I'm walking them home in my head, name by name."]

### Holding room

The match comes before any latch. The hop is not a battle and not a capture.

1. ["say", "", "The hold is warm. Straw, clean water, and a thin crack of orchard daylight."]
2. ["say", "Jed", "Four crates. Pomlets, a Loamlet, a Dozmouse who snored the whole way. All fed."]
3. ["say", "", "Two haulers stand over the lids. Their Walklings are calm. The latches are still shut."]

Battle. Then:

4. ["say", "", "The match is over. They sit on the crates, and they leave the wood alone."]
5. ["say", "Jed", "The tags are orchard names. Fen could call every nose without looking down."]
6. ["say", "", "You lift the latches together. The wood opens. Straw sticks to noses, and that is all."]
7. ["say", "", "A Pomlet sneezes, looks at {pet}, and hops for the crack. The others follow, bright and whole."]
8. ["say", "Jed", "Home is up that crack. They will reach the trees before we are done with Mara."]

Battle screen (speaker empty):

- intro: ["say", "", "The lids stay shut until this match is over."]
- win: ["say", "", "You can open them. They'll sit. They won't put the bars back."]
- lose: ["say", "", "The haulers sit on the crates. The lids stay shut. The little ones stay quiet and whole."]

### Den

1. ["say", "", "Mara Quill's den is a lamplit office. Strings on a map mark one night route."]
2. ["say", "Mara Quill", "You opened my crates, {name}. They had straw, water, and names. I am careful."]
3. ["say", "Mara Quill", "A keeper cannot walk every road. I carry the ones I thought the orchard could not hold."]
4. ["say", "Jed", "They were not spare. I listed every nose. You shipped a home and called it care."]
5. ["say", "Mara Quill", "Then our Walklings can speak. Mine stand together. Jed, stand where you mean to."]
6. ["say", "", "Jed's Pomlet steps up beside {pet}. Mara's Dozmouse and Clinkit face you as a pair."]

Battle, Jed's Pomlet beside the player. Then:

7. ["say", "Mara Quill", "They were fed. They were named. They were still leaving, and I called that care."]
8. ["say", "", "Mara slides one page across the desk. The lamp stays lit. The way out stays open."]

Battle screen:

- Mara intro: ["say", "Mara Quill", "You opened my crates. They were packed with care. That is not the same as home."]
- Mara win: ["say", "Mara Quill", "Take the page. Walk it kinder than I shipped it."]
- Mara lose: ["say", "Mara Quill", "Rest. The door stays open, and so does the book."]
- Jed intro: ["say", "Jed", "I'm with you. My Pomlet knows these crates."]
- Jed win: ["say", "Jed", "They're going home. That's the whole job."]
- Jed lose: ["say", "Jed", "I'll wait by the lamp. Rest, and come back. Mara will still be at her desk."]

If the player talks to Mara after: ["say", "Mara Quill", "The lamp stays lit. The page is yours. Walk it in the daytime."]

### Return

The yard, or the orchard edge above the crack. The freed Walklings are already in the grass. Fen has come up from the trees to count them. These lines set `story.heights_done`. The Trial Hall can be offered from the last of them. Do not set that flag in the den.

1. ["say", "", "You climb into orchard light. The little ones are already nosing through the grass."]
2. ["say", "Master Fen", "I counted noses. All of them. You opened a way, and they took it themselves."]
3. ["say", "Master Fen", "Let me see the page. A night road should be walked in the afternoon, with snacks."]
4. ["say", "Master Fen", "This is how you know us, {name}. Care in the hands. Proof in the pocket. Home after."]
5. ["say", "Master Fen", "Roots first, then blossoms. You have seen the roots."]
6. ["say", "Master Fen", "The Trial Hall is open. Come when you are ready. Bring {pet}, and bring this heart."]
7. ["say", "Master Fen", "If that road fills again, we will be early. That is the work, and it is yours too."]
8. ["say", "", "Fen ties a green thread around the route page. East of the square, the Hall doors wait."]
