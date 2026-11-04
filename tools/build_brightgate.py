#!/usr/bin/env python3
"""BRIGHTGATE_LAYOUT v0.2 (D1478-D1499, D2000-D2009, settled; rule 9 previews approved): writes data/detail_zzzzz_brightgate.json.

Run from the repo root:  python3 tools/build_brightgate.py [--layout design/specs/brightgate_layout.json]
The layout JSON lives in the private design repo (gitignored `design/` checkout); it is read, never copied in whole. Only the
grids (converted to game tiles), the placements and the player lines the packet ships (§11, all PLACEHOLDER) reach the output.

Brightgate is a new city, so nothing is kept or moved (unlike tools/build_hc_city.py): five outdoor chunks (Gate Plaza
`brightgate`, the Campus `bg_campus`, the Lamp Works `bg_works`, Old Wick `bg_oldtown`, Partner Row `bg_partner`) and the
rooms this build has. The output is a normal map-pass overlay (zzzzz: after every other one), so the maps are in MAPDATA and
save.js sizes them; no warp outside the city leads in yet (the Act 2 route or coach link is its own packet), so normal play
never reaches it. `?debug=1` has three places (game.js DEBUG_EXTRAS).

Exits non-zero if a check fails. The checks are the packet's §13 item 1 ported onto the game data: chunk sizes and the town cap,
mouths paired both ways at the same width, every door under a facade on a walk tile, every door and mouth reachable from the
arrival with every blocker standing, no one-wide choke, patrol legs straight on walk tiles off doors and mouths, Cruiser lanes
east-west on the lane, stands on bays, rule 10's markers on the settled cells (D613/D615) and inside the arrival view at 390 and
320, every R/H cell in exactly one building entry, room walls closed but the mat, all room floor reachable, line limits, banned
words, CHIP_SECRECY words, "relay" on signs only (D1446), no "mint" (D1434), and no mint `l` key in any Brightgate art name.
tests/brightgate.spec.js runs the same checks again on the composed world in the browser.
"""
import argparse, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'detail_zzzzz_brightgate.json')
fails, notes = [], []
def fail(msg): fails.append(msg)
def note(msg): notes.append(msg)

ap = argparse.ArgumentParser()
ap.add_argument('--layout', default=os.path.join(ROOT, 'design', 'specs', 'brightgate_layout.json'))
args = ap.parse_args()
if not os.path.exists(args.layout):
    sys.exit('layout JSON not found: ' + args.layout + ' (clone the design repo to design/ or pass --layout)')
L = json.load(open(args.layout))
if L.get('spec') != 'BRIGHTGATE_LAYOUT v0.2': fail('layout is ' + str(L.get('spec')) + ', this tool builds v0.2')

# ---------- tiles: the blockout legend (§3.3) to game map chars. New chars are free in the merged table (checked below). ----------
TILES = {
    'I': {'name': 'panel paving', 'walk': True},       # blockout P (B05); the game's P is High Charity's plaza stone
    'L': {'name': 'glide lane', 'walk': True},         # blockout L (B01)
    'x': {'name': 'glide crossing', 'walk': True},     # blockout Z (B03); the city preview's Z is its crosswalk
    'J': {'name': 'planter kerb', 'walk': False},      # blockout K (B02); the game's K is Cobblecrest's rock face
    'b': {'name': 'Cruiser stand bay', 'walk': False}, # blockout U (B04)
    'o': {'name': 'cobbles', 'walk': True},            # blockout o (B06), Old Wick
    'd': {'name': 'setts', 'walk': True},              # blockout S (B37), the Lamp Works; the game's S is a stair
    'O': {'name': 'rail on setts', 'walk': True},      # blockout Y (B38); the game's Y is the Keeper pilaster
    'G': {'name': 'company fence', 'walk': False},     # blockout F (B07)
    'V': {'name': 'Concierge pad', 'walk': True},      # blockout A (B08)
    'N': {'name': 'clipped hedge', 'walk': False},     # blockout T, the city's edge: the built tree tile carries mint highlights (D2000)
    '&': {'name': 'flowerbed', 'walk': True},          # blockout f, a company flowerbed with no mint
}
LEGEND = {'T': 'N', 'g': 'l', 'P': 'I', 'o': 'o', 'L': 'L', 'Z': 'x', 'K': 'J', 'U': 'b', 'R': 'R', 'H': 'H', 'w': 'w',
          'F': 'G', 'A': 'V', 'D': 'D', 'f': '&', 'S': 'd', 'Y': 'O'}   # g -> Route 4's mown lawn l (no mint; D2000)
TAKEN = set('TwtgpfRHFsB#W.=m^KcPDA:Xuvi,;qjYz~_ESeanrkQyhlCZUM')   # every char the merged table (and the city preview) defines
for ch in TILES:
    if ch in TAKEN: fail(f'tile char {ch!r} is already defined in the game')
WALK = set('l&IoLxVDdO')
RWALK = set('.=m')

