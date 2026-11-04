#!/usr/bin/env python3
"""HIGH_CHARITY_LAYOUT v0.3, phase 1 ("the capital, day one"): writes data/hc_city_v2.json.
v0.3 (D1354): the Keeper High Court stands on the Parade's south half, its front and wide steps facing Muster Road.

Run from the repo root: python3 tools/build_hc_city.py [--layout design/specs/high_charity_layout.json]
The layout JSON lives in the private design repo (gitignored `design/` checkout); it is read, never copied in whole.
Reads data/highcharity.json and data/detail_b4.json for the kept buildings' roof styles (read only).

The output is not part of MAPDATA. tools/gen_mapdata.py wraps it as data/hc_city_v2.js (window.PP_HC_V2), and game.js
merges it into WORLD only while the city preview is on (HC_CITY_V2, or ?debug=1&hccity=2). Normal play never sees it.

Every kept id stays (doors, NPCs, signs, rooms); kept objects are carried from the merged WORLD by id at boot (`keep`),
so their lines, shops and overlay patches survive. Only map, x, y (and a few door fields) change.
Exits non-zero if any check fails (sizes, mouths, doors, reachability, one-wide chokes, patrol legs, posts, budgets,
line limits, room walls).
"""
import argparse, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'hc_city_v2.json')
WALK = set('gPCZADsf')
SOLID = set('TRHUMwF')
RWALK = set('.=m')          # room floor, rug, mat
fails, notes = [], []

def fail(msg): fails.append(msg)
def note(msg): notes.append(msg)

ap = argparse.ArgumentParser()
ap.add_argument('--layout', default=os.path.join(ROOT, 'design', 'specs', 'high_charity_layout.json'))
args = ap.parse_args()
if not os.path.exists(args.layout):
    sys.exit('layout JSON not found: ' + args.layout + ' (clone the design repo to design/ or pass --layout)')
L = json.load(open(args.layout))
OLD = json.load(open(os.path.join(ROOT, 'data', 'highcharity.json')))
B4 = json.load(open(os.path.join(ROOT, 'data', 'detail_b4.json')))['slicePatch']['maps']['highcharity']['set']['roofs']
CH = {c['id']: c for c in L['chunks']}
OLD_MAP = OLD['maps']['highcharity']
OLD_OBJ = {o['id']: o for o in OLD_MAP['objs']}

# ---------- PLACEHOLDER copy (layout §11, FLAVOUR sample lines; Story signs them). Line limits: say 110, toast 40. ----------
TXT = {
    'hb1_child': "Why are the lanterns on in the day?",
    'hb1_parent': "So they can see us, love. So we're safe.",
    'hb2_box': "A small grey box hums at the top.",
    'hb3_board': "Good deeds this week: [FRIEND 1], [FRIEND 2], [FRIEND 3], [FRIEND 4], [FRIEND 5], [FRIEND 6].",   # FRIEND SLOT placeholders
    'hb4_poor': "Nobody's poor in High Charity. It says so on the sign.",
    'hb5_patrol': "Citizen. Lovely evening. Keep to the lit side, please.",
    'hb5_patrol_day': "Citizen. Lovely day.",                     # PLACEHOLDER: no day line in §11; Story to replace
    'hb6_mural': "The flowers here are newer paint.",
    'hb7_dock': "Lamp stock again. Funny. Lamps never used to weigh this much.",
    'hb8_gran': "My gran won a Seal before the war. They wrote her down. Then they came for her.",
    'hb9_bank': "CIVIC BANK · Open until dusk.",
    'hb10_editor': "Plain words. Who, where, what changed. We leave the why to the reader.",
    'hb10_spike': "Slips marked HOLD. One says PERMITS.",
    'hb10_reader': "Nothing's cut, holder. Some pages just wait a while.",
    'hb10_wire': "The printers never stop.",
    'hb11_ines': "Beds on the left, quiet on the right. When the wall's lit, we're on the wire.",
    'hb11_wall': "You've seen this wall. On the wire.",
    'hb11_visitor': "I came to see him in person. He waves at the end. He always waves.",
    'hb12_chute': "A brass chute on the desk. ORDERS DOWN.",    # PLACEHOLDER: Story writes the tap line (§11 HB12)
    'hb13_president': "Sit, holder. Everyone gets a chair in this room. That's the point of it.",
    'hb13_aide': "He's on the wire at eight. The visitor left early. Clear the second cup.",
    'hb13_commander': "Fernbrook's quiet, sir. The order went down. It came back signed.",
    'hb13_cup': "Two cups. One has a red rim.",
    'hb13_stamp': "LAMP STOCK. The ink is fresh.",
    'hb13_ledger': "SEAL ROLL, over an older label.",
    'hb15_door': "Chained. The lantern hook is empty.",
    'hb15_door_seven': "Chained. Ask the duty Keeper.",
    'hb15_keeper': "Shut since the war, holder. Come back with seven on the roll.",
    'gov_door': "By appointment.",
    'gov_line': "[PLACEHOLDER: Governor Merriden's Act 2 lines are Story's.]",
    'gov_stair': "[PLACEHOLDER] Upstairs is the President's floor. Not today, holder.",
    'court': "The Court is not sitting.",
    'closed': "Closed for now.",                                # PLACEHOLDER facade line (Store Row a-c, the Exchange, Ferry House, College)
    'boarded': "Boarded up.",                                   # PLACEHOLDER (Store Row d, the Glimmerwell named slot)
    'fish': "The stalls are packed away for now.",              # PLACEHOLDER
    'gallery': "[PLACEHOLDER] The gallery stair is roped off for now.",
    'apt_b': None,                                              # kept text
}
# District signposts one tile inside each mouth (names are placeholders until Story's name check, D1277).
DISTRICT = {'highcharity': 'LANTERN SQUARE', 'hc_civic': 'CHARTER HILL', 'hc_exchange': 'EXCHANGE QUARTER',
            'hc_waterfront': 'LANTERN QUAY', 'hc_college': 'COLLEGE GREEN'}

# ---------- looks (new cast; Keeper bodies reuse the built `officer`, `captain` and `clerk` looks) ----------
LOOKS = {
    'hc_child':     {'skin': '2', 'hair': 'pony', 'hairCol': 'y', 'outfit': 'overalls', 'outfitCol': 'b', 'accent': 'y'},
    'hc_parent':    {'skin': '2', 'hair': 'bob', 'hairCol': 'o', 'outfit': 'cardigan', 'outfitCol': 'c', 'accent': 'w'},
    'hc_oldholder': {'skin': '4', 'hair': 'bun', 'hairCol': 'w', 'outfit': 'cardigan', 'outfitCol': 'm', 'accent': 'y'},
    'hc_dockhand':  {'skin': '5', 'hair': 'buzz', 'hairCol': 'd', 'outfit': 'overalls', 'outfitCol': 'b', 'accent': 'o'},
    'hc_editor':    {'skin': '3', 'hair': 'short', 'hairCol': 'm', 'outfit': 'vest', 'outfitCol': 'm', 'accent': 'w', 'accessory': 'glasses'},
    'hc_resident':  {'skin': '1', 'hair': 'curls', 'hairCol': 'p', 'outfit': 'sweater', 'outfitCol': 'r', 'accent': 'y'},
    'hc_visitor':   {'skin': '6', 'hair': 'short', 'hairCol': 'd', 'outfit': 'raincoat', 'outfitCol': 'y', 'accent': 'w'},
    'hc_governor':  {'skin': '4', 'hair': 'short', 'hairCol': 'h', 'outfit': 'coat', 'outfitCol': 'g', 'accent': 'y'},
    'hc_president': {'skin': '3', 'hair': 'short', 'hairCol': 'w', 'outfit': 'coat', 'outfitCol': 'g', 'accent': 'y', 'accessory': 'sash'},   # PLACEHOLDER (LH-2 bust is open)
    'hc_aide':      {'skin': '2', 'hair': 'bun', 'hairCol': 'd', 'outfit': 'jacket', 'outfitCol': 'g', 'accent': 'w'},
}
SPEAKERS = {'Child': 'hc_child', 'Parent': 'hc_parent', 'Old holder': 'hc_oldholder', 'Dockhand': 'hc_dockhand',
            'Editor': 'hc_editor', 'Keeper reader': 'clerk', 'The President': 'hc_president', 'Aide': 'hc_aide',
            'Commander': 'captain', 'Duty Keeper': 'officer', 'Governor Merriden': 'hc_governor', 'Visitor': 'hc_visitor',
            'Resident': 'hc_resident'}

# ---------- helpers ----------
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

