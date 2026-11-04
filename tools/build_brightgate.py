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
SWITCHED = 'story.switched_a3'
RL = {r_['id']: r_['text'] for r_ in L.get('room_lines', [])}   # v0.2.1 §17.5's lines (PLACEHOLDER)
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
    'shuttle': '[PLACEHOLDER] The shuttle stop. No shuttle runs from here yet.',   # bg_south, only for a layout without the §17.1 shuttle stops
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
        if blocks is None: blocks = o['kind'] in ('npc', 'sign', 'prop', 'trainer', 'wild') and self.walk(o['x'], o['y'])
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
    'bg_gala': TXT['gala'], 'bg_glowcare': TXT['glowcare'],
    'bg_annex_a': TXT['staff'], 'bg_annex_b': TXT['staff'], 'bg_lampworks': TXT['works'], 'bg_fleetbay': TXT['fleet'],
    'bg_census': TXT['closed'], 'bg_old_a': None, 'bg_old_b': None, 'bg_odell': TXT['closed'],
    'bg_wickshop': TXT['wickshop'], 'bg_academy': TXT['academy'], 'bg_showhome': None,
}
for h in 'abcdefghij': SHUT['bg_home_' + h] = TXT['residents']
ROOM_DOOR = {'bg_lantern': ('bg_lantern_in', 6, 12), 'bg_store': ('bg_store_in', 5, 7), 'bg_hq': ('bg_hq_lobby', 7, 14), 'bg_hall': ('bg_hall_in', 7, 22)}
for cid, c in CHUNKS.items():
    for d in c.src['doors']:
        did = d['id']
        o = {'kind': 'door', 'id': did, 'x': d['x'], 'y': d['y']}
        if did in ROOM_DOOR:
            rid, tx, ty = ROOM_DOOR[did]; o.update({'to': rid, 'tx': tx, 'ty': ty, 'facing': 'up'})
            if did == 'bg_hall': o.update({'need': 'story.act>=2', 'deny': 'Closed for now.'})   # D1484: Act 2 (settled)
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
        if m.get('warp_obj'):   # bg_south: the walk-on way back out. With the §17.1 stops the bar is dropped and the home mark bs_gate_home stands here
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

# ---------- slice 3: dressing and people (§3.4 props, §4.2-§4.5 the tells, §8.1 anchors, §8.2 schedules, §8.3 beats) ----------
# The fleet's built lines (glimmer_fleet.js LINES, PLACEHOLDER D1346), read from the game file: the `split` voice, or the plain line.
FLEET_SRC = open(os.path.join(ROOT, 'glimmer_fleet.js')).read()
def fleet_line(key):
    m = re.search(r"\n\s+" + key + r": (\{ split: \"((?:[^\"\\]|\\.)*)\"|\{ split: '((?:[^'\\]|\\.)*)'|'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")", FLEET_SRC)
    if not m: fail('fleet line missing: ' + key); return ''
    return next(v for v in m.groups()[1:] if v is not None).replace("\\'", "'")
TXT.update({
    'courtesy': hook('bh_courtesy'), 'insign': hook('bh_hq_plaque'),
    'lamp': hook('bh_lamp'), 'board': hook('bh_board'), 'swap': hook('bh_swap'), 'switchover': hook('bh_switchover'),
    'glow_sign': hook('bh_glowcare_sign'), 'crate': hook('bh_crate'), 'tower': hook('bh_tower'), 'retired': hook('bh_retired'),
    'hall_sign': hook('bh_hall_sign'), 'odell': hook('bh_odell'), 'vane': hook('bh_vane'), 'seam': hook('bh_seam'), 'comfort': hook('bh_comfort'),
    'greeter': 'Welcome to Brightgate! Have a bright day!',            # §8.1 (the greeter's line in the packet)
    'waiting': 'Booked through next season.',                          # §8.1
    'cruiser': fleet_line('cruiser'), 'swap_clerk': fleet_line('swap_clerk'), 'mast': fleet_line('mast'), 'mast_tech': fleet_line('mast_tech'),
    'receptionist_gc': fleet_line('receptionist'), 'bay': fleet_line('bay_attendant'),
    'dimlamp': "[PLACEHOLDER] The Dimlamp trail's lines are its own build's.",
    'friend_board': '[PLACEHOLDER] BRIGHT BOARD. Top partners: [FRIEND 1], [FRIEND 2], [FRIEND 3], [FRIEND 4], [FRIEND 5], [FRIEND 6].',
    'townsfolk': '[PLACEHOLDER] Have a bright day!',
})
SC = {}   # hooks with a first-read flag (§9: story.bg_insign, story.bg_crate, story.bg_vane): the line plays once with its flag, then repeats
def hooked(cid, oid, x, y, sprite, line, flag=None, kind='prop', r=3, exact=False, **kw):
    c = CHUNKS[cid]
    spot = (x, y) if exact or not c.walk(x, y) else c.place_near(x, y, r=r)
    if not spot: fail(f'{cid}: no tile for {oid} near {(x, y)}'); return None
    if spot != (x, y): note(f'{cid}: {oid} wanted {(x, y)}, stands at {spot}')
    o = {'kind': kind, 'id': oid, 'x': spot[0], 'y': spot[1], 'sprite': sprite}
    if kind == 'sign': o['text'] = line
    elif line: o['lines'] = {'else': line}
    if flag:
        SC[oid] = [['say', '', line], ['setFlag', flag, True]]
        o['lines'] = {'!' + flag: '@' + oid, 'else': line}
    o.update(kw)
    return c.add(o, blocks=None if c.walk(*spot) else False)

def body(cid, oid, name, look, x, y, facing='down', line=None, r=3, **kw):
    c = CHUNKS[cid]
    spot = (x, y) if c.safe_block(x, y) else c.place_near(x, y, r=r)
    if not spot: fail(f'{cid}: no tile for {oid}'); return None
    if spot != (x, y): note(f'{cid}: {oid} wanted {(x, y)}, stands at {spot}')
    o = {'kind': 'npc', 'id': oid, 'name': name, 'look': look, 'x': spot[0], 'y': spot[1], 'facing': facing, 'still': True}
    if line: o['lines'] = {'else': line}
    o.update(kw)
    return c.add(o)

# Courtesy Cruiser stands (D1488): one parked Cruiser across each 3x1 bay; the Keeper slot stays empty (D1498).
for cid, c in CHUNKS.items():
    for p in c.src['posts']:
        if p['kind'].startswith('Keeper'): continue
        x0, y0, x1, y1 = p['bay']
        west = 'west' in p.get('note', '')
        c.add({'kind': 'prop', 'id': 'bg_' + p['id'], 'x': x0 + 1, 'y': y0, 'sprite': 'bg_cruiser_l' if west else 'bg_cruiser', 'oy': 6,
               'name': 'a Courtesy Cruiser', 'lines': {'else': TXT['cruiser']}}, blocks=False)
# Gliding Cruisers (§4.3) on their lanes, east-west, never blocking; reduced motion parks each at its west end.
for cid, c in CHUNKS.items():
    for pt in c.src['patrols']:
        if pt['kind'] != 'cruiser': continue
        (ax_, ay_), (bx_, by_) = pt['route'][0], pt['route'][1]
        c.add({'kind': 'glide', 'id': 'bg_' + pt['id'], 'x': min(ax_, bx_), 'y': ay_, 'sprite': 'bg_cruiser', 'oy': 6,
               'glide': {'x0': min(ax_, bx_), 'x1': max(ax_, bx_), 'speed': 3.2, 'pause': 1.4}}, blocks=False)