# ---------- PLACEHOLDER copy: the packet's §11 lines (Story signs them). say 110, toast 40. ----------
HOOKS = {h['id']: h for c in L['chunks'] for h in c['hooks']}
def hook(i): return HOOKS[i]['text']
TXT = {
    'residents': hook('bh_flats'),                         # "Residents only. Have a bright day!"
    'staff': hook('bh_annex'),                             # "Staff only. Have a bright day!"
    'works': hook('bh_works'),                             # "Day shift only. Have a bright day!"
    'fleet': hook('bh_fleet'),                             # "Fleet staff only."
    'gala': hook('bh_gala'),                               # "Closed for an event. Have a bright day!"
    'glowcare': hook('bh_glowcare'),                       # "By appointment. We'll call you."
    'wickshop': hook('bh_wickshop'),                       # "Closed. Lanterns are free at the Plaza now."
    'academy': 'Term starts soon. Have a bright day!',     # §3.4 (Junior Bright School's facade line)
    'closed': 'Closed for now.',                           # the built PLACEHOLDER facade line (tools/build_hc_city.py), for a room its packet has not drawn
    'shuttle': '[PLACEHOLDER] The shuttle stop. No shuttle runs from here yet.',   # bg_south: the region map link is not built (no fast travel)
    'store_clerk': '[PLACEHOLDER] Welcome to Bright Mart! Everything at partner price.',
    'store_clerk_name': 'Bright Mart clerk',
    'host_name': 'Lantern Host',
    'clock': '[PLACEHOLDER] A wall clock. It ticks.',
}
DISTRICT = {'brightgate': 'GATE PLAZA', 'bg_campus': 'THE CAMPUS', 'bg_works': 'THE LAMP WORKS', 'bg_oldtown': 'OLD WICK',
            'bg_partner': 'PARTNER ROW'}
NAME = {'brightgate': 'Brightgate', 'bg_campus': 'Brightgate', 'bg_works': 'Brightgate', 'bg_oldtown': 'Brightgate', 'bg_partner': 'Brightgate'}

# ---------- helpers (as tools/build_hc_city.py) ----------
def nbrs(x, y, w, h):
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h: yield nx, ny

def reach(grid, start, blocked=frozenset(), walk=WALK):
    h, w = len(grid), len(grid[0]); seen = {start}; q = [start]; i = 0
    while i < len(q):
        x, y = q[i]; i += 1
        for n in nbrs(x, y, w, h):
            if n in seen or n in blocked or grid[n[1]][n[0]] not in walk: continue
            seen.add(n); q.append(n)
    return seen

def articulation(grid, root, blocked, walk=WALK):
    h, w = len(grid), len(grid[0]); ok = lambda u: grid[u[1]][u[0]] in walk and u not in blocked
    disc, low, parent, kids, aps, t = {root: 0}, {root: 0}, {root: None}, {root: 0}, set(), 0
    stack = [(root, iter(list(nbrs(*root, w, h))))]
    while stack:
        v, it = stack[-1]
        for u in it:
            if not ok(u): continue
            if u not in disc:
                t += 1; disc[u] = low[u] = t; parent[u] = v; kids[u] = 0; kids[v] += 1
                stack.append((u, iter(list(nbrs(*u, w, h))))); break
            elif u != parent[v]: low[v] = min(low[v], disc[u])
        else:
            stack.pop()
            if stack:
                p = stack[-1][0]; low[p] = min(low[p], low[v])
                if parent[p] is not None and low[v] >= disc[p]: aps.add(p)
    if kids[root] > 1: aps.add(root)
    return aps

def legs(route):
    cells = []
    for (x0, y0), (x1, y1) in zip(route, route[1:] + ([route[0]] if len(route) > 2 else [])):
        for x in range(min(x0, x1), max(x0, x1) + 1):
            for y in range(min(y0, y1), max(y0, y1) + 1): cells.append((x, y))
    return cells

VIEWS = {'390': (12.2, 26.4), '320': (10.0, 17.75)}
def cam(w, h, arr, vw, vh):   # the built follow camera at the arrival, clamped to the map (the packet's checker)
    ax, ay = arr
    return max(0, min(w - vw, ax + 0.5 - vw / 2)), max(0, min(h - vh, ay + 0.5 - vh * 0.75))