class Chunk:
    """One outdoor map being dressed: grid, objects, the tiles nothing may block, and a reachability guard."""
    def __init__(self, c):
        self.id, self.w, self.h = c['id'], c['w'], c['h']
        self.src = c
        g = [list(r) for r in c['grid']]
        # X (a mouth cell) takes the walk char of its inward neighbour; `X` is Cobblecrest's rock pillar in the game.
        for y in range(self.h):
            for x in range(self.w):
                if g[y][x] != 'X': continue
                ix = 1 if x == 0 else self.w - 2 if x == self.w - 1 else x
                iy = 1 if y == 0 else self.h - 2 if y == self.h - 1 else y
                g[y][x] = g[iy][ix] if g[iy][ix] in WALK else 'P'
        self.grid = [''.join(r) for r in g]
        self.arrival = tuple(c['arrival'])
        self.objs, self.ids = [], set()
        self.block = {}          # tile -> id of a blocker (npc, sign, prop on a walk tile)
        self.reserved = set()    # doors, warps, triggers, patrol legs, mouth cells: no blocker may stand there
        self.targets = {}        # name -> tile that must stay reachable from the arrival
        self.decals = 0

    def ch(self, x, y): return self.grid[y][x] if 0 <= x < self.w and 0 <= y < self.h else 'T'
    def walk(self, x, y): return self.ch(x, y) in WALK

    def add(self, o, blocks=None):
        if o['id'] in self.ids: fail(f"{self.id}: duplicate id {o['id']}")
        self.ids.add(o['id']); self.objs.append(o)
        k = o['kind']
        if blocks is None: blocks = k in ('npc', 'sign', 'prop') and self.walk(o['x'], o['y'])
        if blocks: self.block[(o['x'], o['y'])] = o['id']
        if k == 'decal': self.decals += 1
        return o

    def free(self, x, y):
        return self.walk(x, y) and (x, y) not in self.block and (x, y) not in self.reserved

    def safe_block(self, x, y):
        """True if a blocker on (x, y) keeps every target reachable."""
        if not self.free(x, y): return False
        b = frozenset(self.block) | {(x, y)}
        seen = reach(self.grid, self.arrival, b)
        return all(p in seen for p in self.targets.values())

    def scatter_ok(self, x, y, gap=3):
        """No new one-wide choke; dressing (gap 3) also keeps three tiles clear of every door and mouth."""
        if gap and any(max(abs(x - a), abs(y - b)) < gap for a, b in self.targets.values()): return False
        if not self.safe_block(x, y): return False
        b = frozenset(self.block) | {(x, y)}
        t = set(self.targets.values())
        for apc in articulation(self.grid, self.arrival, b) - t - {self.arrival}:
            cut = reach(self.grid, self.arrival, b | {apc})
            if any(p not in cut for p in t): return False
        return True

    def place_near(self, x, y, r=6, need_tap=False):
        """Nearest tile to (x, y) where a blocker can stand without cutting a target off (spiral by distance)."""
        cand = sorted(((abs(dx) + abs(dy), dy, dx) for dx in range(-r, r + 1) for dy in range(-r, r + 1)))
        for _, dy, dx in cand:
            nx, ny = x + dx, y + dy
            if not self.scatter_ok(nx, ny, gap=0): continue
            if need_tap and not any(self.free(a, b) for a, b in nbrs(nx, ny, self.w, self.h)): continue
            return nx, ny
        return None

def roof_entry(box, style):
    """Roof kit entry from a door box (x0, y0, x1, y1 spans roof and facade rows); y1 is the last R row."""
    return dict(style, x0=box[0], y0=box[1], x1=box[2], y1=box[3])

# ---------- the five chunks ----------
CHUNKS = {cid: Chunk(c) for cid, c in CH.items()}
for c in CHUNKS.values():
    if c.w > 64 or c.h > 48: fail(f'{c.id}: {c.w}x{c.h} over the 64x48 cap')
    if c.ch(*c.arrival) not in WALK: fail(f'{c.id}: arrival not walkable')

keep = {}        # "oldmap:id" -> {map, x, y, facing?, set?}
roofs = {cid: {} for cid in CHUNKS}

# Old building key -> b4 roof style (kept look); door ids that move keep their building's look.
B4_KEY = {'hc_airport': 'airport', 'hc_command': 'command', 'hc_barracks': 'barracks', 'hc_church': 'chapel',
          'hc_gym': 'gym', 'hc_marina': 'marina', 'hc_arena': 'arena', 'hc_apt': 'apt_a', 'hc_apt_b': 'apt_b',
          'hc_school': 'school', 'hc_hall': 'hall', 'hc_bank': 'bank', 'hc_mall': 'mall'}
STYLE_KEYS = ('col', 'roof', 'wall', 'door', 'win', 'trim', 'shape')
def b4style(k): return {s: B4[k][s] for s in STYLE_KEYS if s in B4[k]}
# New buildings on the roof kit (MVP: P1 facades use the kit; A10-A12 big facades are PLACEHOLDER kit dressing).
NEW_STYLE = {
    'hc_lantern':      {'roof': 'roof_teal', 'wall': 'wall_tile_s', 'door': 'door_tall_t', 'win': 'win_tall', 'trim': 'y', 'shape': 'dome'},
    'hc_trial':        {'roof': 'roof_muster', 'wall': 'wall_muster', 'door': 'door_chained', 'win': 'win_slit', 'trim': 'd', 'shape': 'flat'},
    'hc_gov':          {'roof': 'roof_slab_h', 'wall': 'wall_columns', 'door': 'door_heavy', 'win': 'win_tall', 'trim': 'y', 'shape': 'gable+emblem'},
    'hc_court':        {'roof': 'roof_slab_h', 'wall': 'wall_columns', 'door': 'door_heavy', 'trim': 'w', 'shape': 'gable'},
    'hc_exch':         {'roof': 'roof_slab_h', 'wall': 'wall_columns', 'door': 'door_heavy', 'win': 'win_arch', 'trim': 'y', 'shape': 'gable+clock'},
    'hc_news':         {'roof': 'roof_flat_m', 'wall': 'wall_panel_m', 'door': 'door_glass', 'win': 'win_band', 'trim': 'h', 'shape': 'flat+mast'},
    'hc_store_a':      {'roof': 'roof_flat_d', 'wall': 'wall_glass', 'door': 'door_sliding', 'win': 'awning_y', 'trim': 'w', 'shape': 'flat'},
    'hc_store_b':      {'roof': 'roof_flat_d', 'wall': 'wall_glass', 'door': 'door_sliding', 'win': 'awning_r', 'trim': 'w', 'shape': 'flat'},
    'hc_store_c':      {'roof': 'roof_flat_d', 'wall': 'wall_glass', 'door': 'door_sliding', 'win': 'awning_b', 'trim': 'w', 'shape': 'flat'},
    'hc_store_d':      {'roof': 'roof_flat_d', 'wall': 'wall_stucco_o', 'door': 'door_blue', 'trim': 'h', 'shape': 'flat'},
    'hc_fish':         {'roof': 'roof_board_t', 'wall': 'wall_piles', 'door': 'door_dutch', 'win': 'win_porthole', 'trim': 'w', 'shape': 'gable'},
    'hc_boathouse':    {'roof': 'roof_board_t', 'wall': 'wall_boat', 'door': 'door_dutch', 'win': 'win_porthole', 'trim': 'w', 'shape': 'gable'},
    'hc_college_hall': {'roof': 'roof_shingle_p', 'wall': 'wall_yellow', 'door': 'door_red', 'win': 'win_tall', 'trim': 'o', 'shape': 'gable+clock'},
    'hc_library':      {'roof': 'roof_shingle_p', 'wall': 'wall_yellow', 'door': 'door_red', 'win': 'win_shutter', 'trim': 'o', 'shape': 'gable'},
}