# Sky Concierges over the Campus only (§4.4): one parked on the pad, one crossing every 9 s.
CP = CHUNKS['bg_campus']
pad = [(x, y) for y in range(CP.h) for x in range(CP.w) if CP.ch(x, y) == 'V']
px_, py_ = sorted(pad)[len(pad) // 2]
CP.add({'kind': 'prop', 'id': 'bg_concierge_parked', 'x': px_, 'y': py_, 'sprite': 'bg_concierge', 'name': 'a Sky Concierge', 'lines': {'else': '[PLACEHOLDER] A Sky Concierge, parked on its pad.'}}, blocks=None)
CP.add({'kind': 'glide', 'id': 'bg_concierge_fly', 'x': 2, 'y': 12, 'sprite': 'bg_concierge_fly', 'oy': -24,
        'glide': {'x0': 2, 'x1': 61, 'speed': 59 / 3.0, 'pause': 1.5}}, blocks=False)   # 3 s across, 1.5 s off each edge: one pass every 9 s
# Courtesy staff beats (§8.3, D1489): foot patrols, a pair where the packet says pair (the second half a loop behind).
for cid, c in CHUNKS.items():
    for pt in c.src['patrols']:
        if pt['kind'] != 'foot': continue
        route = [list(p) for p in pt['route']]
        swap = cid == 'bg_oldtown'
        n = 2 if 'pair' in pt.get('note', '') else 1
        for i in range(n):
            start = 0 if i == 0 else len(route) // 2
            x, y = route[start]
            o = {'kind': 'npc', 'id': f"bg_{pt['id']}_{'ab'[i]}", 'name': 'Swap crew' if swap else 'Courtesy staff', 'look': 'bg_swapcrew' if swap else 'bg_courtesy',
                 'x': x, 'y': y, 'facing': 'down', 'patrol': route, 'patrolStart': start,
                 'lines': {'else': TXT['dimlamp'] if swap else TXT['courtesy']}}
            if pt['when']: o['when'] = list(pt['when'])
            c.add(o, blocks=False)
# Fixed anchors (§8.1).
ANCH = {a['id']: (cid, a['x'], a['y']) for cid, c in CH.items() for a in c['anchors']}
for aid, name, look, line, kw in (
        ('bg_swap_clerk', 'Swap Clerk', 'bg_swap_clerk', TXT['swap_clerk'], {}),
        ('bg_shuttle_greeter', 'Courtesy greeter', 'bg_courtesy', TXT['greeter'], {}),
        ('bg_mast_tech', 'Mast Tech', 'bg_mast_tech', TXT['mast_tech'], {}),
        ('bg_glowcare_rec', 'Glow Care Receptionist', 'bg_receptionist', TXT['receptionist_gc'], {}),
        ('bg_waiting_local', 'Waiting Local', 'bg_local', TXT['waiting'], {}),
        ('bg_swap_foreman', 'Swap-crew foreman', 'bg_swapcrew', TXT['dimlamp'], {'when': ['phase:dusk']}),
        ('bg_bay_attendant', 'Bay Attendant', 'bg_bay_attendant', TXT['bay'], {}),
        ('bg_tower_crew', 'Calm Tower crew', 'bg_swapcrew', TXT['tower'], {}),
        ('bg_odell', 'Lamplighter Odell', 'bg_odell', TXT['odell'], {'when': ['phase:dawn|phase:day']})):
    cid, x, y = ANCH[aid]
    body(cid, 'bg_lamplighter' if aid == 'bg_odell' else aid, name, look, x, y, 'down', line, **kw)   # bg_odell is the house door's id
# Landmarks and hooks (§3.4, §4.5, §11). Props stand on their tile; a prop on a walk tile blocks and is checked like any blocker.
LM = {l['id']: (cid, l['x'], l['y']) for cid, c in CH.items() for l in c['landmarks']}
def L_(lid): return LM[lid]
def lm(lid, oid, sprite, line=None, flag=None, **kw):
    cid, x, y = L_(lid); return hooked(cid, oid, x, y, sprite, line, flag, **kw)
lm('lm_shuttle_stop', 'bg_shelter', 'bg_shelter', None, exact=True)
for i, lid in enumerate(('lm_flame_lantern_1', 'lm_flame_lantern_2', 'lm_flame_lantern_3')):   # D1492: tiles kept; the trail's states are its build's
    lm(lid, f'bg_flame_lantern_{i + 1}', 'bg_flame_lantern', exact=True, name='an old flame lantern')
lm('lm_bright_board', 'bg_bright_board', 'bg_bright_board', TXT['board'], exact=True)
cid, x, y = L_('lm_bright_swap')   # Bright Swap, a 2x2 stall: the art across 56-57 x 26-27, the sign on its front-left cell
GP.add({'kind': 'prop', 'id': 'bg_swap_stall', 'x': 57, 'y': 27, 'ox': -8, 'sprite': 'bg_swap_stall', 'name': 'Bright Swap', 'lines': {'else': TXT['swap']}})
for (bx, by) in ((56, 26), (57, 26), (56, 27)): GP.add({'kind': 'prop', 'id': f'bg_swap_stall_{bx}_{by}', 'x': bx, 'y': by, 'sprite': 'bg_none'})
lm('lm_relay_mast_c0', 'bg_relay_mast_c0', 'bg_relay_mast', TXT['mast'], exact=True)
lm('lm_census_kiosk', 'bg_census_kiosk', 'census_tent', None, exact=True)
lm('lm_switchover_board', 'bg_switchover', 'bg_switch_board', TXT['switchover'], exact=True)
lm('lm_store_crates', 'bg_store_crates', 'bg_lantern_crate', None, exact=True)
lm('lm_hq_plaque', 'bg_hq_plaque', 'bg_insign_plaque', TXT['insign'], 'story.bg_insign', exact=True)
cid, x, y = L_('lm_hq_badge'); CHUNKS[cid].add({'kind': 'decal', 'id': 'bg_hq_badge', 'x': x, 'y': y, 'sprite': 'bg_badge'})   # the badge plate: art beside the door, never blocks
cid, x, y = L_('lm_glowcare_badge'); CHUNKS[cid].add({'kind': 'decal', 'id': 'bg_glowcare_badge', 'x': x, 'y': y, 'sprite': 'bg_badge'})   # the badge plate: art beside the door, never blocks
hooked('bg_campus', 'bg_glowcare_sign', 54, 19, 'gw_sign', TXT['glow_sign'], kind='sign', exact=True)
lm('lm_relay_mast_c1', 'bg_relay_mast_c1', 'bg_relay_mast', TXT['mast'], exact=True)
lm('lm_city_relay', 'bg_city_relay', 'bg_relay_mast', TXT['mast'], exact=True)
lm('lm_pad_sign', 'bg_pad_sign', 'gw_sign', '[PLACEHOLDER] SKY CONCIERGE PAD.', kind='sign', exact=True)
cid, x, y = L_('lm_pool_ring'); CHUNKS[cid].add({'kind': 'decal', 'id': 'bg_pool_ring', 'x': x, 'y': y, 'sprite': 'bg_pool_ring'})
lm('lm_crate_bg2', 'bg_calm_crate', 'crate_stack', TXT['crate'], 'story.bg_crate', exact=True)
for lid in ('lm_crates_b', 'lm_crates_c', 'lm_crates_d'): lm(lid, 'bg_' + lid[3:], 'crate_stack', None, exact=True)
lm('lm_relay_yard_a', 'bg_relay_yard_a', 'bg_relay_mast', TXT['mast'], exact=True)
lm('lm_relay_yard_b', 'bg_relay_yard_b', 'bg_relay_mast', TXT['mast'], exact=True)
cid, x, y = L_('lm_fleet_badge'); CHUNKS[cid].add({'kind': 'decal', 'id': 'bg_fleet_badge', 'x': x, 'y': y, 'sprite': 'bg_badge'})   # the badge plate: art beside the door, never blocks
lm('lm_rail_wagon', 'bg_rail_wagon', 'bg_wagon', None, exact=True, ox=8)
lm('lm_retired_baskets', 'bg_retired', 'bg_baskets', TXT['retired'], exact=True)
lm('lm_hall_sign', 'bg_hall_sign', 'signpost', TXT['hall_sign'], exact=True, kind='sign')
cid, x, y = L_('lm_dead_vane'); CHUNKS[cid].add({'kind': 'decal', 'id': 'bg_dead_vane', 'x': x, 'y': y, 'sprite': 'bg_vane'})
hooked('bg_oldtown', 'bg_vane_read', 33, 16, 'none', TXT['vane'], 'story.bg_vane', kind='prop', r=3, name='the weather vane')
lm('lm_seam_post', 'bg_seam_post', 'bg_seam_post', TXT['seam'], exact=True)
lm('lm_seam_scaffold', 'bg_seam_scaffold', 'bg_scaffold', None, exact=True)
lm('lm_seam_crate', 'bg_seam_crate', 'crate_stack', None, exact=True)
lm('lm_washing_a', 'bg_washing_a', 'bg_washing', None, exact=True)
lm('lm_washing_b', 'bg_washing_b', 'bg_washing', None, exact=True)
lm('lm_steps_a', 'bg_steps_a', 'stair_flight', None, exact=True)
lm('lm_comfort_lamp_a', 'bg_comfort_a', 'bg_comfort_lamp', TXT['comfort'], exact=True)
lm('lm_comfort_lamp_b', 'bg_comfort_b', 'bg_comfort_lamp', TXT['comfort'], exact=True)
lm('lm_census_kiosk_c4', 'bg_census_kiosk_c4', 'census_tent', None, exact=True)
lm('lm_calm_tower', 'bg_calm_tower_beacon', 'bg_none', None, exact=True)   # the tower stands on its roof-kit block; B26's art is Pia's
# The ring on every lamp post (§4.2, D1494): on the planter kerbs every six tiles (solid tiles: no way is cut), and on the
# walk's edge where there are no planters (the Works, the pool walk). By day the glass is lit; at night every lamp pulses on
# one shared beat (one timer, §6.4); reduced motion holds the lit frame. The 2-tile hum needs a sound the game does not
# have yet (SCENE_MUSIC / sfx ask): each post carries `hum: true` for it.
for cid, c in CHUNKS.items():
    k = 0
    for y in range(1, c.h - 1):
        for x in range(1, c.w - 1):
            if k >= 26: break
            on_kerb = c.ch(x, y) == 'J' and (x, y) not in c.block and (x % 6 == 0 if (c.ch(x - 1, y) == 'J' or c.ch(x + 1, y) == 'J') else y % 6 == 0)
            edge = cid in ('bg_works', 'bg_campus') and c.ch(x, y) in 'dI' and (x + y) % 6 == 0 and any(c.ch(a, b) in 'wG' for a, b in nbrs(x, y, c.w, c.h))
            if not on_kerb and not (edge and c.place_near(x, y, r=0) == (x, y)): continue
            for nm, when in (('bg_lamp_ring', '!phase:night'), ('bg_lamp_ring_pulse', 'phase:night')):
                c.add({'kind': 'prop', 'id': f'bg_lamp_{cid}_{k}_{nm[-5:]}', 'x': x, 'y': y, 'sprite': nm, 'when': [when], 'hum': True,
                       'name': 'a lamp post', 'lines': {'else': TXT['lamp']}}, blocks=not on_kerb)
            k += 1
# Scheduled townsfolk (§8.2): one body per map its rows name, the rows on the first; last row off-map.
LOOK_T = {'Staff commuter': 'bg_courtesy', 'Supporter A (wine vest)': 'bg_supporter', 'Supporter B (wine vest)': 'bg_supporter', 'Parent': 'bg_local',
          'Child': 'bg_child', 'Census taker': 'bg_swapcrew', 'Old Wick elder': 'bg_elder', 'Works hand': 'bg_swapcrew'}
for i, sc in enumerate(L['schedules']):
    nm = sc['body'].replace(' (wine vest)', '')
    rows = [{'when': r['when'] or '', 'map': r['map'], 'x': r['x'] or 0, 'y': r['y'] or 0, 'facing': r.get('facing'), 'place': r.get('place') or 'home (off the map)'} for r in sc['rows']]
    rows[-1] = {'map': None, 'x': 0, 'y': 0, 'place': 'home (off the map)'}
    maps = []
    for r in sc['rows'][:-1]:
        if r['map'] not in maps: maps.append(r['map'])
    for j, mid in enumerate(maps):
        r0 = next(r for r in sc['rows'] if r['map'] == mid)
        c = CHUNKS[mid]
        if not c.walk(r0['x'], r0['y']): fail(f"schedule {nm}: {mid} {r0['x']},{r0['y']} not walkable")
        o = {'kind': 'npc', 'id': f'bg_sched_{i}_{j}', 'name': nm, 'look': LOOK_T[sc['body']], 'x': r0['x'], 'y': r0['y'], 'facing': r0.get('facing') or 'down',
             'lines': {'else': TXT['townsfolk']}, 'still': True}   # stands at its row tile (no wander route over the big maps)
        if j == 0: o['schedule'] = rows
        c.add(o, blocks=False)

# ---------- v0.2.1 (§17, D2090-D2106): holders, the one placed wild, the bowl, the pond sign, the timetable, the shuttle ----------
DISTRICT_TRAINERS = {}
for cid, c in CHUNKS.items():   # §17.3: four optional talk-to-battle holders (sight 0), off B5's line of travel
    for hd in c.src.get('holders', []):
        if not c.safe_block(hd['x'], hd['y']): fail(f"{cid}: holder {hd['id']} at {(hd['x'], hd['y'])} would block or is taken")
        DISTRICT_TRAINERS[hd['id']] = {'name': hd['name'], 'title': 'Brightgate holder', 'map': cid, 'x': hd['x'], 'y': hd['y'], 'facing': hd['facing'],
                                       'sight': hd['sight'], 'ai': hd['ai'], 'money': None, 'team': hd['team'], 'lines': hd['lines']}
        c.add({'kind': 'trainer', 'id': hd['id'], 'x': hd['x'], 'y': hd['y'], 'look': 'bg_local'})
    if c.src.get('wild_table') is not None: fail(f'{cid}: v0.2.1 says no wild table in Brightgate')
    for pw in c.src.get('placed_wilds', []):   # §17.3: one dipper, one-shot (its own done flag, as Route 4's placed wilds)
        if not c.safe_block(pw['x'], pw['y']): fail(f"{cid}: {pw['id']} would block or is taken")
        c.add({'kind': 'wild', 'id': pw['id'], 'x': pw['x'], 'y': pw['y'], 'form': pw['form'], 'level': pw['level'], 'when': ['!story.bg_dipper'], 'scene': 'bg_dipper'})
SC['bg_dipper'] = [['encounter', 'bg_wild_dipper'], ['setFlag', 'story.bg_dipper', True]]
lm('lm_welcome_bowl', 'bg_welcome_bowl', 'bg_lantern_crate', hook('bh_welcome_bowl'), exact=True, name='a bowl of lanterns')
lm('lm_pond_sign', 'bg_pond_sign', 'signpost', hook('bh_pond'), exact=True, kind='sign')
for o in GP.objs:   # the shelter carries the timetable (two states, §17.1)
    if o['id'] == 'bg_shelter': o['lines'] = {'story.km_council': hook('bh_timetable_b'), 'else': hook('bh_timetable')}; o['name'] = 'the shuttle shelter'

# The Bright Shuttle (§17.1; D2090 and D2091 settled by Vincent, Wed Nov 4, 2026; D2092, D2105, D2106 on their defaults; names
# PLACEHOLDER until Story's name check, D2097). Every leg is a walk-on warp with a `when` and the built warp fade; no new mechanic.
# The two narrations are `load` triggers on the landing tiles, so they play on the arrival itself (a plain trigger fires only
# when a step ends there). Kilnmouth's stop is placed by detail_zzzzz_kilnmouth.json: this overlay loads before Kilnmouth's,
# and applyMapPatch skips a map that does not exist yet.
LINK = L.get('link') or {}
LS = {s_['id']: s_ for s_ in LINK.get('stops', [])}
SHUTTLE_TXT = {'bs_first_ride': 'The shuttle hums to a stop. Nobody asks for a ticket. Nobody asks your name, either.',
               'hs_sign': 'BRIGHT SHUTTLE · Brightgate. Free, every hour. A Glimmerwell kindness. Have a bright day!',
               'hs_first_drop': "The shuttle sets you down beside the Lantern Coach. Its driver waves at the porter. He doesn't wave back.",
               'ks_sign': 'BRIGHT SHUTTLE · Brightgate. Free for partners and their guests. Step on the mark.',
               'ks_att_first': 'The Lamp Works sends a shuttle for the tower crew. Guests ride free, Cadet. Have a bright day!',
               'ks_att': 'One step to Brightgate. Mind the mark!'}   # §17.1 lines (PLACEHOLDER)
HM_SIGN = (19, 9)   # §17.1: the Hearthmoor stop's sign on the nearest free tile to the mark (18,9); checked on the composed map by tests/bright_shuttle.spec.js
SLICE_PATCH, KILNMOUTH_STOP = {}, {}
if LS:
    GP.objs = [o for o in GP.objs if o['id'] != 'bg_south']   # the "no shuttle yet" bar stood on the home mark's tile: gone now the shuttle runs
    hx, hy = LS['bs_gate_home']['mark']
    GP.add({'kind': 'warp', 'id': 'bs_gate_home', 'x': hx, 'y': hy, 'to': 'hearthmoor', 'tx': LS['bs_hearthmoor']['arrive'][0], 'ty': LS['bs_hearthmoor']['arrive'][1],
            'facing': LS['bs_hearthmoor']['arrive_facing'], 'when': [LS['bs_gate_home']['when']]}, blocks=False)
    wx, wy = LS['bs_gate_works']['mark']
    if not GP.walk(wx, wy): fail('brightgate: the works mark is not on a walk tile')
    # the works line (33,38 -> Kilnmouth's yard 52,16, left), hidden until the council sits (D1882 kept, D2092)
    GP.add({'kind': 'warp', 'id': 'bs_gate_works', 'x': wx, 'y': wy, 'to': 'kilnmouth', 'tx': 52, 'ty': 16, 'facing': 'left',
            'when': [LS['bs_gate_works']['when']]}, blocks=False)
    GP.add({'kind': 'trigger', 'id': 'bs_first_ride', 'x': 32, 'y': 37, 'r': 0, 'load': True, 'when': ['!story.bg_shuttle'], 'scene': 'bs_first_ride'}, blocks=False)
    SC['bs_first_ride'] = [['say', '', SHUTTLE_TXT['bs_first_ride']], ['setFlag', 'story.bg_shuttle', True]]
    SC['hs_first_drop'] = [['say', '', SHUTTLE_TXT['hs_first_drop']], ['setFlag', 'story.bg_shuttle_hm', True]]
    hm = LS['bs_hearthmoor']
    SLICE_PATCH = {'maps': {'hearthmoor': {'addObjs': [   # the Hearthmoor stop beside the Lantern Coach (tiles: the packet's default)
        {'kind': 'warp', 'id': 'bs_hearthmoor', 'x': hm['mark'][0], 'y': hm['mark'][1], 'to': 'brightgate', 'tx': 32, 'ty': 37, 'facing': 'up', 'when': [hm['when']]},
        {'kind': 'sign', 'id': 'hs_sign', 'x': HM_SIGN[0], 'y': HM_SIGN[1], 'text': SHUTTLE_TXT['hs_sign'], 'when': [hm['when']]},
        # 18,8 is on Hearthmoor's main road: the drop waits for a first visit, so nobody hears it before they have ridden
        {'kind': 'trigger', 'id': 'hs_first_drop', 'x': hm['arrive'][0], 'y': hm['arrive'][1], 'r': 0, 'load': True,
         'when': ['story.reached_brightgate', '!story.bg_shuttle_hm'], 'scene': 'hs_first_drop'}]}}}
    # Kilnmouth's stop (works yard): placed in detail_zzzzz_kilnmouth.json (maps.kilnmouth.objs). Kept here for the text checks.
    ks = LS['bs_kilnmouth']
    KILNMOUTH_STOP = {'objs': [{'kind': 'warp', 'id': 'bs_kilnmouth', 'x': ks['mark'][0], 'y': ks['mark'][1], 'to': 'brightgate', 'tx': 32, 'ty': 37, 'facing': 'up', 'when': [ks['when']]},
                               {'kind': 'sign', 'id': 'ks_sign', 'x': ks['sign'][0], 'y': ks['sign'][1], 'text': SHUTTLE_TXT['ks_sign'], 'when': [ks['when']]},
                               {'kind': 'npc', 'id': 'ks_attendant', 'name': 'Shuttle attendant', 'look': 'bg_courtesy', 'x': ks['attendant'][0], 'y': ks['attendant'][1],
                                'facing': ks['attendant_facing'], 'still': True, 'when': [ks['when']],
                                'lines': {'!story.reached_brightgate': SHUTTLE_TXT['ks_att_first'], 'else': SHUTTLE_TXT['ks_att']}}]}

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

def room_check(rid, grid, objs, arrival, targets, walk=RWALK, open_gates=False):
    """open_gates: props that come and go by `when` (the lanyard gate) are left out, the gate as a switcher finds it."""
    RWALK_ = walk; h, w = len(grid), len(grid[0])
    for x in range(w):
        for y in (0, h - 1):
            if grid[y][x] in RWALK_ and grid[y][x] not in 'mE': fail(f'{rid}: wall open at {(x, y)}')
    for y in range(h):
        for x in (0, w - 1):
            if grid[y][x] in RWALK_: fail(f'{rid}: wall open at {(x, y)}')
    block = {(o['x'], o['y']) for o in objs if o['kind'] in ('npc', 'sign', 'prop') and grid[o['y']][o['x']] in RWALK_ and not (open_gates and o.get('when'))}
    seen = reach(grid, arrival, frozenset(block), walk=RWALK_)
    for k, p in targets.items():
        if p not in seen: fail(f'{rid}: {k} at {p} not reachable with every body and prop in place')
    lost = {(x, y) for y in range(h) for x in range(w) if grid[y][x] in RWALK_} - block - seen
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
objs.append(P('bg_lantern_clock', clock[0], clock[1], 'clock_face', name='a wall clock', lines={'talked': RL['ck_repeat'], 'else': RL['ck_first']}))
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
          lines={SWITCHED: RL['sc_staff'], 'talked': RL['sc_repeat'], 'else': RL['sc_first']}, shop=['heal_snack', 'hearty_snack', 'wake_tonic', 'befriend_treat', 'energy_sip', 'joy_crumb']),
        P('bg_store_counter_l', 4, 3, 'stall_counter', name='the counter'), P('bg_store_counter_r', 6, 3, 'stall_counter', name='the counter'),
        P('bg_store_acorn', 3, 1, 'acorn_board', name='the price board'),
        P('bg_store_crate_a', 1, 3, 'bg_lantern_crate', name='a crate of lanterns'), P('bg_store_crate_b', 9, 3, 'bg_lantern_crate', name='a crate of lanterns'),
        P('bg_store_shelf_a', 1, 6, 'crate_stack', name='a shelf'), P('bg_store_shelf_b', 9, 6, 'crate_stack', name='a shelf')]