class Chunk:
    def __init__(self, c):
        self.id, self.w, self.h, self.src = c['id'], c['w'], c['h'], c
        raw = [list(r) for r in c['grid']]
        if len(raw) != self.h or any(len(r) != self.w for r in raw): fail(f'{self.id}: grid is not {self.w}x{self.h}')
        g = [[LEGEND.get(ch, ch) for ch in r] for r in raw]
        for y in range(self.h):            # a mouth cell X takes the walk char of its inward neighbour
            for x in range(self.w):
                if raw[y][x] != 'X': continue
                ix = 1 if x == 0 else self.w - 2 if x == self.w - 1 else x
                iy = 1 if y == 0 else self.h - 2 if y == self.h - 1 else y
                g[y][x] = g[iy][ix] if g[iy][ix] in WALK else 'I'
        bad = {ch for r in g for ch in r if ch not in WALK and ch not in 'NRHJbwG'}
        if bad: fail(f'{self.id}: unmapped chars {sorted(bad)}')
        self.grid = [''.join(r) for r in g]
        self.arrival = tuple(c['arrival'])
        self.objs, self.ids, self.block, self.reserved, self.targets = [], set(), {}, set(), {}

    def ch(self, x, y): return self.grid[y][x] if 0 <= x < self.w and 0 <= y < self.h else 'N'
    def walk(self, x, y): return self.ch(x, y) in WALK
    def add(self, o, blocks=None):
        if o['id'] in self.ids or o['id'] in ALL_IDS: fail(f"{self.id}: duplicate id {o['id']}")
        self.ids.add(o['id']); ALL_IDS.add(o['id']); self.objs.append(o)
        if blocks is None: blocks = o['kind'] in ('npc', 'sign', 'prop') and self.walk(o['x'], o['y'])
        if blocks: self.block[(o['x'], o['y'])] = o['id']
        return o
    def free(self, x, y): return self.walk(x, y) and (x, y) not in self.block and (x, y) not in self.reserved
    def safe_block(self, x, y):
        if not self.free(x, y): return False
        seen = reach(self.grid, self.arrival, frozenset(self.block) | {(x, y)})
        return all(p in seen for p in self.targets.values())
    def place_near(self, x, y, r=4):
        for _, dy, dx in sorted((abs(dx) + abs(dy), dy, dx) for dx in range(-r, r + 1) for dy in range(-r, r + 1)):
            nx, ny = x + dx, y + dy
            if not self.safe_block(nx, ny): continue
            b = frozenset(self.block) | {(nx, ny)}; t = set(self.targets.values())
            if any(any(p not in reach(self.grid, self.arrival, b | {a}) for p in t) for a in articulation(self.grid, self.arrival, b) - t - {self.arrival}):
                continue
            if not any(self.free(a, c) for a, c in nbrs(nx, ny, self.w, self.h)): continue
            return nx, ny
        return None

ALL_IDS = set()
CH = {c['id']: c for c in L['chunks']}
CHUNKS = {cid: Chunk(c) for cid, c in CH.items()}
for c in CHUNKS.values():
    if c.w > 64 or c.h > 48: fail(f'{c.id}: {c.w}x{c.h} over the 64x48 town cap')
    if not c.walk(*c.arrival): fail(f'{c.id}: arrival not walkable')
if sum(c.w * c.h for c in CHUNKS.values()) != 13568: fail('outdoor area is not 13,568 tiles (High Charity v0.4)')

# ---------- buildings: one roof-kit entry per door box (or the R/H block over the door), then the rest split into rectangles ----------
KIT = {   # §3.2 identity per district; PAL keys only; the fleet's panel pieces for the company, Old Wick's own kit for the old town
    'gw':      {'roof': 'roof_gw_panel', 'wall': 'wall_gw_panel', 'door': 'door_gw_glass', 'win': 'win_strip_gw', 'trim': 'V', 'shape': 'flat'},
    'gw_hq':   {'roof': 'roof_gw_panel', 'wall': 'wall_glass', 'door': 'door_gw_glass', 'win': 'win_strip_gw', 'trim': 'V', 'shape': 'flat+mast'},
    'works':   {'roof': 'roof_gw_panel', 'wall': 'wall_panel_m', 'door': 'door_sliding', 'win': 'win_band', 'trim': 'y', 'shape': 'flat'},
    'partner': {'roof': 'roof_gw_panel', 'wall': 'wall_concrete', 'door': 'door_gw_glass', 'win': 'win_square', 'trim': 'N', 'shape': 'flat'},
    'old':     {'roof': 'roof_bg_terracotta', 'wall': 'wall_bg_cream', 'door': 'door_step_warm', 'win': 'win_lamp', 'trim': 'G', 'shape': 'steep'},
    'hall':    {'roof': 'roof_bg_terracotta', 'wall': 'wall_bg_cream', 'door': 'door_heavy', 'win': 'win_slit', 'trim': 'y', 'shape': 'steep+vane'},
    'store':   {'roof': 'roof_gw_panel', 'wall': 'wall_white', 'door': 'door_gw_glass', 'win': 'bg_awning', 'trim': 'V', 'shape': 'flat'},
    'wing':    {'roof': 'roof_gw_panel', 'wall': 'wall_panel_m', 'trim': 'N', 'shape': 'flat'},
}
DISTRICT_KIT = {'brightgate': 'gw', 'bg_campus': 'gw', 'bg_works': 'works', 'bg_oldtown': 'old', 'bg_partner': 'partner'}
DOOR_KIT = {'bg_lantern': 'old', 'bg_store': 'store', 'bg_hq': 'gw_hq', 'bg_hall': 'hall'}

def rects(cells):
    """Split a set of cells into rectangles: take the top-left cell, run right, then grow down while the whole run is in."""
    left, out = set(cells), []
    while left:
        x0, y0 = min(left, key=lambda p: (p[1], p[0]))
        x1 = x0
        while (x1 + 1, y0) in left: x1 += 1
        y1 = y0
        while all((x, y1 + 1) in left for x in range(x0, x1 + 1)): y1 += 1
        out.append((x0, y0, x1, y1))
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): left.discard((x, y))
    return out

def component(c, x, y):
    if c.ch(x, y) not in 'RH': return set()
    seen, st = {(x, y)}, [(x, y)]
    while st:
        a, b = st.pop()
        for n in nbrs(a, b, c.w, c.h):
            if n not in seen and c.ch(*n) in 'RH': seen.add(n); st.append(n)
    return seen

