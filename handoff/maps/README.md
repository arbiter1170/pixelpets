# Walklings map handoff (for an outside build agent)

Walklings is a mobile-first browser pixel pet/adventure game (region **Amberwild**, energy **glow**, currency **Acorns**; creatures are **Walklings**). These packets let you upgrade every map without access to the private design repo: each packet pastes the data it needs. Game repo: the Walklings repo you were given (static JS: `game.js`, `sprites.js`, `data/*.json`, `tools/`).

Files here: `AUDIT.md` / `AUDIT.csv` (every map, verdict, batch), `BUILDING_VARIETY.md` (unique look per building, used by B4–B8), `B1…B8` packets.

## 1. Batch order (priority; one PR per batch, in order)
| # | Packet | What | Depends on |
|---|---|---|---|
| 1 | `B1_rx_f4.md` | Arbiter Bay pilot 18×12 → 14×22 + engine E1/E2/E4/E5 | — |
| 2 | `B2_regenx_f1_f3.md` | Other 3 RegenX floors → 14×22, distinct accents | B1 |
| 3 | `B3_tunnels_sm.md` | 4 tunnel rooms: rock skin + dressing, same grids | B1 (E5) |
| 4 | `B4_exteriors_variety.md` | Unique exterior per building (E11) + outdoor detail on 11 towns/routes, no reshaping | B1 (E5) |
| 5 | `B5_house_interiors.md` | 9 Hearthmoor/Keeper House/Cobblecrest rooms: own skins, props | B1 (E5) |
| 6 | `B6_highcharity_interiors.md` | 14 High Charity rooms: own skins, signature props | B5 (HOUSE_SKINS) |
| 7 | `B7_mahopac_dreams.md` | Observatory + 3 dream rooms | B5 |
| 8 | `B8_new_fernbrook_rooms.md` | NEW BUILD Fernbrook Lantern House + Trial Hall | Vincent's go |
Later (no spec yet, don't start): Route 3, Brinewick, Cobblecrest cottages.

## 2. Rules (every batch)
- Original art only, no likeness to any franchise. Tiles are 16×16 text grids of PAL keys from `sprites.js` (`k p r o y l g t n b c s w h m d`; `1`–`6` skin tones for people only); `.` is transparent; no outline.
- Save keys, map ids, object ids, flags: **additive only**. Old saves load; bad tiles snap to `safe`.
- Branch `maps/<batch>` → one PR per batch. **Never push `main`** (Vincent merges). **No force-push.**
- Prefer TOUCH UP / EXPAND / graphics; no REBUILD without Vincent. No two buildings look identical.
- Settled limits: D81 Act 1 towns not reshaped; D82 portrait only for new routes; D83 RegenX = 4 rooms, bigger; D84 houses enlarged only when rebuilt; D85 size targets for new/rebuilt; D86 rx_f4 pilot; D87 tunnel rock skin; D88 ≤ 70 % one floor tile; D89 optional night tech.
- No QA pass needed (Vincent); keep `npx playwright test` green.

## 3. Map data: gen_mapdata.py
Edit `data/<file>.json` (never `data/mapdata.js`), then from the repo root:
```
python3 tools/gen_mapdata.py      # rewrites data/mapdata.js from data/*.json
```
If you add a new data file, add its name to `names` in `tools/gen_mapdata.py`.

## 4. Build stamp: bump_build.py
Before **every** commit:
```
python3 tools/bump_build.py         # stamps index.html ?v=<id>, window.BUILD, version.json
python3 tools/bump_build.py --check # must exit 0
```

## 5. Wording check
No franchise-like wording; never write the name of the classic egg-shaped virtual-pet toy brand; say Walkling(s), glow, Acorns, Keeper. Lines ≤ 110 chars. Run on your diff:
```
git diff origin/main -U0 | grep '^+' | grep -inE 'tama[g]otchi|pok[eé]|poc[k]et ?mon|digi[m]on|gotta catch|pika|trainer card|gym badge|pokeball|evolve[sd]? into' && echo "FIX WORDING" || echo "wording ok"
```
(Existing game ids such as `trainer` kinds and "Trial Gym" are fine; don't add new franchise-flavoured terms.)

## 6. PR checklist
mapdata.js regenerated · bump_build --check ok · wording ok · tests green · PR description lists maps touched, new tile/prop ids, and before/after screenshots at 320×568 and 390×844.