ROOMS['bg_store_in'] = room('bg_store_in', 'Bright Mart', 'bg_store', 'brightgate', g, 'bg_store', objs, (5, 7), wall={'windows': [2, 8]})
room_check('bg_store_in', g, objs, (5, 7), {'mat': (5, 8), 'clerk_front': (5, 4)})

# ---------- slice 2: the HQ lobby and the lanyard gate (§5.3, D1483, D1493, D2006, D2008), the review floor (D2007), the gala (D1486) ----------
SWITCHED = 'story.switched_a3'                                     # ACT3_SWITCH's flag (settled)
RL = {r_['id']: r_['text'] for r_ in L.get('room_lines', [])}   # v0.2.1 §17.5's lines (PLACEHOLDER)
GUEST = 'story.a3_offer & !story.switched_a3 & !story.solvane_met'   # D2008: an open offer, Rook's guest, floor 2 only
GATE_SHUT = ['!' + SWITCHED, '!story.a3_offer | story.solvane_met']  # every holder but a switcher or an open-offer guest
LANYARD = 'seal:seal_glim_1 | seal:seal_glim_2 | seal:seal_glim_3'    # D1521: an undercover Keeper's Glimmerwell lanyard
TXT.update({
    'reception': hook('bh_receptionist'),          # "Visitors' hours end at five. It's five." (CHIP_SECRECY §3)
    'not_listed': hook('bh_not_listed'),           # "Your name isn't on today's list."
    'courtesy': hook('bh_courtesy'),               # "Lost? Everything's this way. Have a bright day!"
    'rack': 'A lanyard rack. One hook is empty. The card under it has your name.',   # §11 (ACT3_SWITCH §3.2, settled)
    'insign': hook('bh_hq_plaque'),                # "Founded as INSIGN. Brighter by nature." (T2, PROPOSED)
    'out_of_service': 'Out of service.',           # §5.3 the executive lift (PLACEHOLDER)
    'gate_open': '[PLACEHOLDER] The lanyard gate stands open.',
    'board': '[PLACEHOLDER] The Outcomes Board. Its cards are GLIMMER_DECISIONS\' to build.',
    'stair': '[PLACEHOLDER] The stair is shut.',
    'wait_act3': "[PLACEHOLDER] ACT3_SWITCH's lines go here.",
    'wait_board': "[PLACEHOLDER] GLIMMER_DECISIONS' lines go here.",
    'gala_host': '[PLACEHOLDER] The gala is Story\'s scene (G1).',
})
REVIEW_WHEN = [SWITCHED + ' | story.a3_offer']   # who is on floor 2 at all