roofs = {cid: {} for cid in CHUNKS}
for cid, c in CHUNKS.items():
    owned = {}
    def entry(name, box, kit):
        x0, y0, x1, y1 = box
        cells = {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}
        if any(c.ch(*p) not in 'RH' for p in cells): fail(f'{cid}: building {name} {box} is not all roof and facade')
        for p in cells:
            if p in owned: fail(f'{cid}: building {name} overlaps {owned[p]} at {p}')
            owned[p] = name
        rr = [y for y in range(y0, y1 + 1) if c.ch(x0, y) == 'R']
        if not rr: fail(f'{cid}: building {name} has no roof row'); return
        roofs[cid][name] = dict(KIT[kit], x0=x0, y0=y0, x1=x1, y1=max(rr))
    for d in c.src['doors']:
        did, x, y = d['id'], d['x'], d['y']
        if not c.walk(x, y): fail(f'{cid}: door {did} tile not walkable')
        if c.ch(x, y - 1) != 'H': fail(f'{cid}: door {did} has no facade above')
        box = d.get('box')
        if not box:
            comp = component(c, x, y - 1)
            xs, ys = [p[0] for p in comp], [p[1] for p in comp]
            box = [min(xs), min(ys), max(xs), max(ys)]
            if len(comp) != (box[2] - box[0] + 1) * (box[3] - box[1] + 1): fail(f'{cid}: the block over {did} is not a rectangle')
        if not (box[0] <= x <= box[2] and y == box[3] + 1): fail(f'{cid}: door {did} {(x, y)} is not under its building {box}')
        entry(did[3:], tuple(box), DOOR_KIT.get(did, DISTRICT_KIT[cid]))
        c.reserved.add((x, y)); c.targets['door:' + did] = (x, y)
    rest = {(x, y) for y in range(c.h) for x in range(c.w) if c.ch(x, y) in 'RH' and (x, y) not in owned}
    k = 0
    for box in sorted(rects(rest), key=lambda b: (b[1], b[0])):
        kit = 'wing' if cid == 'bg_campus' and box[1] < 16 and box[0] >= 49 else DISTRICT_KIT[cid]
        if cid == 'bg_works' and box[0] >= 50 and box[1] >= 36: kit = 'wing'   # the first Calm Tower's base (B26 is a prop later)
        entry(f'block_{k}', box, kit); k += 1

# ---------- doors: every packet door, its room or its shut line (§5.4, §11) ----------
SHUT = {   # door id -> deny line; `need` names a flag nothing sets, the city preview's pattern (story.hc_no_room)
    'bg_flats_a': TXT['residents'], 'bg_flats_b': TXT['residents'], 'bg_welcome': TXT['closed'],
    'bg_hq': TXT['closed'], 'bg_gala': TXT['gala'], 'bg_glowcare': TXT['glowcare'],
    'bg_annex_a': TXT['staff'], 'bg_annex_b': TXT['staff'], 'bg_lampworks': TXT['works'], 'bg_fleetbay': TXT['fleet'],
    'bg_census': TXT['closed'], 'bg_hall': TXT['closed'], 'bg_old_a': None, 'bg_old_b': None, 'bg_odell': TXT['closed'],
    'bg_wickshop': TXT['wickshop'], 'bg_academy': TXT['academy'], 'bg_showhome': None,
}
for h in 'abcdefghij': SHUT['bg_home_' + h] = TXT['residents']
ROOM_DOOR = {'bg_lantern': ('bg_lantern_in', 6, 12), 'bg_store': ('bg_store_in', 5, 7)}
for cid, c in CHUNKS.items():
    for d in c.src['doors']:
        did = d['id']
        o = {'kind': 'door', 'id': did, 'x': d['x'], 'y': d['y']}
        if did in ROOM_DOOR:
            rid, tx, ty = ROOM_DOOR[did]; o.update({'to': rid, 'tx': tx, 'ty': ty, 'facing': 'up'})
        elif did in SHUT:
            o['need'] = 'story.bg_no_room'
            if SHUT[did]: o['deny'] = SHUT[did]
        else: fail(f'{cid}: door {did} has neither a room nor a shut line')
        c.add(o, blocks=False)

# ---------- mouths: five warps per mouth to the same offset in the partner, one tile inward, facing away from the edge ----------
def mouth_cells(c, m):
    a, b = m['span']
    return [{'N': (t, 0), 'S': (t, c.h - 1), 'W': (0, t), 'E': (c.w - 1, t)}[m['edge']] for t in range(a, b + 1)]
