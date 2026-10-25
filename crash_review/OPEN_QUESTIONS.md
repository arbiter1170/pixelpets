# Open leads and questions

Leads we noticed but have not closed. They are rough, most likely first. Line numbers are on `main` at `045ffa1`.

## A. Unverified fixes

1. **#183 has never run on a real iPhone.** All the memory numbers come from desktop Playwright WebKit and Chromium. Desktop RSS (500–900 MB) is not iPhone memory, and iOS may kill on a different measure (WebContent footprint, IOSurface and canvas backing, the number of GPU-backed canvases). Is there a better proxy we can measure on the desktop?
2. **Have the crashes stopped?** No reports have come in since build 20261024-2031, but we also have no long real-phone session on record. "Copy crash info" has never been used on a phone.

## B. Memory and object counts still worth checking

3. **Other holders on screen (presence / Play together, `net.js`).** This was never measured with real other players. #183 itself names it as the next check. Does each remote holder make sprites, canvases, timers or listeners that pile up as people come and go?
4. **Sheet backing grew.** Shared sprite sheets cut the canvas count from about 2,112 to 25, but backing memory rose to about 4.6–6.1 MB. Is that a good trade on iOS? Are any sheets kept larger than needed, or kept for maps no longer on screen?
5. **18×18 icon canvases rebuilt on every open.** They are made fresh each time and dropped without `freeCanvases`:
   - `openSheet` (13433, the move sheet used after GROW UP: incident 7's path)
   - `renderBag` (12449)
   - `slotMain` (14714, party rows)
   - `shopIcon` (12554)
   - `basketPick` (8481)
   
   Each is small. WebKit reclaims canvas backing lazily, though, and object count was our best crash theory on Oct 22. `crash_growup_people.spec.js` reads flat in desktop WebKit. Is that a fair test of iOS?
6. **Keeper and face caches are unbounded on purpose** (#165 left them alone because drawing a zeroed shared canvas throws). How big can they get in a long session that meets many NPCs?
7. **Landscape and many Safari tabs.** The second player had both. Other tabs share the process memory budget. Landscape gives a different viewport and canvas sizes, and looked broken. Do canvases resize, or get rebuilt, on orientation change (`resize` handlers making new backing stores)?

## C. Audio

8. **AudioContext suspended or interrupted.** `onended` does not fire while suspended. #183 added a wall-clock deadline (`sfx.js` `sweepChains` 85, `endChain` 92). Does any path still schedule notes or connect nodes while `ac.state` is `suspended` or `interrupted`?
   - The music `schedule` (601) runs from a 100 ms `setInterval` (646) and builds against `ac.currentTime`. That stops advancing when suspended, so it should stall. Please confirm.
   - `stopTrack` (626) disconnects the old bus on a `setTimeout`, which can be throttled while hidden.
   - The `keep` silent `<audio>` element (iOS play-through-silent path, `session` ~49) is paused when hidden. Is it ever re-created?
9. **Before #184 the audio checks measured nothing**: the test save muted the game. Were any earlier "audio is flat" conclusions (#75, #141, #183) based on muted runs?

## D. Reload paths that aren't crashes

10. **Two tabs share the cloud device record** (`pixelpets.cloud`). They can each see the other as a different device and adopt each other's saves. Each adopt is a reload, limited to once per 10 minutes per tab by #164. Is that enough?
11. **No mid-battle checkpoint.** Any reload in battle loses the battle (incidents 3 and 4). Note: the save must stay v2 with additive fields only.
12. **Service worker** (`sw.js`): no `skipWaiting` since #75. Is there any path left where a new worker or a `controllerchange` reloads an open page? `ios_reload.spec.js` covers this at 320 only.
13. **Webviews.** Discord's in-app browser and Messages' Shared-with-You open the game outside a normal tab, where `pagehide`, `visibilitychange` and storage can behave differently. Do our breadcrumbs mislabel kills there?

## E. Diagnostics

14. **"crash?" can't tell a memory kill (jetsam) from a WebContent crash.** Is there any signal we can record cheaply, outside the save, to tell them apart? Some ideas:
    - `performance.memory` is not on iOS.
    - Timing of the last heartbeat versus the last tap.
    - `pp_errors` right before.
15. **`pp_diag` writes to localStorage on taps and every 5 s.** Is the write cost, or a quota error, a risk on a full origin? (`writeDiag` 443)
16. The 11:47 AM location re-ask was a **symptom** of the reload (Safari asks again on a fresh page). #182 fixed the prompt, not the reload.

## F. Already fixed, listed so you don't chase them
- The basket double YES (#185).
- The move-sheet listener leak, 11 per cycle (#181).
- Portraits recreated on every People open (#141).