# Doors: kept ids carry from WORLD; new doors are authored here.
GOV1 = '!story.side=glimmer & story.act>=2'   # the Governor's House floors 1-2 (layout v0.4 §5.3); floor 3 is GOV3
NEW_DOORS = {
    'hc_gov':  {'to': 'hc_gov_1', 'tx': 7, 'ty': 14, 'facing': 'up', 'need': GOV1, 'deny': TXT['gov_door']},   # D1426/D1439: Act 2 on
    'hc_news': {'to': 'hc_news_1', 'tx': 7, 'ty': 14, 'facing': 'up'},
    'hc_trial': {'need': 'story.hc_trial_called', 'deny': {'seals>=7': TXT['hb15_door_seven'], 'else': TXT['hb15_door']}},   # §5.2 keyed deny; seals>= counts Seals held (D1329)
    'hc_court': {'need': 'story.hc_no_room', 'deny': TXT['court']},
    'hc_exch': {'need': 'story.hc_no_room', 'deny': TXT['closed']},
    'hc_store_a': {'need': 'story.hc_no_room', 'deny': TXT['closed']},
    'hc_store_b': {'need': 'story.hc_no_room', 'deny': TXT['closed']},
    'hc_store_c': {'need': 'story.hc_no_room', 'deny': TXT['closed']},
    'hc_store_d': {'need': 'story.hc_no_room', 'deny': TXT['boarded']},
    'hc_fish': {'need': 'story.hc_no_room', 'deny': TXT['fish']},
    'hc_boathouse': {'need': 'story.hc_no_room', 'deny': TXT['closed']},
    'hc_college_hall': {'need': 'story.hc_no_room', 'deny': TXT['closed']},
    'hc_library': {'need': 'story.hc_no_room', 'deny': TXT['closed']},
}
DOOR_SIGN = {   # kept sign id per kept door; new doors get a new sign
    'hc_airport': 'hc_sign_airport', 'hc_command': 'hc_sign_command', 'hc_barracks': 'hc_sign_barracks', 'hc_church': 'hc_sign_church',
    'hc_gym': 'hc_sign_gym', 'hc_marina': 'hc_sign_marina', 'hc_arena': 'hc_sign_arena', 'hc_apt': 'hc_sign_apt', 'hc_school': 'hc_sign_school',
    'hc_hall': 'hc_sign_hall', 'hc_bank': 'hc_sign_bank', 'hc_lantern': 'hc_sign_lantern', 'hc_mall': 'hc_sign_mall'}
NEW_SIGN_TEXT = {
    'hc_gov': "GOVERNOR'S HOUSE · Charter Hill.", 'hc_news': 'BLOCK NEWS HOUSE · Who. Where. What changed.',
    'hc_trial': 'THE MUSTER HALL · Shut since the war.', 'hc_court': 'KEEPER HIGH COURT.', 'hc_exch': 'THE EXCHANGE.',
    'hc_store_a': 'LAMP AND WICK.', 'hc_store_b': 'BRIGHT TAILOR.', 'hc_store_c': 'ACORN GROCER.', 'hc_store_d': 'TO LET.',
    'hc_fish': 'QUAY FISH MARKET.', 'hc_boathouse': 'FERRY HOUSE.', 'hc_college_hall': 'HIGH CHARITY COLLEGE · Great Hall.',
    'hc_library': 'COLLEGE LIBRARY.'}
# Old door id -> new mat return (moved rooms); the room keeps its grid.
ROOM_OF = {'hc_airport': ['hc_airport_in'], 'hc_command': ['hc_command_in'], 'hc_barracks': ['hc_barracks_in'], 'hc_church': ['hc_church_in'],
           'hc_gym': ['hc_gym_in'], 'hc_marina': ['hc_marina_in'], 'hc_arena': ['hc_arena_in'], 'hc_apt': ['hc_apt_in'], 'hc_school': ['hc_school_in'],
           'hc_hall': ['hc_hall_in'], 'hc_bank': ['hc_bank_in'], 'hc_mall': ['hc_mall_1', 'hc_mall_2']}
mat_moves = {}

for cid, c in CHUNKS.items():
    for d in c.src['doors']:
        did, x, y = d['id'], d['x'], d['y']
        if not c.walk(x, y): fail(f'{cid}: door {did} tile not walkable')
        if c.ch(x, y - 1) != 'H': fail(f'{cid}: door {did} has no facade above')
        c.reserved.add((x, y)); c.targets['door:' + did] = (x, y)
        style = b4style(B4_KEY[did]) if did in B4_KEY else NEW_STYLE.get(did)
        if not style: fail(f'{cid}: no roof style for {did}')
        bx = d['box']; y1 = max(yy for yy in range(bx[1], bx[3] + 1) if c.ch(bx[0], yy) == 'R')
        roofs[cid][did.replace('hc_', '')] = roof_entry([bx[0], bx[1], bx[2], y1], style or {})
        if did in OLD_OBJ:
            keep['highcharity:' + did] = {'map': cid, 'x': x, 'y': y}
            for rid in ROOM_OF.get(did, []):
                mat_moves[rid] = {'outdoor': cid, 'mat': rid + '_mat', 'to': cid, 'tx': x, 'ty': y}
        else:
            o = {'kind': 'door', 'id': did, 'x': x, 'y': y}
            o.update(NEW_DOORS.get(did, {}))
            if did == 'hc_lantern': pass
            c.add(o, blocks=False)
    # every R/H cell must belong to a roof entry (the kit paints by entry)
    covered = set()
    for r in roofs[cid].values():
        for yy in range(r['y0'], r['y1'] + 1):
            for xx in range(r['x0'], r['x1'] + 1): covered.add((xx, yy))
    for y in range(c.h):
        for x in range(c.w):
            if c.ch(x, y) == 'R' and (x, y) not in covered: fail(f'{cid}: roof cell {(x, y)} has no building entry'); break

# The grand Lantern House door is kept (id hc_lantern) and points into the rebuilt 16x22 room.
keep['highcharity:hc_lantern'] = {'map': 'highcharity', 'x': 32, 'y': 12, 'set': {'tx': 8, 'ty': 20}}
keep['highcharity:hc_apt_c'] = None     # retired (locked, no room), §3.3

# Mouths: five warps per mouth, each to the same offset in its partner, one tile inward, facing away from the edge.
def mouth_cells(c, m):
    a, b = m['span']
    return [{'N': (t, 0), 'S': (t, c.h - 1), 'W': (0, t), 'E': (c.w - 1, t)}[m['edge']] for t in range(a, b + 1)]