INWARD = {'N': (0, 1, 'down'), 'S': (0, -1, 'up'), 'W': (1, 0, 'right'), 'E': (-1, 0, 'left')}
for cid, c in CHUNKS.items():
    for m in c.src['mouths']:
        if m.get('warp_obj'):   # bg_south: the walk-on warp back out. No region-map link is built (no fast travel; the Act 2 route is its own packet)
            x, y = m['warp_obj']
            c.add({'kind': 'prop', 'id': 'bg_south', 'x': x, 'y': y, 'sprite': 'road_bar', 'name': 'the shuttle bar', 'lines': {'else': TXT['shuttle']}}, blocks=False)
            c.reserved.add((x, y)); continue
        part = CHUNKS.get(m['to']); pm = [q for q in (part.src['mouths'] if part else []) if q['id'] == m['to_mouth']]
        if not pm or pm[0]['to'] != cid: fail(f"{cid}: mouth {m['id']} has no matching partner"); continue
        mine, theirs = mouth_cells(c, m), mouth_cells(part, pm[0])
        if len(mine) != len(theirs): fail(f"{cid}: mouth {m['id']} width differs from {m['to_mouth']}"); continue
        dx, dy, face = INWARD[pm[0]['edge']]
        for i, ((x, y), (px, py)) in enumerate(zip(mine, theirs)):
            if not c.walk(x, y): fail(f'{cid}: mouth cell {(x, y)} not walkable')
            if not part.walk(px + dx, py + dy): fail(f"{cid}: mouth {m['id']} lands on a solid tile {(px + dx, py + dy)} in {m['to']}")
            c.add({'kind': 'warp', 'id': f"{m['id']}_{i}", 'x': x, 'y': y, 'to': m['to'], 'tx': px + dx, 'ty': py + dy, 'facing': face}, blocks=False)
            c.reserved.add((x, y))
        c.targets['mouth:' + m['id']] = mine[len(mine) // 2]
    c.reserved.add(c.arrival)
    # every border cell is a tree, a building or a mouth
    mouth = {(o['x'], o['y']) for o in c.objs if o['kind'] == 'warp'}
    for x in range(c.w):
        for y in (0, c.h - 1):
            if c.walk(x, y) and (x, y) not in mouth and (x, y) not in c.reserved: fail(f'{cid}: border open at {(x, y)}')
    for y in range(c.h):
        for x in (0, c.w - 1):
            if c.walk(x, y) and (x, y) not in mouth: fail(f'{cid}: border open at {(x, y)}')

# ---------- patrol legs and stand bays are checked now (the bodies arrive in the dressing slice) ----------
for cid, c in CHUNKS.items():
    for pt in c.src['patrols']:
        route = [tuple(p) for p in pt['route']]
        for (x0, y0), (x1, y1) in zip(route, route[1:] + ([route[0]] if len(route) > 2 else [])):
            if x0 != x1 and y0 != y1: fail(f"{cid}: patrol {pt['id']} leg not straight")
            if pt.get('kind') == 'cruiser' and x0 == x1: fail(f"{cid}: cruiser {pt['id']} runs north-south")
        for p in legs(route):
            if not c.walk(*p): fail(f"{cid}: patrol {pt['id']} crosses solid {p}")
            if pt.get('kind') == 'cruiser' and c.ch(*p) not in 'Lx': fail(f"{cid}: cruiser {pt['id']} leaves the lane at {p}")
            if p in c.targets.values(): fail(f"{cid}: patrol {pt['id']} stands on a door or mouth {p}")
        c.reserved.update(legs(route))
    bays = sum(row.count('b') for row in c.grid)
    if bays != sum((p['bay'][2] - p['bay'][0] + 1) * (p['bay'][3] - p['bay'][1] + 1) for p in c.src['posts']): fail(f'{cid}: stand bay cells without a stand row')
    for p in c.src['posts']:
        x0, y0, x1, y1 = p['bay']
        if any(c.ch(x, y) != 'b' for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)): fail(f"{cid}: stand {p['id']} not on a bay")

# ---------- rule 10 (§3.5, D613/D615, D2001): the markers on the settled cells, both in the arrival view at 390 and 320 ----------
GP = CHUNKS['brightgate']
LMK = {l['id']: (l['x'], l['y']) for l in GP.src['landmarks']}
rule10 = [d for d in GP.src['doors'] if d.get('rule10')]
if sorted(d['rule10'] for d in rule10) != ['lantern', 'store']: fail('brightgate: rule 10 needs one Lantern House and one General Store')
for d in rule10:
    want = (d['x'] - 1, d['y'] - 1) if d['rule10'] == 'lantern' else (d['x'] + 1, d['y'] - 1)
    if LMK.get(d['marker']) != want: fail(f"brightgate: {d['id']} marker not on the settled cell {want}")
    if GP.ch(*want) != 'H': fail(f"brightgate: {d['id']} marker {want} is not on the facade")
    for vname, (vw, vh) in VIEWS.items():
        x0, y0 = cam(GP.w, GP.h, GP.arrival, vw, vh)
        for what, (px, py) in (('door', (d['x'], d['y'])), ('marker', want)):
            if not (x0 <= px and px + 1 <= x0 + vw and y0 <= py and py + 1 <= y0 + vh): fail(f"brightgate: {d['id']} {what} outside the arrival view at {vname}")
    sid = 'bg_lantern_sign' if d['rule10'] == 'lantern' else 'bg_store_board'
    GP.add({'kind': 'prop', 'id': sid, 'x': want[0], 'y': want[1], 'sprite': 'heal_lantern' if d['rule10'] == 'lantern' else 'acorn_board'}, blocks=False)
    roofs['brightgate'][d['id'][3:]]['porch'] = [sid]