def furnish(raw, legend, oid):
    """Furniture letters of a designed grid to props: legend maps a letter to (sprite, name, line or None)."""
    out = []
    for y in range(len(raw)):
        for x in range(len(raw[0])):
            k = raw[y][x]
            if k in legend:
                sp, nm, ln = legend[k]
                o = P(f'{oid}_{k}_{x}_{y}', x, y, sp, name=nm)
                if ln: o['lines'] = {'else': ln}
                out.append(o)
    return out

# bg_hq_lobby, floor 1, 16x16, mat 7,15 (Appendix A). The gate cells stay floor; a gate prop stands on each while it is shut.
rp = RP['bg_hq_lobby']; g, raw = from_packet(rp)
g = [r[:3] + ('E' if y == 1 else r[3]) + r[4:12] + ('E' if y == 1 else r[12]) + r[13:] for y, r in enumerate(g)]   # the two lifts
door = DOORS['bg_hq']
objs = [{'kind': 'warp', 'id': 'bg_hq_lobby_mat', 'x': 7, 'y': 15, 'to': 'bg_campus', 'tx': door['x'], 'ty': door['y'], 'facing': 'down'},
        {'kind': 'warp', 'id': 'bg_lift_w', 'x': 3, 'y': 1, 'to': 'bg_review_in', 'tx': 7, 'ty': 12, 'facing': 'up'},
        {'kind': 'sign', 'id': 'bg_lift_e', 'x': 12, 'y': 1, 'sprite': 'none', 'text': TXT['out_of_service']}]