INWARD = {'N': (0, 1, 'down'), 'S': (0, -1, 'up'), 'W': (1, 0, 'right'), 'E': (-1, 0, 'left')}
for cid, c in CHUNKS.items():
    for m in c.src['mouths']:
        if m.get('warp_obj'):
            c.reserved.add(tuple(m['warp_obj'])); c.targets['mouth:' + m['id']] = tuple(m['warp_obj']); continue
        part = CHUNKS[m['to']]; pm = [q for q in part.src['mouths'] if q['id'] == m['to_mouth']]
        if not pm or pm[0]['to'] != cid: fail(f"{cid}: mouth {m['id']} has no matching partner"); continue
        mine, theirs = mouth_cells(c, m), mouth_cells(part, pm[0])
        if len(mine) != len(theirs): fail(f"{cid}: mouth {m['id']} width differs from {m['to_mouth']}"); continue
        dx, dy, face = INWARD[pm[0]['edge']]
        for i, ((x, y), (px, py)) in enumerate(zip(mine, theirs)):
            if not c.walk(x, y): fail(f"{cid}: mouth cell {(x, y)} not walkable")
            c.add({'kind': 'warp', 'id': f"{m['id']}_{i}", 'x': x, 'y': y, 'to': m['to'], 'tx': px + dx, 'ty': py + dy, 'facing': face}, blocks=False)
            c.reserved.add((x, y))
        c.targets['mouth:' + m['id']] = mine[len(mine) // 2]
    # The arrival column for a chunk's own landing tiles stays clear too.
    c.reserved.add(c.arrival)

# The kept coach warp, gate trigger and Keeper Moss (Lantern Square, same tiles).
LS = CHUNKS['highcharity']
for oid in ('hc_south', 'hc_gate'):
    o = OLD_OBJ[oid]; keep['highcharity:' + oid] = {'map': 'highcharity', 'x': o['x'], 'y': o['y']}; LS.reserved.add((o['x'], o['y']))
LS.targets['coach'] = (32, 37)

# ---------- patrol beats (§8.3): legs are reserved before anything else is placed ----------
for cid, c in CHUNKS.items():
    for pt in c.src['patrols']:
        cells = legs([tuple(p) for p in pt['route']])
        for p in cells:
            if not c.walk(*p): fail(f"{cid}: patrol {pt['id']} crosses solid {p}")
            if p in [t for k, t in c.targets.items()]: fail(f"{cid}: patrol {pt['id']} stands on a door or mouth {p}")
        c.reserved.update(cells)

# ---------- kept people and props on Lantern Square (§3.3 and §8.1) ----------
def keep_at(oid, cid, x, y, search=0, **kw):
    c = CHUNKS[cid]
    if search and not c.safe_block(x, y):
        spot = c.place_near(x, y, r=search, need_tap=True)
        if spot: note(f'{cid}: kept {oid} wanted {(x, y)}, stands at {spot}'); x, y = spot
    if not c.safe_block(x, y): fail(f'{cid}: kept {oid} at {(x, y)} would block or is taken')
    c.block[(x, y)] = oid; c.ids.add(oid)
    keep['highcharity:' + oid] = dict({'map': cid, 'x': x, 'y': y}, **kw)

keep_at('hc_moss', 'highcharity', 30, 36)
keep_at('hc_shop', 'highcharity', 48, 26, facing='down')
keep_at('hc_stall_l', 'highcharity', 47, 27)
keep_at('hc_stall_r', 'highcharity', 49, 27)
keep_at('hc_baker', 'highcharity', 51, 27, facing='left')       # spec 50,27 sits beside the stall row; one tile east keeps the stall tappable
keep_at('hc_kite', 'highcharity', 40, 26, facing='left')
keep['highcharity:hc_snack'] = {'map': 'highcharity', 'x': 16, 'y': 38}
# The General Store mark (rule 10) and the town board travel with the market.
keep_at('hc_store_board', 'highcharity', 46, 26)
keep_at('hc_board', 'highcharity', 43, 26)
keep_at('hc_sign_plaza', 'highcharity', 40, 29, search=4)
keep_at('hc_lantern_sign', 'highcharity', 31, 13)               # the Lantern House healing mark beside the grand door (rule 10)
keep_at('hc_lantern_planter', 'highcharity', 34, 13)
# Props that move chunk: the airship to the Airship Field pads, the buoy to the marina basin.
AP = CHUNKS['hc_civic']
pads = [(x, y) for y in range(AP.h) for x in range(AP.w) if AP.ch(x, y) == 'A']
pad = min((p for p in pads if p[0] > 40), key=lambda p: (p[1], p[0]), default=None)
if pad and AP.safe_block(*pad): AP.block[pad] = 'hc_airship'; keep['highcharity:hc_airship'] = {'map': 'hc_civic', 'x': pad[0], 'y': pad[1]}
else: fail('hc_civic: no pad for the airship')
WF = CHUNKS['hc_waterfront']
water = [(x, y) for y in range(WF.h) for x in range(WF.w) if WF.ch(x, y) == 'w' and 28 <= x <= 40 and y <= 16]
keep['highcharity:hc_buoy'] = {'map': 'hc_waterfront', 'x': water[0][0], 'y': water[0][1]} if water else None
# Old b4 porch props that are not carried are dropped (the v2 dressing replaces them); every other kept id is above.

# ---------- signs: kept door signs move beside their doors; new doors get a new sign ----------
for cid, c in CHUNKS.items():
    for d in c.src['doors']:
        did = d['id']
        if did in ('hc_lantern', 'hc_apt_b', 'hc_trial'): continue   # the Lantern House carries its healing mark; B keeps no sign; the Hall has its notice
        spot = c.place_near(d['x'] + 1, d['y'] + 1, r=3, need_tap=True)
        if not spot: fail(f'{cid}: no tile for the {did} sign'); continue
        if did in DOOR_SIGN:
            keep_at(DOOR_SIGN[did], cid, *spot)
        else:
            c.add({'kind': 'sign', 'id': 'hc2_sign_' + did[3:], 'x': spot[0], 'y': spot[1], 'text': NEW_SIGN_TEXT[did]})
# HB9: the bank hours "until dusk".
bank = [d for d in CHUNKS['hc_exchange'].src['doors'] if d['id'] == 'hc_bank'][0]
s = CHUNKS['hc_exchange'].place_near(bank['x'] - 1, bank['y'] + 1, r=3, need_tap=True)
CHUNKS['hc_exchange'].add({'kind': 'sign', 'id': 'hc2_bank_hours', 'x': s[0], 'y': s[1], 'text': TXT['hb9_bank']})

# District signposts and gate arches one tile inside each mouth (A22 arch PLACEHOLDER, A23 signpost reuse).
for cid, c in CHUNKS.items():
    for m in c.src['mouths']:
        if m.get('warp_obj'): continue
        cells = mouth_cells(c, m); dx, dy, _ = INWARD[m['edge']]
        mx, my = cells[len(cells) // 2]
        # arch: 80x48 decal, top-left anchored; centred over the 5-wide mouth, two rows inside
        if m['edge'] in 'NS':
            c.add({'kind': 'decal', 'id': f"hc2_arch_{m['id']}", 'x': cells[0][0], 'y': (1 if m['edge'] == 'N' else c.h - 4), 'sprite': 'hc_gate_arch'})
        sx, sy = cells[-1][0] + (1 if m['edge'] in 'NS' else 0) + dx, cells[-1][1] + (1 if m['edge'] in 'WE' else 0) + dy
        spot = c.place_near(sx, sy, r=4, need_tap=True)
        if spot:
            to = DISTRICT[m['to']]
            c.add({'kind': 'sign', 'id': f"hc2_post_{m['id']}", 'x': spot[0], 'y': spot[1], 'sprite': 'signpost',
                   'text': f"{DISTRICT[cid]} · This way: {to}."})
        else: fail(f"{cid}: no tile for the {m['id']} signpost")

# ---------- tank posts (§4.4): one parked tank on each 4x2 bay, drawn across it (ox shifts the 64 px art) ----------
for cid, c in CHUNKS.items():
    tanks = 0
    for tp in c.src['posts']:
        x0, y0, x1, y1 = tp['bay']
        if any(c.ch(x, y) != 'U' for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)): fail(f"{cid}: post {tp['id']} not on a kerb bay")
        variant = 'command' if 'command' in tp['kind'] else 'escort'
        c.add({'kind': 'prop', 'id': 'hc2_' + tp['id'], 'x': x0 + 1, 'y': y1, 'ox': 8, 'sprite': 'hc_tank_' + variant,
               'name': 'Keeper tank'}, blocks=False)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1): c.block.setdefault((x, y), 'hc2_' + tp['id'])
        tanks += 1
    if tanks > 3: fail(f'{cid}: {tanks} tank posts over the 3 per chunk budget')

# ---------- parked cars (§4.3) on horizontal kerb-bay runs, a car every 3 tiles; never on a tank post ----------
CAR_TARGET = {'highcharity': 10, 'hc_civic': 8, 'hc_exchange': 24, 'hc_waterfront': 6, 'hc_college': 0}
COLOURS = ['b', 'r', 't', 'y', 'w']
for cid, c in CHUNKS.items():
    want, slots = CAR_TARGET[cid], []
    for y in range(c.h):
        x = 0
        while x < c.w:
            if c.ch(x, y) == 'U' and c.ch(x + 1, y) == 'U' and (x, y) not in c.block and (x + 1, y) not in c.block:
                slots.append((x, y)); x += 3
            else: x += 1
    # spread: take every other slot first, then fill the rest (about half the bays filled reads busy and tidy)
    order = slots[::2] + slots[1::2]
    n = 0
    for (x, y) in order:
        if n >= want: break
        if cid == 'hc_exchange' and (x, y) == (56, 44) or (x + 1, y) == (56, 44): continue   # veh_slot_glim_c2 stays empty
        col = COLOURS[(x * 7 + y * 3) % len(COLOURS)]
        c.add({'kind': 'prop', 'id': f'hc2_car_{cid[3:] if cid != "highcharity" else "sq"}_{n}', 'x': x, 'y': y, 'ox': 8,
               'sprite': 'hc_car_' + col, 'name': 'parked car'}, blocks=False)
        c.block[(x, y)] = c.block[(x + 1, y)] = 'car'
        n += 1
    if n < want: note(f'{cid}: {n} cars placed of {want} (bays ran out)')

# ---------- lamp posts with the grey box (HB2), on medians every 6 tiles (solid tiles: no reachability cost) ----------
for cid, c in CHUNKS.items():
    k = 0
    for y in range(c.h):
        for x in range(c.w):
            if c.ch(x, y) == 'M' and (x, y) not in c.block and (x % 6 == 0 if c.ch(x + 1, y) == 'M' or c.ch(x - 1, y) == 'M' else y % 6 == 0):
                c.add({'kind': 'prop', 'id': f'hc2_lamp_{cid}_{k}', 'x': x, 'y': y, 'sprite': 'hc_lamp_box', 'lines': {'else': TXT['hb2_box']}}, blocks=False)
                c.block[(x, y)] = 'lamp'; k += 1
    # sidewalk lamps: P beside a kerb bay, every 6 along, only where it keeps every way open
    for y in range(c.h):
        for x in range(c.w):
            if (x + y) % 6 or c.ch(x, y) != 'P': continue
            if not any(c.ch(a, b) == 'U' for a, b in nbrs(x, y, c.w, c.h)): continue
            if c.scatter_ok(x, y):
                c.add({'kind': 'prop', 'id': f'hc2_lamp_{cid}_{k}', 'x': x, 'y': y, 'sprite': 'hc_lamp_box', 'lines': {'else': TXT['hb2_box']}}); k += 1