# ---------- signs: the town sign (T2) and a district signpost one tile inside every mouth (§6.2) ----------
GP.add({'kind': 'sign', 'id': 'bg_sign_town', 'x': LMK['lm_bg_sign'][0], 'y': LMK['lm_bg_sign'][1], 'sprite': 'signpost', 'text': hook('bh_sign')})
TO_NAME = dict(DISTRICT)
for cid, c in CHUNKS.items():
    for m in c.src['mouths']:
        if m.get('warp_obj'): continue
        cells = mouth_cells(c, m); dx, dy, _ = INWARD[m['edge']]
        sx = cells[-1][0] + (1 if m['edge'] in 'NS' else 0) + dx
        sy = cells[-1][1] + (1 if m['edge'] in 'WE' else 0) + dy
        spot = c.place_near(sx, sy, r=4)
        if not spot: fail(f"{cid}: no tile for the {m['id']} signpost"); continue
        c.add({'kind': 'sign', 'id': f"bg_post_{m['id']}", 'x': spot[0], 'y': spot[1], 'sprite': 'signpost',
               'text': f"{DISTRICT[cid]} · This way: {TO_NAME[m['to']]}."})

# ---------- final outdoor checks: every door and mouth reachable with every blocker standing; no one-wide choke ----------
for cid, c in CHUNKS.items():
    blocked = frozenset(c.block)
    seen = reach(c.grid, c.arrival, blocked)
    for k, p in c.targets.items():
        if p not in seen: fail(f'{cid}: {k} at {p} not reachable from the arrival')
    tcells = set(c.targets.values())
    for apc in sorted(articulation(c.grid, c.arrival, blocked) - tcells - {c.arrival}):
        cut = reach(c.grid, c.arrival, blocked | {apc})
        lost = [k for k, p in c.targets.items() if p not in cut]
        if lost: fail(f'{cid}: one-wide choke at {apc} strands {lost}')
    covered = set()
    for r in roofs[cid].values():
        for yy in range(r['y0'], r['y1'] + 1):
            for xx in range(r['x0'], r['x1'] + 1): covered.add((xx, yy))
    for y in range(c.h):
        for x in range(c.w):
            if c.ch(x, y) == 'R' and (x, y) not in covered: fail(f'{cid}: roof cell {(x, y)} has no building entry')
    if len(c.objs) > 240: fail(f'{cid}: {len(c.objs)} objects over the 240 budget (§6.4)')
    people = sum(1 for o in c.objs if o['kind'] == 'npc')
    if people > 24: fail(f'{cid}: {people} people over the 24 budget (§6.4)')
    print(f"{cid} {c.w}x{c.h} buildings={len(roofs[cid])} objects={len(c.objs)} people={people}")