for gx, gy in rp['gates'][0]['cells']:
    objs.append(P(f'bg_lanyard_gate_{gx}', gx, gy, 'bg_lanyard_gate', name='the lanyard gate', when=list(GATE_SHUT),
                  lines={LANYARD: TXT['not_listed'], 'else': TXT['reception']}))
objs += furnish(raw, {'k': ('bg_lanyard_rack', 'the lanyard rack', TXT['rack']), 'D': ('keep_desk', 'the front desk', None),
                      's': ('keep_bench', 'a visitor sofa', None)}, 'bg_lobby')
for (x, y) in ((1, 3), (2, 3), (13, 3), (14, 3), (14, 8)): objs.append(P(f'bg_lobby_planter_{x}_{y}', x, y, 'bg_hedge_planter', name='a planter'))
pl = next(m for m in rp['marks'] if m['id'] == 'insign_plaque')['cells'][0]
objs.append(P('bg_insign_plaque', pl[0], pl[1], 'bg_insign_plaque', name='the INSIGN plaque', lines={'else': TXT['insign']}))
an = {a['id']: a for a in rp['anchors']}
objs.append(N('bg_receptionist', 'Receptionist', 'bg_receptionist', an['bg_receptionist']['x'], an['bg_receptionist']['y'], 'down',
              lines={SWITCHED: 'Have a bright day!', LANYARD: TXT['not_listed'], 'else': TXT['reception']}))
