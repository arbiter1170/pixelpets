# Agent skills

Skills for this repo live here, one folder per skill. Each folder has a `SKILL.md` whose frontmatter `name` and `description` say when to use it. Read the description, then the whole skill, before editing.

| Skill | File | Use it when |
|---|---|---|
| `walklings-quests` | [walklings-quests/SKILL.md](walklings-quests/SKILL.md) | Adding or changing a side quest, town-board slip, bounty, or phone job pointer |
| `walklings-docs` | [walklings-docs/SKILL.md](walklings-docs/SKILL.md) | Updating status docs after a change, or checking that those docs still match the code |
| `walklings-qa` | [walklings-qa/SKILL.md](walklings-qa/SKILL.md) | Playing a new feature on a phone width, and adding the Playwright check that keeps the fix |
| `walklings-qa-run` | [walklings-qa-run/SKILL.md](walklings-qa-run/SKILL.md) | A scoped QA run on a named build (extends walklings-qa), including the @w1 tag, retries, scans, and the full run |
| `walklings-deploy` | [walklings-deploy/SKILL.md](walklings-deploy/SKILL.md) | Stamping, shipping and checking a deploy |
| `walklings-pr-handback` | [walklings-pr-handback/SKILL.md](walklings-pr-handback/SKILL.md) | Opening or rebasing a PR and writing the hand-back |
| `walklings-decision` | [walklings-decision/SKILL.md](walklings-decision/SKILL.md) | Raising, routing or settling a decision |
| `walklings-decision-ids` | [walklings-decision-ids/SKILL.md](walklings-decision-ids/SKILL.md) | Reserving, writing or merging a D or Q id so parallel PRs and the design repo do not collide |
| `walklings-board` | [walklings-board/SKILL.md](walklings-board/SKILL.md) | Moving Roadmap board items |
| `walklings-design-commit` | [walklings-design-commit/SKILL.md](walklings-design-commit/SKILL.md) | Checking and committing design specs |
| `walklings-wording-check` | [walklings-wording-check/SKILL.md](walklings-wording-check/SKILL.md) | Checking text for franchise or banned wording |
| `walklings-handoff-log` | [walklings-handoff-log/SKILL.md](walklings-handoff-log/SKILL.md) | Ending a session or handing off |
| `walklings-cloud-launch` | [walklings-cloud-launch/SKILL.md](walklings-cloud-launch/SKILL.md) | Launching a cloud agent to build an approved Design packet or spec |
| `walklings-cloud-review-merge` | [walklings-cloud-review-merge/SKILL.md](walklings-cloud-review-merge/SKILL.md) | Reviewing a done PR, catching it up with main, merging it, and confirming it is live |
| `walklings-key-collision-check` | [walklings-key-collision-check/SKILL.md](walklings-key-collision-check/SKILL.md) | Checking a PR that adds looks, skins or palette keys so one key is not defined in two files |
| `walklings-room-packet` | [walklings-room-packet/SKILL.md](walklings-room-packet/SKILL.md) | Writing a room reskin, layout change, palette fix or interior expansion packet |
| `walklings-skill-sync` | [walklings-skill-sync/SKILL.md](walklings-skill-sync/SKILL.md) | Copying a Walklings skill between the box library and this repo so the newer copy wins |
| `gamedev-camera-systems` | [gamedev-camera-systems/SKILL.md](gamedev-camera-systems/SKILL.md) | Building or fixing the top-down map camera (follow, deadzone, edges, door transitions, shake) |
| `gamedev-create-game-assets` | [gamedev-create-game-assets/SKILL.md](gamedev-create-game-assets/SKILL.md) | Planning, making, sourcing or checking pixel-art sprites, tiles, icons or UI art |
| `gamedev-dialogue-systems` | [gamedev-dialogue-systems/SKILL.md](gamedev-dialogue-systems/SKILL.md) | Designing or debugging NPC conversations, branching choices or dialog flags |
| `gamedev-game-ai` | [gamedev-game-ai/SKILL.md](gamedev-game-ai/SKILL.md) | Building NPC routines, wandering creatures, followers, battle opponent move choice or tile pathfinding |
| `gamedev-game-feel` | [gamedev-game-feel/SKILL.md](gamedev-game-feel/SKILL.md) | When an action works but feels flat; adding juice without touching game rules |
| `gamedev-game-ui-ux` | [gamedev-game-ui-ux/SKILL.md](gamedev-game-ui-ux/SKILL.md) | Building or fixing HUD, menus, overlays, phone apps or dialog boxes at phone widths |
| `gamedev-level-design` | [gamedev-level-design/SKILL.md](gamedev-level-design/SKILL.md) | Planning a town, route or interior layout, its pacing, gating or critical path |
| `gamedev-npc-decisions` | [gamedev-npc-decisions/SKILL.md](gamedev-npc-decisions/SKILL.md) | Choosing what an NPC, wandering creature or battle opponent does next |
| `gamedev-performance-optimization` | [gamedev-performance-optimization/SKILL.md](gamedev-performance-optimization/SKILL.md) | When the game drops frames, stutters, drains battery or loads slowly on phones |
| `gamedev-rpg-systems` | [gamedev-rpg-systems/SKILL.md](gamedev-rpg-systems/SKILL.md) | Designing or tuning pet stats, leveling, battle damage, items or reward pacing |
| `gamedev-save-systems` | [gamedev-save-systems/SKILL.md](gamedev-save-systems/SKILL.md) | Touching save/load, autosave timing, Firestore save writes or corrupt-save handling |
| `gamedev-town-chatter` | [gamedev-town-chatter/SKILL.md](gamedev-town-chatter/SKILL.md) | Adding or debugging town chatter and NPC barks picked by matching facts against rules |

The gamedev-* skills are reference only, adapted from an Apache-2.0 collection (license and notice files in this folder), and walklings-* skills and AGENTS.md win on any conflict. They never widen a packet's scope, and their code samples are illustrations, not drop-in code.

A new skill is a new folder under `.cursor/skills/` with a `SKILL.md`. Add a row to this table in the same change. Do not put skills outside this directory.

Project-wide rules live in [`AGENTS.md`](../../AGENTS.md); `CLAUDE.md` and `.clinerules` are stubs pointing to it. Do not copy skill text into AGENTS.md.