# ---------- rooms ----------
def from_packet(r):
    """A designed room grid (§7 legend) to game tiles: # wall, W the north wall's face (row 0 over the floor), . floor, m the mat.
    Furniture letters become floor under a prop object, so each piece keeps its own art and line."""
    g = [list(row) for row in r['grid']]
    h, w = len(g), len(g[0]); out = [['#'] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            ch = g[y][x]
            if ch == '#': out[y][x] = 'W' if y == 0 and 0 < x < w - 1 and g[1][x] != '#' else '#'
            elif ch == '=' and [x, y] == r['mat']: out[y][x] = 'm'
            else: out[y][x] = '.'
    return [''.join(row) for row in out], g

def room_check(rid, grid, objs, arrival, targets):
    h, w = len(grid), len(grid[0])
    for x in range(w):
        for y in (0, h - 1):
            if grid[y][x] in RWALK and grid[y][x] != 'm': fail(f'{rid}: wall open at {(x, y)}')
    for y in range(h):
        for x in (0, w - 1):
            if grid[y][x] in RWALK: fail(f'{rid}: wall open at {(x, y)}')
    block = {(o['x'], o['y']) for o in objs if o['kind'] in ('npc', 'sign', 'prop') and grid[o['y']][o['x']] in RWALK}
    seen = reach(grid, arrival, frozenset(block), walk=RWALK)
    for k, p in targets.items():
        if p not in seen: fail(f'{rid}: {k} at {p} not reachable with every body and prop in place')
    lost = {(x, y) for y in range(h) for x in range(w) if grid[y][x] in RWALK} - block - seen
    if lost: fail(f'{rid}: unreachable floor {sorted(lost)[:4]}')
    for o in objs:
        if o['kind'] in ('npc', 'sign', 'prop') and (o.get('lines') or o.get('scene') or o.get('text') or o.get('shop')):
            if not any((a, b) in seen for a, b in nbrs(o['x'], o['y'], w, h)): fail(f"{rid}: {o['id']} has no reachable tile to tap from")

def P(oid, x, y, sprite, **kw): return dict({'kind': 'prop', 'id': oid, 'x': x, 'y': y, 'sprite': sprite}, **kw)
def N(oid, name, look, x, y, facing='down', **kw): return dict({'kind': 'npc', 'id': oid, 'name': name, 'look': look, 'x': x, 'y': y, 'facing': facing, 'still': True}, **kw)
def room(rid, name, door, outdoor, grid, skin, objs, safe, **kw):
    w, h = len(grid[0]), len(grid)
    if any(len(r) != w for r in grid): fail(f'{rid}: ragged grid')
    if w > 16 or h > 24: fail(f'{rid}: {w}x{h} over the 16x24 room cap')
    r = {'name': name, 'kind': 'interior', 'outdoor': outdoor, 'door': door, 'backdrop': 'town', 'music': 'sweet', 'w': w, 'h': h,
         'spawns': None, 'zones': [], 'safe': {'x': safe[0], 'y': safe[1]}, 'skin': skin, 'variants': True, 'grid': grid, 'objs': objs}
    r.update(kw)
    for o in objs:
        if o['id'] in ALL_IDS: fail(f"{rid}: duplicate id {o['id']}")
        ALL_IDS.add(o['id'])
    return r
RP = {r['id']: r for r in L['rooms']}
ROOMS = {}
DOORS = {d['id']: d for c in L['chunks'] for d in c['doors']}

# bg_lantern_in, the Lantern House, 14x14 (§7, D2009): twelve beds in two side alcoves, the host at an alcove's mouth beside the
# beds (TOWN_LANDMARKS' guide rule), a ticking clock (6,1), a Comfort Lamp by the door, a bench; respawn 6,11 facing up.
rp = RP['bg_lantern_in']; g, raw = from_packet(rp)
door = DOORS['bg_lantern']
objs = [{'kind': 'warp', 'id': 'bg_lantern_mat', 'x': rp['mat'][0], 'y': rp['mat'][1], 'to': 'brightgate', 'tx': door['x'], 'ty': door['y'], 'facing': 'down'}]
beds = [(x, y) for y in range(len(raw)) for x in range(len(raw[0])) if raw[y][x] == 'b']
if len(beds) != 12: fail(f'bg_lantern_in: {len(beds)} beds, the packet has 12 (D1497)')
for i, (x, y) in enumerate(beds): objs.append(P(f'bg_bed_{"abcdefghijkl"[i]}', x, y, 'rest_bed', lines={'else': '@lantern_rest'}))
host = rp['anchors'][0]
objs.append(N('bg_lantern_host', TXT['host_name'], 'bg_lantern_host', host['x'], host['y'], host['facing']))
clock = rp['marks'][0]['cells'][0]
objs.append(P('bg_lantern_clock', clock[0], clock[1], 'clock_face', name='a wall clock', lines={'else': TXT['clock']}))
for y in range(len(raw)):
    for x in range(len(raw[0])):
        if raw[y][x] == 'L': objs.append(P('bg_lantern_lamp', x, y, 'bg_comfort_lamp', name='a Comfort Lamp', lines={'else': hook('bh_comfort')}))
        if raw[y][x] == 's': objs.append(P(f'bg_lantern_bench_{y}', x, y, 'bench_long', name='a bench'))
objs.append({'kind': 'sign', 'id': 'bg_lantern_note', 'x': 1, 'y': 12, 'sprite': 'none', 'text': ''})   # the 5-Acorn note (game.js writes it)
ROOMS['bg_lantern_in'] = room('bg_lantern_in', 'Brightgate Lantern House', 'bg_lantern', 'brightgate', g, 'bg_lantern', objs, tuple(rp['arrival']),
                              respawnSpot={'x': 6, 'y': 11, 'facing': 'up'})
room_check('bg_lantern_in', g, objs, tuple(rp['arrival']), dict({'mat': tuple(rp['mat']), 'respawn': (6, 11), 'host_side': (host['x'], host['y'] + 1)},
           **{f'bed{i}': next(n for n in nbrs(x, y, 14, 14) if g[n[1]][n[0]] == '.' and n not in {(o['x'], o['y']) for o in objs}) for i, (x, y) in enumerate(beds)}))

# bg_store_in, Bright Mart, 11x9 on the store kit (§7: grey panels, white walls, honey price bars; "partner price"). The kit's
# own grid: the counter across the back, the clerk behind it, shelves either side, the acorn board on the back wall.
g = ['#' * 11, '#' + 'W' * 9 + '#', '#' + '.' * 9 + '#', '#' + '.' * 9 + '#', '#' + '.' * 9 + '#', '#' + '.' * 9 + '#',
     '#' + '.' * 9 + '#', '#' + '.' * 9 + '#', '#####m#####']
door = DOORS['bg_store']
objs = [{'kind': 'warp', 'id': 'bg_store_mat', 'x': 5, 'y': 8, 'to': 'brightgate', 'tx': door['x'], 'ty': door['y'], 'facing': 'down'},
        N('bg_store_clerk', TXT['store_clerk_name'], 'bg_store_clerk', 5, 2, 'down', shopTitle='BRIGHT MART',
          lines={'else': TXT['store_clerk']}, shop=['heal_snack', 'hearty_snack', 'wake_tonic', 'befriend_treat', 'energy_sip', 'joy_crumb']),
        P('bg_store_counter_l', 4, 3, 'stall_counter', name='the counter'), P('bg_store_counter_r', 6, 3, 'stall_counter', name='the counter'),
        P('bg_store_acorn', 3, 1, 'acorn_board', name='the price board'),
        P('bg_store_crate_a', 1, 3, 'bg_lantern_crate', name='a crate of lanterns'), P('bg_store_crate_b', 9, 3, 'bg_lantern_crate', name='a crate of lanterns'),
        P('bg_store_shelf_a', 1, 6, 'crate_stack', name='a shelf'), P('bg_store_shelf_b', 9, 6, 'crate_stack', name='a shelf')]
ROOMS['bg_store_in'] = room('bg_store_in', 'Bright Mart', 'bg_store', 'brightgate', g, 'bg_store', objs, (5, 7), wall={'windows': [2, 8]})
room_check('bg_store_in', g, objs, (5, 7), {'mat': (5, 8), 'clerk_front': (5, 4)})

# ---------- looks (PLACEHOLDER bodies; palette lock for Glimmerwell figures: white, soot, wine, crimson accent under 10%) ----------
LOOKS = {
    'bg_lantern_host': {'skin': '3', 'hair': 'bun', 'hairCol': 'd', 'outfit': 'jacket', 'outfitCol': 'w', 'accent': 'N'},   # §3.5: a civilian in a white jacket with soot trim
    'bg_store_clerk': {'skin': '2', 'hair': 'short', 'hairCol': 'k', 'outfit': 'apron', 'outfitCol': 'V', 'accent': 'w'},
}
CAST = [{'name': TXT['host_name'], 'faction': 'none', 'base': 50}, {'name': TXT['store_clerk_name'], 'faction': 'glimmer', 'base': 50,
         'rankFlag': 'BRIGHTGATE_LAYOUT: city cast, ranks PLACEHOLDER until Story'}]

# ---------- text checks (walklings-wording-check, CHIP_SECRECY, D1446, D1434) ----------
BANNED = re.compile(r'\b(' + '|'.join(['fa' + 'int(ed)?', 'ev' + 'olv\\w*', 'co' + 'ins?', 'app' + 'eared', 'tr' + 'ainer', '\\w+' + 'dex']) + r')\b|go, [a-z]+!', re.I)
SECRET = re.compile(r'\b(chip(ped|s)?|microchip\w*|tuning|implant\w*)\b', re.I)
def walk_text(v, where, sign=False):
    if isinstance(v, str):
        if len(v) > 110: fail(f'{where}: line over 110 characters')
        if BANNED.search(v): fail(f'{where}: banned word in {v!r}')
        if SECRET.search(v): fail(f'{where}: names the chip, the Tuning or an implant (CHIP_SECRECY)')
        if re.search(r'\brelay\b', v, re.I) and not sign: fail(f'{where}: "relay" outside a sign (D1446)')
        if re.search(r'\bmint\b', v, re.I): fail(f'{where}: says "mint" (D1434)')
        if '  ' in v or any(q in v for q in '‘’“”'): fail(f'{where}: double space or curly quote')
    elif isinstance(v, dict):
        for x in v.values(): walk_text(x, where, sign)
    elif isinstance(v, list):
        for x in v: walk_text(x, where, sign)
for m in list(CHUNKS.values()):
    for o in m.objs: walk_text({k: o.get(k) for k in ('text', 'lines', 'deny', 'name')}, f'{m.id}:{o["id"]}', o['kind'] == 'sign')
for rid, r in ROOMS.items():
    for o in r['objs']: walk_text({k: o.get(k) for k in ('text', 'lines', 'deny', 'name')}, f'{rid}:{o["id"]}', o['kind'] == 'sign')
for cid in CHUNKS:
    for name, r in roofs[cid].items():
        for k in ('roof', 'wall', 'door', 'win'):
            if r.get(k) and re.search(r'mint', r[k]): fail(f'{cid}: {name} uses a mint art key')

# ---------- write ----------
MAPS = {}
for cid, c in CHUNKS.items():
    MAPS[cid] = {'name': NAME[cid], 'district': DISTRICT[cid], 'backdrop': 'town', 'music': 'sweet', 'w': c.w, 'h': c.h,
                 'spawns': None, 'respawn': None, 'respawnIn': {'map': 'bg_lantern_in', 'x': 6, 'y': 11, 'facing': 'up'},
                 'safe': {'x': c.arrival[0], 'y': c.arrival[1]}, 'zones': [], 'variants': False, 'roofs': roofs[cid],   # no g to vary (lawns are l)
                
                 'grid': c.grid, 'objs': c.objs}
MAPS.update(ROOMS)
out = {
    'spec': 'BRIGHTGATE_LAYOUT v0.2 (design specs/BRIGHTGATE_LAYOUT.md; D1478-D1499, D2000-D2009 settled; rule 9 previews approved)',
    '_about': 'Ours, built by tools/build_brightgate.py from the packet json (read, never copied whole). Named zzzzz so it applies '
              'after every other overlay. No warp outside the city leads in yet; ?debug=1 places only. All player text is '
              'PLACEHOLDER until Story signs it (§11). Art is PLACEHOLDER until Pia\'s pass (§10).',
    'tiles': TILES,
    'maps': MAPS,
    'looks': LOOKS,
    'cast': CAST,
    'flags': {'story.reached_brightgate': 'set on the first arrival on Gate Plaza (beat sheet §9; ?debug=1 places in this build)'},
}
for n in notes: print('note:', n)
if fails:
    print('FAIL'); [print(' -', f) for f in fails]; sys.exit(1)
open(OUT, 'w').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print(f'wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT)} bytes)')
print('build_brightgate: PASS')