# ---------- noon lanterns: a lit finial on every roof but the Muster Hall's (A34) ----------
for cid in CHUNKS:
    c = CHUNKS[cid]
    for key, r in roofs[cid].items():
        if key == 'trial': continue
        c.add({'kind': 'decal', 'id': f'hc2_finial_{key}', 'x': (r['x0'] + r['x1']) // 2, 'y': r['y0'], 'sprite': 'hc_finial'})

# ---------- landmarks, parks and the Hook 1 tells ----------
def prop(cid, oid, x, y, sprite, r=3, **kw):
    c = CHUNKS[cid]; spot = c.place_near(x, y, r=r, need_tap=bool(kw.get('lines') or kw.get('scene')))
    if not spot: fail(f'{cid}: no tile for {oid} near {(x, y)}'); return None
    if spot != (x, y) and kw.pop('_exact', False): note(f'{cid}: {oid} moved {(x, y)} -> {spot}')
    return c.add(dict({'kind': 'prop', 'id': oid, 'x': spot[0], 'y': spot[1], 'sprite': sprite}, **kw))

def npc(cid, oid, name, look, x, y, facing='down', r=4, **kw):
    c = CHUNKS[cid]; spot = c.place_near(x, y, r=r, need_tap=True)
    if not spot: fail(f'{cid}: no tile for {oid}'); return None
    if spot != (x, y): note(f'{cid}: {oid} wanted {(x, y)}, stands at {spot}')
    return c.add(dict({'kind': 'npc', 'id': oid, 'name': name, 'look': look, 'x': spot[0], 'y': spot[1], 'facing': facing}, **kw))

SC = {}   # scenes: a hook plays once (its setFlag marks it played), then the object's plain line repeats

# Lantern Square: the Muster Hall's chained door (HB15), its two duty Keepers and the notice; the Kindness Board (HB3);
# the noon lanterns (HB1); Nobody's poor (HB4); the Square planting.
for oid, x in (('hc_duty_w', 8), ('hc_duty_e', 12)):
    npc('highcharity', oid, 'Duty Keeper', 'officer', x, 29, facing='down', r=0, lines={'else': TXT['hb15_keeper']}, still=True)
prop('highcharity', 'hc_trial_notice', 14, 29, 'slab_sign', r=0, lines={'else': TXT['hb15_door']})
SC['hc2_board'] = [['say', '', TXT['hb3_board']], ['setFlag', 'story.hc_board', True]]
prop('highcharity', 'hc_kindness', 21, 26, 'hc_kindness_board', r=0, scene='hc2_board', lines={'else': TXT['hb3_board']}, name='the Kindness Board')
SC['hc2_noon'] = [['say', 'Child', TXT['hb1_child']], ['say', 'Parent', TXT['hb1_parent']], ['setFlag', 'story.hc_noon', True]]
npc('highcharity', 'hc_child', 'Child', 'hc_child', 14, 25, facing='up', scene='hc2_noon', lines={'else': TXT['hb1_child']}, still=True)
c0 = CHUNKS['highcharity']; ch_ = [o for o in c0.objs if o['id'] == 'hc_child'][0]
npc('highcharity', 'hc_parent', 'Parent', 'hc_parent', ch_['x'] + 1, ch_['y'], facing='up', r=2, scene='hc2_noon', lines={'else': TXT['hb1_parent']}, still=True)
npc('highcharity', 'hc_resident', 'Resident', 'hc_resident', 44, 29, facing='down', lines={'else': TXT['hb4_poor']}, still=True)
prop('highcharity', 'hc2_statue', 52, 25, 'lm_statue')
prop('highcharity', 'hc2_fountain', 24, 30, 'fountain_small')
for i, (x, y) in enumerate([(19, 30), (39, 30), (60, 30), (18, 23), (60, 24)]):
    prop('highcharity', f'hc2_sq_bench_{i}', x, y, 'bench_long', r=2)

# Charter Hill: the Parade flag row, the Lantern Muster mural (HB6), LAMP STOCK crates and the dockhand (HB7).
FLAG_Y = next(l['y'] for l in CH['hc_civic']['landmarks'] if l['id'] == 'flag_row')     # v0.3: row 20, between the Governor's House and the Court
for i, x in enumerate(range(22, 43, 4)): prop('hc_civic', f'hc2_flag_{i}', x, FLAG_Y, 'flag_pole', r=1)
# v0.3 (D1354): the High Court's wide steps, two rows deep across its front, down to Muster Road's north sidewalk.
# Decals (A14 PLACEHOLDER, 16x32 each from the top step row): drawn on walk tiles, never block, never talk.
court = [d for d in CH['hc_civic']['doors'] if d['id'] == 'hc_court'][0]
cx0, _, cx1, cy1 = court['box']
for i, x in enumerate(range(cx0, cx1 + 1)):
    for y in (cy1 + 1, cy1 + 2):
        if not CHUNKS['hc_civic'].walk(x, y): fail(f'hc_civic: Court step {(x, y)} is not a walk tile')
    CHUNKS['hc_civic'].add({'kind': 'decal', 'id': f'hc2_court_step_{i}', 'x': x, 'y': cy1 + 1,
                            'sprite': 'hc_court_steps_w' if x == cx0 else 'hc_court_steps_e' if x == cx1 else 'hc_court_steps'}, blocks=False)
SC['hc2_mural'] = [['say', '', TXT['hb6_mural']], ['setFlag', 'story.hc_mural', True]]
mur = CHUNKS['hc_civic'].add({'kind': 'prop', 'id': 'hc_mural', 'x': 50, 'y': 20, 'sprite': 'hc_mural', 'scene': 'hc2_mural',
                               'lines': {'else': TXT['hb6_mural']}, 'name': 'The Lantern Muster mural'}, blocks=False)
if not CHUNKS['hc_civic'].free(49, 20): note('hc_civic: the mural tap tile 49,20 is not free')
for i, (x, y) in enumerate([(6, 10), (5, 10), (6, 9)]): prop('hc_civic', f'hc2_lampstock_{i}', x, y, 'keep_crate', r=1)
SC['hc2_lampstock'] = [['say', 'Dockhand', TXT['hb7_dock']], ['setFlag', 'story.hc_lampstock', True]]
npc('hc_civic', 'hc_dockhand', 'Dockhand', 'hc_dockhand', 8, 10, facing='left', scene='hc2_lampstock', lines={'else': TXT['hb7_dock']}, still=True)
for i, (x, y) in enumerate([(14, 22), (50, 30), (28, 40), (40, 40)]): prop('hc_civic', f'hc2_hill_tree_{i}', x, y, 'lm_big_tree', r=3)

# Exchange Quarter: a statue in the Counting Garden, cafe tables on Store Row, a bike rack.
prop('hc_exchange', 'hc2_counting_statue', 32, 40, 'lm_statue', r=4)
for i, x in enumerate((24, 30, 36)): prop('hc_exchange', f'hc2_cafe_{i}', x, 33, 'cafe_table', r=2)
prop('hc_exchange', 'hc2_bike', 15, 34, 'bike', r=2)
prop('hc_exchange', 'hc2_news_poster', 50, 16, 'poster_stand', r=3, lines={'else': 'A Block News bill. BLOCK NEWS · Who. Where. What changed.'})

# Lantern Quay: rope coils and nets on the piers, the moored ferry spot noted for phase 2.
for i, (x, y) in enumerate([(12, 26), (12, 30), (12, 34)]): prop('hc_waterfront', f'hc2_rope_{i}', x, y, 'rope_coil', r=5)
prop('hc_waterfront', 'hc2_net', 30, 30, 'net_hang', r=3)
SC['hc2_gran'] = [['say', 'Old holder', TXT['hb8_gran']], ['setFlag', 'story.hc_gran', True]]

# College Green: the Quad clock statue, the park, the old holder's bench (HB8, day tile as a fixed anchor in phase 1).
prop('hc_college', 'hc2_college_clock', 36, 24, 'lm_statue', r=2)
npc('hc_college', 'hc_oldholder', 'Old holder', 'hc_oldholder', 16, 40, facing='right', scene='hc2_gran', lines={'else': TXT['hb8_gran']}, still=True)
for i, (x, y) in enumerate([(15, 40), (30, 36), (38, 30)]): prop('hc_college', f'hc2_park_bench_{i}', x, y, 'bench_long', r=2)
for i, (x, y) in enumerate([(5, 26), (20, 30), (42, 42), (6, 44)]): prop('hc_college', f'hc2_park_tree_{i}', x, y, 'lm_big_tree', r=3)

# Parks are spotless: clipped hedges and flowerbeds on open grass, a few per chunk, never on a way through.
# The Court's old corner (v0.3, D1354; the layout's §7.6) stays plain grass: nothing is placed there.
VACANT = {'hc_civic': [(2, 38, 14, 44)]}
def vacant(cid, x, y): return any(x0 <= x <= x1 and y0 <= y <= y1 for x0, y0, x1, y1 in VACANT.get(cid, []))
for cid, c in CHUNKS.items():
    k = 0
    for y in range(2, c.h - 2):
        for x in range(2, c.w - 2):
            if k >= 14: break
            if c.ch(x, y) != 'g' or (x * 7 + y * 13) % 29 or vacant(cid, x, y): continue
            if c.scatter_ok(x, y):
                c.add({'kind': 'prop', 'id': f'hc2_plant_{cid}_{k}', 'x': x, 'y': y, 'sprite': ('hedge_planter', 'flowerbed', 'planter_round')[k % 3]})
                k += 1

# ---------- patrol bodies (§8.3): Keeper green, the Hook 1 greeting; a pair starts half a loop apart ----------
PAIR = {'pt_c0_blvd', 'pt_c1_parade', 'pt_c1_road', 'pt_c2_blvd', 'pt_c3_prom'}
for cid, c in CHUNKS.items():
    for pt in c.src['patrols']:
        route = [list(p) for p in pt['route']]
        n = 2 if pt['id'] in PAIR else 1
        for i in range(n):
            start = 0 if i == 0 else len(route) // 2
            x, y = route[start]
            o = {'kind': 'npc', 'id': f"hc2_{pt['id']}_{'ab'[i]}", 'name': 'Keeper', 'look': 'officer', 'x': x, 'y': y, 'facing': 'down',
                 'patrol': route, 'patrolStart': start,
                 'lines': {'phase:dusk|phase:night': TXT['hb5_patrol'], 'else': TXT['hb5_patrol_day']}}
            if pt['when']: o['when'] = list(pt['when'])
            c.add(o, blocks=False)

# ---------- the final outdoor checks ----------
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
    people = sum(1 for o in c.objs if o['kind'] == 'npc') + sum(1 for v in keep.values() if v and v['map'] == cid and v.get('_npc'))
    nobj = len(c.objs) + sum(1 for v in keep.values() if v and v['map'] == cid)
    if nobj > 240: fail(f'{cid}: {nobj} objects over the 240 budget')
    if people > 24: fail(f'{cid}: {people} people over the 24 budget')
    print(f"{cid} {c.w}x{c.h} objects={nobj} people={people} decals={c.decals} "
          f"tanks={sum(1 for o in c.objs if o['sprite' if 'sprite' in o else 'id'].startswith('hc_tank'))} "
          f"cars={sum(1 for o in c.objs if str(o.get('sprite','')).startswith('hc_car'))}")

# ---------- rooms ----------
def room(rid, name, door, outdoor, grid, skin, objs, safe, **kw):
    w, h = len(grid[0]), len(grid)
    if any(len(r) != w for r in grid): fail(f'{rid}: ragged grid')
    if w > 16 or h > 24: fail(f'{rid}: {w}x{h} over the 16x24 room cap')
    r = {'name': name, 'kind': 'interior', 'outdoor': outdoor, 'door': door, 'backdrop': 'town', 'music': 'charity',
         'w': w, 'h': h, 'spawns': None, 'zones': [], 'safe': {'x': safe[0], 'y': safe[1]}, 'skin': skin, 'variants': True,
         'grid': grid, 'objs': objs}
    r.update(kw)
    return r

def room_check(rid, r, arrival, targets):
    g, w, h = r['grid'], r['w'], r['h']
    walk = RWALK
    for x in range(w):
        for y in (0, h - 1):
            if g[y][x] in walk and g[y][x] != 'm': fail(f'{rid}: wall open at {(x, y)}')
    for y in range(h):
        for x in (0, w - 1):
            if g[y][x] in walk: fail(f'{rid}: wall open at {(x, y)}')
    block = {(o['x'], o['y']) for o in r['objs'] if o['kind'] in ('npc', 'sign', 'prop') and g[o['y']][o['x']] in walk}
    seen = reach(g, arrival, frozenset(block), walk=walk)
    for k, p in targets.items():
        if p not in seen: fail(f'{rid}: {k} at {p} not reachable with every body and prop in place')
    floor = {(x, y) for y in range(h) for x in range(w) if g[y][x] in walk} - block
    lost = floor - seen
    if lost: fail(f'{rid}: unreachable floor {sorted(lost)[:4]}')
    for o in r['objs']:
        if o['kind'] in ('npc', 'sign', 'prop') and (o.get('lines') or o.get('scene')):
            if not any((a, b) in seen for a, b in nbrs(o['x'], o['y'], w, h)): fail(f"{rid}: {o['id']} has no reachable tile to tap from")

def P(oid, x, y, sprite, **kw): return dict({'kind': 'prop', 'id': oid, 'x': x, 'y': y, 'sprite': sprite}, **kw)
def D(oid, x, y, sprite, **kw): return dict({'kind': 'decal', 'id': oid, 'x': x, 'y': y, 'sprite': sprite}, **kw)
def N(oid, name, look, x, y, facing='down', **kw): return dict({'kind': 'npc', 'id': oid, 'name': name, 'look': look, 'x': x, 'y': y, 'facing': facing, 'still': True}, **kw)
def S_(oid, x, y, text, sprite=None):
    o = {'kind': 'sign', 'id': oid, 'x': x, 'y': y, 'text': text}
    if sprite: o['sprite'] = sprite
    return o

ROOMS = {}
REST = {'else': '@lantern_rest'}

# hc_lantern_in, the grand Lantern House ground floor, 16x22 (§7.1). The lantern wall is two rows across the far end.
g = ['#' * 16, '#' + 'W' * 14 + '#', '#' + 'W' * 14 + '#'] + ['#' + '.' * 14 + '#' for _ in range(18)] + ['#' * 8 + 'm' + '#' * 7]
objs = [{'kind': 'warp', 'id': 'hc_lantern_in_mat', 'x': 8, 'y': 21, 'to': 'highcharity', 'tx': 32, 'ty': 12, 'facing': 'down'}]
objs += [D(f'hc2_lwall_{x}_{y}', x, y, 'hc_lantern_wall') for y in (1, 2) for x in range(1, 15)]
objs += [S_('hc2_wall_w', 4, 2, TXT['hb11_wall'], 'none'), S_('hc2_wall_e', 11, 2, TXT['hb11_wall'], 'none')]
objs += [P('hc2_lectern', 7, 3, 'hc_lectern', name='the lectern'), P('hc2_lh_camera', 7, 5, 'hc_camera_cloth', name='a camera under a cloth')]
bed_ids = ['hc_bed_a', 'hc_bed_b', 'hc_bed_c'] + [f'hc2_bed_{c}' for c in 'defghijkl']
beds = [(x, y) for y in (5, 7, 9, 11, 13, 15) for x in (1, 3)]
room_keep = {}
for bid, (x, y) in zip(bed_ids, beds):
    if bid.startswith('hc_bed'): room_keep['hc_lantern_in:' + bid] = {'map': 'hc_lantern_in', 'x': x, 'y': y}
    else: objs.append(P(bid, x, y, 'rest_bed', lines=dict(REST)))
objs += [P(f'hc2_quiet_{x}_{y}', x, y, 'bench_long', name='a quiet bench') for y in (5, 7, 9, 11, 13, 15) for x in (11, 13)]
room_keep['hc_lantern_in:hc_lantern_light'] = {'map': 'hc_lantern_in', 'x': 7, 'y': 9}
objs.append(P('hc2_lh_wireset', 7, 13, 'tv_set', name='the wire set'))
objs += [P(f'hc2_lh_counter_{x}', x, 17, 'stall_counter', name="Host Maudie's counter") for x in (6, 8)]
room_keep['hc_lantern_in:hc_lantern_host'] = {'map': 'hc_lantern_in', 'x': 7, 'y': 16, 'facing': 'down'}
room_keep['hc_lantern_in:hc_lantern_note'] = {'map': 'hc_lantern_in', 'x': 7, 'y': 17}   # the 5-Acorn note on the counter
room_keep['hc_lantern_in:hc_clinic_shelf'] = {'map': 'hc_lantern_in', 'x': 14, 'y': 20}
SC['hc2_wall'] = [['say', 'Visitor', TXT['hb11_visitor']], ['setFlag', 'story.hc_wall', True]]
objs.append(N('hc_visitor', 'Visitor', 'hc_visitor', 12, 6, 'left', scene='hc2_wall', lines={'else': TXT['hb11_visitor']}))
objs.append(D('hc2_lh_stair', 13, 17, 'stair_flight'))
objs.append(S_('hc2_lh_gallery', 13, 17, TXT['gallery'], 'none'))
ROOMS['hc_lantern_in'] = room('hc_lantern_in', 'Grand Lantern House', 'hc_lantern', 'highcharity', g, 'hc_lantern_grand', objs, (8, 19),
                              respawnSpot={'x': 8, 'y': 19, 'facing': 'up'})
ROOMS['hc_lantern_in']['_lines'] = {'hc_lantern_host': {'else': TXT['hb11_ines']}}

# hc_news_1, Block News House front hall, wire room, copy desk, 14x16 (§7.2).
g = ['#' * 14, '#' + 'W' * 12 + '#', '#' + '.' * 12 + '#', '#' + '.' * 12 + '#', '#' + '.' * 12 + '#',
     '######..######'] + ['#' + '.' * 12 + '#' for _ in range(9)] + ['#######m######']
objs = [{'kind': 'warp', 'id': 'hc_news_1_mat', 'x': 7, 'y': 15, 'to': 'hc_exchange', 'tx': 52, 'ty': 13, 'facing': 'down'},
        {'kind': 'warp', 'id': 'hc_news_up', 'x': 12, 'y': 12, 'to': 'hc_news_2', 'tx': 11, 'ty': 12, 'facing': 'left'},
        D('hc2_news_stair_1', 12, 12, 'stair_flight')]
objs += [P(f'hc2_printer_{x}', x, 2, 'hc_wire_printer', name='a wire printer', lines={'else': TXT['hb10_wire']}) for x in (1, 2, 3, 4, 8, 9, 10, 11)]
objs += [P(f'hc2_copy_{x}', x, 4, 'crate_stack', name='rolls of copy') for x in (1, 12)]
objs += [P(f'hc2_copydesk_{x}', x, 7, 'keep_desk', name='a copy desk') for x in (2, 3, 7, 8)]
objs.append(P('hc2_spike', 11, 7, 'hc_hold_spike', name='the HOLD spike', lines={'else': TXT['hb10_spike']}))
objs += [P(f'hc2_editordesk_{x}', x, 10, 'keep_desk', name="the editor's desk") for x in (6, 7, 8)]
objs.append(P('hc2_motto', 7, 11, 'hc_motto_board', name='the motto board', lines={'else': 'WHO. WHERE. WHAT CHANGED.'}))
SC['hc2_news'] = [['say', 'Editor', TXT['hb10_editor']], ['setFlag', 'story.hc_news', True]]
objs.append(N('hc_editor', 'Editor', 'hc_editor', 7, 9, 'down', scene='hc2_news', lines={'else': TXT['hb10_editor']}))
ROOMS['hc_news_1'] = room('hc_news_1', 'Block News House', 'hc_news', 'hc_exchange', g, 'hc_news_1', objs, (7, 14))

# hc_news_2, the Keeper reader's office and the studio, 14x14.
g = ['#' * 14, '#' + 'W' * 12 + '#', '#' + '.' * 12 + '#', '#' + '.' * 12 + '#', '########.#####'] + ['#' + '.' * 12 + '#' for _ in range(8)] + ['#' * 14]
objs = [{'kind': 'warp', 'id': 'hc_news_down', 'x': 12, 'y': 12, 'to': 'hc_news_1', 'tx': 11, 'ty': 12, 'facing': 'left'},
        D('hc2_news_stair_2', 12, 12, 'stair_flight'),
        P('hc2_studio_camera', 3, 2, 'hc_camera_cloth', name='a camera under a cloth'),
        P('hc2_studio_chair', 7, 3, 'keep_bench', name='one chair')]
objs += [D(f'hc2_backdrop_{x}', x, 1, 'hc_motto_board') for x in (6,)]
objs += [P(f'hc2_readerdesk_{x}_{y}', x, y, 'keep_desk', name="the reader's desk") for x in (2, 3) for y in (6, 7)]
objs.append(P('hc2_stamps', 9, 6, 'hc_stamp_table', ox=8, name='the stamp table', lines={'else': 'Two stamps. READ AND RELEASED. A smaller one: WAIT.'}))
objs.append(P('hc2_waiting', 6, 9, 'hc_wait_tray', name='the waiting tray', lines={'else': 'A tray marked WAITING. The pages are neat.'}))
objs += [P(f'hc2_filing_{x}', x, 10, 'bookshelf', name='filing') for x in (10, 11)]
objs.append(N('hc_reader', 'Keeper reader', 'clerk', 1, 6, 'right', lines={'else': TXT['hb10_reader']}))
ROOMS['hc_news_2'] = room('hc_news_2', 'Block News House', 'hc_news', 'hc_exchange', g, 'hc_news_2', objs, (11, 12))

# hc_gov_1, lobby and the Governor's office, 16x16 (§7.3 floor 1). Keepers path, Act 2 on (D1426, D1439, layout v0.4
# §5.3): the door, Governor Merriden and the ORDERS DOWN chute (HB12) open with GOV1. The stair goes to floor 3 in phase 1
# (the Cabinet Room, floor 2, is phase 2 and follows GOV1 when built); the President's rooms stay Keepers path, Act 5, after
# meeting the Governor (story.hc_gov_met, PLACEHOLDER flag).
part = lambda: '#' + '.' * 8 + '#' + '.' * 5 + '#'
g = ['#' * 16, '#' + 'W' * 14 + '#'] + [part() for _ in range(3)] + ['#' + '.' * 14 + '#'] * 2 + [part() for _ in range(8)] + ['#######m########']
GOV3 = '!story.side=glimmer & story.act>=5 & story.hc_gov_met'
objs = [{'kind': 'warp', 'id': 'hc_gov_1_mat', 'x': 7, 'y': 15, 'to': 'hc_civic', 'tx': 32, 'ty': 16, 'facing': 'down'},
        {'kind': 'warp', 'id': 'hc_gov_up', 'x': 1, 'y': 2, 'to': 'hc_gov_3', 'tx': 2, 'ty': 12, 'facing': 'up', 'need': GOV3},
        D('hc2_gov_stair_1', 1, 2, 'stair_flight')]
objs += [P(f'hc2_lobbydesk_{x}', x, 9, 'keep_desk', name='the Keeper desk') for x in (2, 3, 4)]
objs.append(N('hc_gov_keeper_a', 'Keeper', 'officer', 3, 8, 'down', lines={'else': 'Welcome to the Governor\'s House, holder.'}))
objs.append(N('hc_gov_keeper_b', 'Keeper', 'officer', 2, 3, 'down', lines={GOV3: 'Go on up, holder.', 'else': TXT['gov_stair']}))
objs += [P(f'hc2_govdesk_{x}', x, 4, 'keep_desk', name="the Governor's desk") for x in (11, 12)]
SC['hc2_chute'] = [['say', '', TXT['hb12_chute']], ['setFlag', 'story.hc_chute', True]]
objs.append(P('hc_chute_mouth', 13, 4, 'hc_chute_mouth', name='the ORDERS DOWN chute', scene='hc2_chute', lines={'else': TXT['hb12_chute']}))
objs.append(N('hc_governor', 'Governor Merriden', 'hc_governor', 12, 3, 'down', when=['story.act>=2'], lines={'else': TXT['gov_line']}))
objs += [P('hc2_gov_flag_w', 10, 2, 'banner_keeper'), P('hc2_gov_flag_e', 14, 2, 'banner_keeper')]
ROOMS['hc_gov_1'] = room('hc_gov_1', "Governor's House", 'hc_gov', 'hc_civic', g, 'hc_gov_1', objs, (7, 14))

# hc_gov_3, the President's rooms, 12x14 (§7.3 floor 3). No Summit staging here (X7).
g = ['#' * 12, '#' + 'W' * 10 + '#'] + ['#' + '.' * 10 + '#' for _ in range(6)] + ['#.=======..#'] + ['#' + '.' * 10 + '#' for _ in range(4)] + ['#' * 12]
objs = [{'kind': 'warp', 'id': 'hc_gov_down', 'x': 1, 'y': 12, 'to': 'hc_gov_1', 'tx': 2, 'ty': 2, 'facing': 'right'},
        D('hc2_gov_stair_3', 1, 12, 'stair_flight')]
objs += [D(f'hc2_letters_{x}', x, 1, 'hc_thanks_letters') for x in (1, 3, 7, 9)]
objs += [P('hc2_pres_desk_w', 6, 3, 'keep_desk', name='the desk'), P('hc2_pres_plate', 7, 3, 'hc_desk_plate', name='THE PRESIDENT', lines={'else': 'A desk plate: THE PRESIDENT.'}),
         P('hc2_pres_desk_e', 8, 3, 'keep_desk', name='the desk')]
objs.append(P('hc2_pin', 2, 3, 'hc_lantern_pin', name='a lantern pin on a stand'))
objs.append(P('hc2_permits', 6, 4, 'hc_permit_tray', name='the permit tray', lines={'else': 'TRANSFER PERMIT · SEALS. Signed below. The line above is blank.'}))
objs.append(P('hc_chute_top', 8, 4, 'hc_chute_top', name='the chute', lines={'else': 'A brass slot in the desk. The chute runs down from here.'}))
objs.append(P('hc2_ledger', 2, 6, 'hc_roll_ledger', name='the roll ledger', lines={'else': TXT['hb13_ledger']}))
objs.append(P('hc2_chair', 6, 6, 'keep_bench', name='a chair'))
objs.append(P('hc2_cups', 3, 9, 'hc_teacups', name='two cups', lines={'else': TXT['hb13_cup']}))
objs.append(P('hc2_card', 4, 9, 'hc_bright_card', name='a small card', lines={'else': 'A small card: "Have a bright day."'}))
objs.append(P('hc2_pres_wireset', 7, 9, 'tv_set', name='the wire set'))
objs.append(P('hc2_stamp', 10, 10, 'hc_lampstock_stamp', name='a stamp', lines={'else': TXT['hb13_stamp']}))
SC['hc2_chambers'] = [['say', 'The President', TXT['hb13_president']], ['setFlag', 'story.hc_chambers', True]]
objs.append(N('hc_president', 'The President', 'hc_president', 7, 2, 'down', scene='hc2_chambers', lines={'else': TXT['hb13_president']}))
objs.append(N('hc_aide', 'Aide', 'hc_aide', 2, 11, 'down', lines={'else': TXT['hb13_aide']}))
objs.append(N('hc_clerk3', 'Clerk', 'clerk', 9, 7, 'left'))
objs.append(N('hc_commander3', 'Commander', 'captain', 1, 11, 'down', lines={'else': TXT['hb13_commander']}))
ROOMS['hc_gov_3'] = room('hc_gov_3', "Governor's House", 'hc_gov', 'hc_civic', g, 'hc_gov_3', objs, (2, 12))

TARGETS = {
    'hc_lantern_in': ((8, 20), {'mat': (8, 21), 'ines': (7, 15), **{f'bed{i}': (x + 1, y) for i, (x, y) in enumerate(beds)}}),
    'hc_news_1': ((7, 14), {'mat': (7, 15), 'stair': (12, 12), 'editor': (7, 8), 'spike': (11, 8)}),
    'hc_news_2': ((11, 12), {'stair': (12, 12), 'reader': (1, 7), 'tray': (6, 8)}),
    'hc_gov_1': ((7, 14), {'mat': (7, 15), 'stair': (1, 2), 'governor_front': (12, 5)}),
    'hc_gov_3': ((2, 12), {'stair': (1, 12), 'president_front': (7, 4) if False else (5, 4), 'cups': (3, 10), 'stamp': (10, 11)}),
}
# kept room objects count as blockers for the room checks
for rid, r in ROOMS.items():
    probe = dict(r, objs=r['objs'] + [dict({'kind': 'prop', 'id': k.split(':')[1]}, x=v['x'], y=v['y']) for k, v in room_keep.items() if v['map'] == rid])
    arr, t = TARGETS[rid]
    room_check(rid, probe, arr, t)

# ---------- line limits and wording ----------
BANNED = re.compile(r'\b(' + '|'.join(['fa' + 'int(ed)?', 'ev' + 'olv\\w*', 'co' + 'ins?', 'app' + 'eared', 'tr' + 'ainer', 't' + 'v', 'bell' + 'gold', 'block' + 'news', '\\w+' + 'dex']) + r')\b|go, [a-z]+!', re.I)   # split so the scan never reads the list as text
def walk_text(v, where):
    if isinstance(v, str):
        if BANNED.search(v): fail(f'{where}: banned word in {v!r}')
        if '  ' in v: fail(f'{where}: double space')
    elif isinstance(v, dict):
        for k, x in v.items(): walk_text(x, where)
    elif isinstance(v, list):
        for x in v: walk_text(x, where)
for k, v in TXT.items():
    if v and len(v) > 110: fail(f'line {k} over 110 chars')
for cid, c in CHUNKS.items():
    for o in c.objs:
        walk_text({k: o.get(k) for k in ('text', 'lines', 'deny', 'name')}, f'{cid}:{o["id"]}')
for rid, r in ROOMS.items():
    for o in r['objs']: walk_text({k: o.get(k) for k in ('text', 'lines', 'deny', 'name')}, f'{rid}:{o["id"]}')
for sid, steps in SC.items():
    walk_text(steps, sid)
    for st in steps:
        if st[0] == 'say' and len(st[2]) > 110: fail(f'{sid}: say over 110')

# ---------- the reputation cast (every named body needs an entry; only added while the city is on) ----------
# D1439: the Governor is a civil post, not a Keeper; the cast has no civil value, so he takes 'none' (as civilians do)
KEEPER_NAMES = {'Duty Keeper', 'Keeper', 'Keeper reader', 'The President', 'Aide', 'Commander', 'Clerk'}
names = sorted({o['name'] for c in CHUNKS.values() for o in c.objs if o['kind'] == 'npc'} |
               {o['name'] for r in ROOMS.values() for o in r['objs'] if o['kind'] == 'npc'})
CAST = [{'name': n, 'faction': 'keepers' if n in KEEPER_NAMES else 'none', 'base': 50} for n in names]
for e in CAST:   # NPC_RANKS: a Keeper cast entry needs a rank, a pending proposal or a flag; the city's ranks are Story's to set
    if e['faction'] == 'keepers': e['rankFlag'] = 'D1374: city cast, ranks PLACEHOLDER until Story'

# ---------- write ----------
for k, v in room_keep.items(): keep[k] = v
lines_patch = {}
for rid, r in ROOMS.items():
    for oid, ln in r.pop('_lines', {}).items(): lines_patch[oid] = ln
MAPS = {}
for cid, c in CHUNKS.items():
    MAPS[cid] = {'name': 'High Charity', 'district': DISTRICT[cid], 'backdrop': 'town', 'music': 'charity', 'w': c.w, 'h': c.h,
                 'spawns': None, 'respawn': None, 'respawnIn': {'map': 'hc_lantern_in', 'x': 8, 'y': 19, 'facing': 'up'},
                 'safe': {'x': c.arrival[0], 'y': c.arrival[1]}, 'zones': [], 'variants': True, 'roofs': roofs[cid],
                 'grid': c.grid, 'objs': c.objs,
                 'hcSlots': [h for h in c.src['hooks']]}
out = {
    'spec': 'HIGH_CHARITY_LAYOUT v0.3 phase 1 (design specs/HIGH_CHARITY_LAYOUT.md); built by tools/build_hc_city.py',
    '_about': 'City preview data. Not in MAPDATA. Merged into WORLD only while HC_CITY_V2 or ?debug=1&hccity=2 is on. '
              'All player text is PLACEHOLDER until Story signs it (layout §11). Art keys hc_* are PLACEHOLDER (HC_PLACEHOLDER_ART).',
    'tiles': {'C': {'name': 'carriageway', 'walk': True}, 'Z': {'name': 'crosswalk', 'walk': True},
              'U': {'name': 'kerb bay', 'walk': False}, 'M': {'name': 'median', 'walk': False}},
    'maps': MAPS,
    'rooms': ROOMS,
    'keep': keep,
    'matMoves': mat_moves,
    'linesPatch': lines_patch,
    'scenes': SC,
    'looks': LOOKS,
    'speakers': SPEAKERS,
    'cast': CAST,
    'notStepFlags': ['story.hc_noon', 'story.hc_board', 'story.hc_mural', 'story.hc_lampstock', 'story.hc_gran', 'story.hc_news',
                     'story.hc_wall', 'story.hc_chute', 'story.hc_chambers', 'story.hc_gov_met', 'story.hc_trial_called'],
}
for n in notes: print('note:', n)
if fails:
    print('FAIL'); [print(' -', f) for f in fails]; sys.exit(1)
txt = json.dumps(out, ensure_ascii=False, indent=1)
txt = re.sub(r'\n\s+("[^"]*",?|\d+,?|true,?|false,?|null,?)(?=\n)', r' \1', txt)   # compact short scalars
open(OUT, 'w').write(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT)} bytes)')
print('build_hc_city: PASS')