objs.append(N('bg_juniper_desk', 'Associate Juniper', 'juniper', an['bg_juniper_desk']['x'], an['bg_juniper_desk']['y'], 'down',
              when=['story.a3_offer', '!' + SWITCHED], lines={'else': TXT['wait_act3']}))
objs.append(N('bg_lobby_guard', 'Courtesy staff', 'bg_courtesy', an['bg_lobby_guard']['x'], an['bg_lobby_guard']['y'], 'down', lines={'else': TXT['courtesy']}))
ROOMS['bg_hq_lobby'] = room('bg_hq_lobby', 'Brightgate HQ', 'bg_hq', 'bg_campus', g, 'bg_lobby', objs, tuple(rp['arrival']))
keep_free = {tuple(c) for m in rp['marks'] if m['id'] in ('clip_holder', 'clip_juniper', 'dorian_lobby') for c in m['cells']}
for o in objs:
    if (o['x'], o['y']) in keep_free and o['kind'] in ('npc', 'prop', 'sign'): fail(f"bg_hq_lobby: {o['id']} stands on a kept-free tile")
room_check('bg_hq_lobby', g, objs, tuple(rp['arrival']), {'mat': (7, 15), 'desk_front': (11, 8), 'clip_holder': (2, 5), 'clip_juniper': (2, 6),
           'dorian_lobby': (5, 9), 'gate_front': (7, 5), 'rack_tap': (2, 5), 'west_lift': (3, 1), 'east_lift_tap': (12, 2)}, walk=RWALK | {'E'}, open_gates=True)
# CHIP_SECRECY (§13 item 1): with the gate shut, no lift is reachable; the gate is the only way.
shut = {(x, y) for x, y in rp['gates'][0]['cells']} | {(o['x'], o['y']) for o in objs if o['kind'] in ('npc', 'prop', 'sign') and g[o['y']][o['x']] in RWALK and not o.get('when')}
seen = reach(g, tuple(rp['arrival']), frozenset(shut), walk=RWALK | {'E'})
if (3, 1) in seen or (12, 1) in seen: fail('bg_hq_lobby: a lift is reachable with the lanyard gate shut')

# bg_review_in, floor 2, 16x14 (D2007): the one desk empty under the Outcomes Board, Rook's desk beside it, Dorian's own desk.
rp = RP['bg_review_in']; g, raw = from_packet(rp)
g = [r[:13] + ('E' if y == 1 else r[13]) + r[14:] for y, r in enumerate(g)]   # the stair to the wing shell
objs = [{'kind': 'warp', 'id': 'bg_review_mat', 'x': 7, 'y': 13, 'to': 'bg_hq_lobby', 'tx': 3, 'ty': 2, 'facing': 'down'},
        {'kind': 'prop', 'id': 'bg_review_stair', 'x': 13, 'y': 1, 'sprite': 'bg_none', 'name': 'the stair', 'lines': {SWITCHED: RL['f2_stair_staff'], 'else': RL['f2_stair']}},
        {'kind': 'trigger', 'id': 'bg_f2_arrive', 'x': 7, 'y': 11, 'r': 0, 'when': ['!' + SWITCHED, '!story.bg_f2_guest'], 'scene': 'bg_f2_arrive'}]
SC['bg_f2_arrive'] = [['say', '', RL['f2_arrive']], ['setFlag', 'story.bg_f2_guest', True]]
mk = {m['id']: m for m in rp['marks']}
for i, (x, y) in enumerate(mk['outcomes_board']['cells']):
    objs.append(P(f'bg_outcomes_board_{i}', x, y, 'bg_outcomes_board', name='the Outcomes Board', lines={SWITCHED: TXT['board'], 'else': RL['f2_board']}))
one = {tuple(c) for c in mk['one_desk']['cells']}
for y in range(len(raw)):
    for x in range(len(raw[0])):
        k = raw[y][x]
        if k == 'w': objs.append(P(f'bg_review_wire_{x}', x, y, 'tv_set', name='a wire set', lines={'!' + SWITCHED: RL['f2_wire']}))
        elif k in 'tD': objs.append(P(f'bg_review_desk_{x}_{y}', x, y, 'keep_desk', name='the one desk' if (x, y) in one else 'a desk',
                                      **({'lines': {'!' + SWITCHED: RL['f2_desk']}} if (x, y) in one else {})))
        elif k == 'p': objs.append(P(f'bg_review_planter_{x}_{y}', x, y, 'bg_hedge_planter', name='a planter'))
an = {a['id']: a for a in rp['anchors']}
for aid, nm, look in (('bg_rook_review', 'Rook', 'rook'), ('bg_dorian_review', 'Dorian Pell', 'dorian'), ('bg_quinn_review', 'Associate Quinn', 'quinn')):
    a = an[aid]
    guest = {'Dorian Pell': RL['f2_dorian'], 'Associate Quinn': RL['f2_quinn']}.get(nm)
    ln = {'else': TXT['wait_act3'] if nm != 'Dorian Pell' else TXT['wait_board']}
    if guest: ln = {SWITCHED: ln['else'], 'else': guest}
    objs.append(N(aid, nm, look, a['x'], a['y'], a['facing'], when=list(REVIEW_WHEN), lines=ln))
ROOMS['bg_review_in'] = room('bg_review_in', 'Brightgate HQ, floor 2', 'bg_hq', 'bg_campus', g, 'bg_review', objs, tuple(rp['arrival']))
ring = {n for p in one for n in nbrs(*p, 16, 14)} - one
if any((o['x'], o['y']) in ring for o in objs if o['kind'] == 'npc'): fail('bg_review_in: a body stands at the one desk (D2007)')
room_check('bg_review_in', g, objs, tuple(rp['arrival']), {'mat': (7, 13), 'board_tap': (6, 1), 'one_desk_front': (6, 4), 'dorian_front': (11, 10)}, walk=RWALK | {'E'}, open_gates=True)

# bg_gala_in, 16x18 (D1486): staging only; its door stays shut ("Closed for an event."), the room waits for Story's G1.
rp = RP['bg_gala_in']; g, raw = from_packet(rp)
g = [''.join('=' if raw[y][x] == 'd' else ch for x, ch in enumerate(r)) for y, r in enumerate(g)]   # the stage
door = DOORS['bg_gala']
objs = [{'kind': 'warp', 'id': 'bg_gala_mat', 'x': 7, 'y': 17, 'to': 'bg_campus', 'tx': door['x'], 'ty': door['y'], 'facing': 'down'}]
objs += furnish(raw, {'t': ('cafe_table', 'a round table', None), 'p': ('bg_hedge_planter', 'a planter', None)}, 'bg_gala')
a = rp['anchors'][0]
objs.append(N('bg_gala_host', 'Gala host', 'bg_courtesy', a['x'], a['y'], a['facing'], lines={'else': TXT['gala_host']}))
ROOMS['bg_gala_in'] = room('bg_gala_in', 'Gala Hall', 'bg_gala', 'bg_campus', g, 'bg_gala', objs, tuple(rp['arrival']))
room_check('bg_gala_in', g, objs, tuple(rp['arrival']), {'mat': (7, 17), 'host_side': (8, 3)})
for rid in ('bg_hq_lobby', 'bg_review_in', 'bg_gala_in'): ROOMS[rid]['wall'] = {'windows': []}

