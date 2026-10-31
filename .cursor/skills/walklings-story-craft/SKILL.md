---
name: walklings-story-craft
description: >-
  Use when PixelPets Story (or Design) drafts or reviews Walklings narrative: an
  act outline, a scene, branching choices, a side quest, NPC voice, or lore told
  through places and props; walklings-quests owns the step format and
  walklings-wording-check the vocabulary.
---
# Walklings story craft

Walklings is an all-ages pixel RPG: holders and their Walklings travel the Amberwild, its towns, routes and Keepers. This skill is **craft** (shape, choice, voice, lore). Step format (`say`, `choice`, `if`, `setFlag`...) and line limits come from walklings-quests; wording from walklings-wording-check. Both win on conflict.

## World words (always)
- The player is a **holder**; their creature is a **Walkling**.
- **Keeper/Keepers** always capital K. Glimmerwell is the other side. Respect each faction's colour scheme in scene notes.
- Money is **Acorns**.
- **Rook is a competitor, never a rival**, in every line, note and spec (old ids like `rival1` stay ids). Fast, proud, warm underneath.
- No franchise names, borrowed genre words ("fainted", "evolve", "coins", "appeared"), or copied plots or creatures.

## 1. Act shape: branch and bottleneck (source 1)
The story spreads out (side, partner, who you helped), then meets again at fixed beats every holder reaches (a seal, a Trial Hall, an episode card); carried flags show the branches mattered. Avoid a fully branching tree (content and testing double per choice). One page per act:
1. **Want**: what the holder chases, in one line a child could repeat.
2. **Pressure**: what pushes back (a closed road, Rook getting there first, a Keeper's rule).
3. **Turn**: a midpoint reveal that changes how a place or person reads.
4. **Bottleneck**: the shared end beat plus the 1-3 flags that change how it plays.
5. **Hook**: one open question into the next act.

## 2. Scene-sized choices (source 2)
- **Confirm-twice:** opt into the bold, risky option over 2-3 beats so it feels earned.
- **Track switch:** the holder can change their mind for a few lines before it locks (good for Keepers vs Glimmerwell).
- **Scored lean:** small choices add to a counter (`inc`); the highest total picks the outcome.
- **Return-to-hub talk:** a talk menu the holder can leave and revisit, so lore is optional, not dumped.
Choice labels <= 30 chars, taps only, max 3 options. Options differ **in kind** (kind vs bold, ask vs act), not degree. Show the effect within two scenes (a changed line, a toast, an NPC who remembers).

## 3. Lore drip: let the place speak (source 3)
- Give every new place three readable props hinting at its **history**, **who lives there** and **what happens next**; tell the room packet (walklings-room-packet).
- Tiers: 1 on the critical path, said plainly once; 2 in signs, town boards, Field Notes; 3 rewards curiosity. Skipping 2 and 3 must still make sense.
- Seed two places before a reveal, then pay it off. Log every seed and payoff in the story doc.
- Props can point the holder the way forward.
- Respect CHIP_SECRECY and other Design secrecy rules on what can be said and by whom.

## 4. Character voice
Write a voice card per speaking NPC first: want, fear, one verbal habit, one thing they never say, how they talk to a child holder. Test: cover the name and you still know who speaks. Cut "as you know" exposition; let each line do two jobs (character and information). Confirm voices against Design's STORY doc, not guesses.

## 5. Quest shape
Five lines per side quest or board slip: **hook** (why care, first line), **ask** (one goal), **snag** (one obstacle or twist), **resolve** (what the holder does, by tap), **reward** (Acorns, an item, or a person who changes). Reuse known places. Every quest leaves the world a little different.

## Recipe
1. Read the current story docs and built scene steps, not memory. List open threads and seeds.
2. Draft the act page or quest card, voice cards, and needed flags (new flags only under `S.flags`; save stays `pixelpets.save.v2`, `v` 2).
3. Write lines; run walklings-wording-check and limits (`say` <= 110, ambient <= 40, choices <= 30).
4. Read aloud for an all-ages player: no peril without hope, no gore, no shaming. Losses are "worn out".
5. Raise anything every player sees through walklings-decision (story staging is red); Design signs off; hand off with the packet.

## Checklist
- [ ] Holder, Walkling, Keeper (capital K), Acorns; Rook is a competitor.
- [ ] Each branch rejoins at a named bottleneck and its flag is used again.
- [ ] Each choice differs in kind and is felt within two scenes.
- [ ] Every lore seed has a written payoff; the critical path stands without optional lore.
- [ ] Voice test passes; no line over its limit; no franchise or banned words.

## Sources (summarised, not quoted)
1. Sam Kabo Ashwell, "Standard Patterns in Choice-Based Games" (2015): https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/
2. Emily Short, "Small-Scale Structures in CYOA" (2016): https://emshort.blog/2016/11/05/small-scale-structures-in-cyoa/
3. Matthias Worch and Harvey Smith, "What Happened Here? Environmental Storytelling", GDC 2010: https://www.gdcvault.com/play/1012647 (notes: https://www.worch.com/files/gdc/What_Happened_Here_Web_Notes_Small.pdf)
- Output-section model (MIT): LVTD-LLC `game-story-world-character`, https://github.com/LVTD-LLC/skills/blob/main/plugins/game-design/skills/game-story-world-character/SKILL.md