# ---------- slice 4: Hall 4, the Brightgate Trial Hall (VOLT), the storm tower (§5.2, §7, D1484, D2005) ----------
# Three rod plinths round an idle coil, one crew on each; each crew win lights its plinth's rod (the rod reads that crew's built
# beaten flag, trainer.<id>; no new save key); Master Ada Coil on the top dais under the dead rod, which never lights. Crew before
# the Master (the trainer's `crew` row). The Seal is given to whoever wins (SETTLED). Teams, lines and the bench rest are v0.2.1 §17.2.
HALL_WHEN = 'story.act>=2'   # D1484 (settled, Act 2)
TXT.update({
    'h4a': 'Volt rule one: go first or get hit first. Pick.',                 # ACT2_BEAT_SHEET_v3 §7.7 h4a (SETTLED lines)
    'h4b': 'Losing the race? Swap out. A fresh start is still a start.',      # h4b
    'h4c': 'Behind? A good type edge wins from behind. Show me.',             # h4c
    'ada_tail': "Storms aren't stopped, Cadet. They're moved.",               # H4's quiet tail (beat sheet v3, SETTLED)
    'ada_crew': '[PLACEHOLDER] Light the three rods first.',
    'rod_dark': '[PLACEHOLDER] A lightning rod on its plinth. Unlit.',
    'rod_lit': '[PLACEHOLDER] The rod is lit. A honey spark sits at its tip.',
    'dead_rod': '[PLACEHOLDER] The sky\'s rod. It has not lit in years.',
    'coil': '[PLACEHOLDER] A great coil, idle and cold.',
    'hall_closed': 'Closed for now.',
})
rp = RP['bg_hall_in']; g, raw = from_packet(rp)
g = [''.join('=' if raw[y][x] == 'd' else ch for x, ch in enumerate(r)) for y, r in enumerate(g)]   # the daises (walk)
door = DOORS['bg_hall']
objs = [{'kind': 'warp', 'id': 'bg_hall_mat', 'x': rp['mat'][0], 'y': rp['mat'][1], 'to': 'bg_oldtown', 'tx': door['x'], 'ty': door['y'], 'facing': 'down'}]
dead = {tuple(c) for c in rp['dead_rod']}
plin = {tuple(p['rod']): p['crew'] for p in rp['plinths']}
for y in range(len(raw)):
    for x in range(len(raw[0])):
        k = raw[y][x]
        if k == 'r' and (x, y) in dead: objs.append(P(f'bg_dead_rod_{x}', x, y, 'bg_rod', name="the sky's rod", lines={'else': TXT['dead_rod']}))
        elif k == 'r' and (x, y) in plin:
            crew = plin[(x, y)]
            objs.append(P(f'bg_rod_{crew}', x, y, 'bg_rod', name='a rod plinth', when=['!trainer.' + crew], lines={'else': TXT['rod_dark']}))
            objs.append(P(f'bg_rod_lit_{crew}', x, y, 'bg_rod_lit', name='a lit rod', when=['trainer.' + crew], lines={'else': TXT['rod_lit']}))
        elif k == 'r': objs.append(P(f'bg_rod_top_{x}_{y}', x, y, 'bg_rod', name='a rod'))   # the north plinth's second rod cell
        elif k == 'c':
            edge = any(raw[b][a] != 'c' for a, b in nbrs(x, y, 16, 24))
            objs.append(P(f'bg_coil_{x}_{y}', x, y, 'bg_coil', name='the idle coil', **({'lines': {'else': TXT['coil']}} if edge else {})))
        elif k == 'v': objs.append(P(f'bg_vane_stand_{x}', x, y, 'bg_vane', name='the old vane'))
        elif k == 's': objs.append(P(f'bg_hall_bench_{x}', x, y, 'keep_bench', name='a bench'))
TRAINERS_OUT = {}
TEAMS = rp.get('teams')   # v0.2.1 §17.2 (D2093-D2095, settling on their defaults): the specced rows, moves explicit
if not TEAMS: fail('bg_hall_in: the layout has no teams (BRIGHTGATE_LAYOUT v0.2.1 §17.2)')
for c in rp['crew']:
    t = TEAMS[c['id']]
    TRAINERS_OUT[c['id']] = {'name': t['name'], 'title': t['title'], 'map': 'bg_hall_in', 'x': c['x'], 'y': c['y'], 'facing': c['facing'],
                             'sight': t['sight'], 'ai': t['ai'], 'money': None, 'team': t['team'], 'lines': t['lines']}
    objs.append({'kind': 'trainer', 'id': c['id'], 'x': c['x'], 'y': c['y'], 'look': 'bg_hallcrew'})
m = rp['master']; t = TEAMS['hall4_master']
TRAINERS_OUT['hall4_master'] = {'name': t['name'], 'title': t['title'], 'map': 'bg_hall_in', 'x': m['x'], 'y': m['y'], 'facing': m['facing'],
                                'sight': t['sight'], 'ai': t['ai'], 'hall': True, 'seal': 'seal_brightgate', 'items': t.get('items', {}), 'onWin': t['onWin'],
                                'money': None, 'crew': [c['id'] for c in rp['crew']], 'team': t['team'], 'lines': dict(t['lines'], crew=TXT['ada_crew'])}
objs.append({'kind': 'trainer', 'id': 'hall4_master', 'x': m['x'], 'y': m['y'], 'look': 'bg_ada'})
# the bench rest (§17.2): the benches by the mat run the built rest step, free
BR = rp.get('bench_rest') or {}
SC['bg_bench_rest'] = [['say', '', BR.get('tap', '')], ['rest']]
for o in objs:
    # the inner bench of each pair is the one a holder can reach (the vane stands close the outer ones)
    if o['id'].startswith('bg_hall_bench_') and [o['x'], o['y']] in BR.get('cells', []) and o['x'] in (5, 10): o['lines'] = {'else': '@bg_bench_rest'}
SC['seal4'] = [['say', 'Master Ada Coil', TXT['ada_tail']], ['setFlag', 'story.ada_sky', True], ['setFlag', 'story.seal4', True]]
ROOMS['bg_hall_in'] = room('bg_hall_in', 'Brightgate Trial Hall', 'bg_hall', 'bg_oldtown', g, 'bg_hall', objs, tuple(rp['arrival']), music='hall',
                           wall={'windows': []})
for c in rp['crew']:   # each crew stands on the dais beside its rod (the packet's checker), and its rod is a neighbour
    rod = next(tuple(p['rod']) for p in rp['plinths'] if p['crew'] == c['id'])
    if g[c['y']][c['x']] != '=' or abs(rod[0] - c['x']) + abs(rod[1] - c['y']) != 1: fail(f"bg_hall_in: {c['id']} is not on its dais beside its rod")
if (m['x'], m['y'] - 1) not in dead: fail('bg_hall_in: the Master is not under the dead rod')
room_check('bg_hall_in', g, objs + [dict(o, kind='npc') for o in objs if o['kind'] == 'trainer'], tuple(rp['arrival']),
           {'mat': tuple(rp['mat']), 'master_front': (m['x'], m['y'] + 1), **{c['id']: (c['x'] + {'right': 1, 'left': -1, 'down': 0}[c['facing']], c['y'] + (1 if c['facing'] == 'down' else 0)) for c in rp['crew']}},
           walk=RWALK | {'='}, open_gates=True)
seen = reach(g, tuple(rp['arrival']), frozenset((o['x'], o['y']) for o in objs if o['kind'] in ('prop', 'trainer') and not o.get('when')), walk=RWALK | {'='})
from collections import deque
def steps(a, b):
    q, d = deque([a]), {a: 0}
    while q:
        u = q.popleft()
        for n in nbrs(*u, 16, 24):
            if n in seen and n not in d: d[n] = d[u] + 1; q.append(n)
    return d.get(b)
print('bg_hall_in door to the Master\'s front tile:', steps(tuple(rp['arrival']), (m['x'], m['y'] + 1)), 'steps (packet: 23 from the mat)')

# ---------- looks (PLACEHOLDER bodies; palette lock for Glimmerwell figures: white, soot, wine, crimson accent under 10%) ----------
LOOKS = {
    'bg_lantern_host': {'skin': '3', 'hair': 'bun', 'hairCol': 'd', 'outfit': 'jacket', 'outfitCol': 'w', 'accent': 'N'},   # §3.5: a civilian in a white jacket with soot trim
    'bg_store_clerk': {'skin': '2', 'hair': 'short', 'hairCol': 'k', 'outfit': 'apron', 'outfitCol': 'V', 'accent': 'w'},
    'bg_receptionist': {'skin': '2', 'hair': 'bob', 'hairCol': 'k', 'outfit': 'jacket', 'outfitCol': 'w', 'accent': 'N'},     # the fleet's built Receptionist look
    'bg_courtesy': {'skin': '4', 'hair': 'short', 'hairCol': 'd', 'outfit': 'jacket', 'outfitCol': 'w', 'accent': 'V'},       # B28: white top, soot trim, wine band
    'bg_swap_clerk': {'skin': '5', 'hair': 'short', 'hairCol': 'o', 'outfit': 'apron', 'outfitCol': 'V', 'accent': 'w'},      # the fleet's built roles
    'bg_mast_tech': {'skin': '3', 'hair': 'buzz', 'hairCol': 'n', 'outfit': 'overalls', 'outfitCol': 'h', 'accent': 'N', 'accessory': 'goggles'},
    'bg_bay_attendant': {'skin': '1', 'hair': 'pony', 'hairCol': 'y', 'outfit': 'vest', 'outfitCol': 'w', 'accent': 's'},
    'bg_swapcrew': {'skin': '6', 'hair': 'buzz', 'hairCol': 'k', 'outfit': 'overalls', 'outfitCol': 'N', 'accent': 'y'},
    'bg_supporter': {'skin': '2', 'hair': 'curls', 'hairCol': 'o', 'outfit': 'vest', 'outfitCol': 'V', 'accent': 'w'},          # wine vests (D1434)
    'bg_local': {'skin': '3', 'hair': 'bob', 'hairCol': 'd', 'outfit': 'cardigan', 'outfitCol': 'h', 'accent': 'w'},
    'bg_child': {'skin': '3', 'hair': 'pony', 'hairCol': 'd', 'outfit': 'overalls', 'outfitCol': 'b', 'accent': 'y'},
    'bg_elder': {'skin': '4', 'hair': 'bun', 'hairCol': 'w', 'outfit': 'cardigan', 'outfitCol': 'G', 'accent': 'o'},
    'bg_ada': {'skin': '4', 'hair': 'bun', 'hairCol': 'h', 'outfit': 'coat', 'outfitCol': 'n', 'accent': 'y'},              # B31: neutral (D1437), storm coat
    'bg_hallcrew': {'skin': '2', 'hair': 'short', 'hairCol': 'd', 'outfit': 'vest', 'outfitCol': 'n', 'accent': 'y'},
    'bg_odell': {'skin': '5', 'hair': 'short', 'hairCol': 'h', 'outfit': 'coat', 'outfitCol': 'F', 'accent': 'o'},           # B29: civilian, warm shadow, flame
}
CAST = [{'name': nm, 'faction': 'none', 'base': 50} for nm in (TXT['host_name'], 'Waiting Local', 'Lamplighter Odell', 'Parent', 'Child', 'Old Wick elder',
                                                              'Ada Coil', 'Master Ada Coil', 'Rod Tender', 'Line Runner', 'Sky Watcher',
                                                              'Quarter Chaser', 'Quay Hand', 'Jug Maker', 'Model Partner', 'Shuttle attendant')]   # Hall Masters are neutral (D1437)
for nm in (TXT['store_clerk_name'], 'Receptionist', 'Courtesy staff', 'Gala host', 'Courtesy greeter', 'Swap Clerk', 'Mast Tech', 'Glow Care Receptionist',
           'Bay Attendant', 'Calm Tower crew', 'Swap crew', 'Swap-crew foreman', 'Staff commuter', 'Supporter A', 'Supporter B', 'Census taker', 'Works hand'):
    CAST.append({'name': nm, 'faction': 'glimmer', 'base': 50, 'rankFlag': 'BRIGHTGATE_LAYOUT: city cast, ranks PLACEHOLDER until Story'})

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
for tid, row in TRAINERS_OUT.items(): walk_text(row['lines'], 'holder ' + tid)
for sid, steps in SC.items(): walk_text([st[2] for st in steps if st and st[0] == 'say'], 'scene ' + sid)
walk_text([KILNMOUTH_STOP.get('objs', []), SLICE_PATCH], 'shuttle', True)
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
    'speakers': {'Master Ada Coil': 'bg_ada'},
    'cast': CAST,
    'scenes': SC,
    'trainers': dict(TRAINERS_OUT, **DISTRICT_TRAINERS),
    'slicePatch': SLICE_PATCH,
    '_shuttle': {'state': 'live: D2090 and D2091 settled by Vincent, Wed Nov 4, 2026; the Kilnmouth stop (D2092) is placed in detail_zzzzz_kilnmouth.json'},
    'flags': {'story.reached_brightgate': 'set on the first arrival on Gate Plaza (beat sheet §9; ?debug=1 places in this build)',
              'story.bg_dipper': 'the mill pond dipper, after the encounter (any result)', 'story.bg_shuttle': 'the first shuttle ride, on the first arrival at 32,37 (D2090, D2105)',
              'story.bg_shuttle_hm': 'the first shuttle drop at Hearthmoor 18,8 (D2091, D2105)', 'story.bg_f2_guest': 'floor 2, first arrival as a guest',
              'story.seal4': 'Hall 4 won (Master Ada Coil, onWin seal4)', 'story.ada_sky': "H4's quiet tail played (beat sheet v3)",
              'story.bg_insign': 'the HQ plaque, first read (§9)', 'story.bg_crate': 'the CALM TOWER crate, first read', 'story.bg_vane': 'the dead vane, first read'},
}
for n in notes: print('note:', n)
if fails:
    print('FAIL'); [print(' -', f) for f in fails]; sys.exit(1)
open(OUT, 'w').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print(f'wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT)} bytes)')
print('build_brightgate: PASS')
