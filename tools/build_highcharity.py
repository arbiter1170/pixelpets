#!/usr/bin/env python3
"""Author data/highcharity.json. Run from the repo root: python3 tools/build_highcharity.py"""
import json, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
W, H = 64, 40
WALK = set('gpf sBPDAm.=:')  # space is not a tile; listed without space below
WALK = set(list('gpf') + list('sBPDAm.=:'))
SOLID = set('TwRHFK#')

grid = [['g'] * W for _ in range(H)]
for x in range(W):
    grid[0][x] = grid[H - 1][x] = 'T'
for y in range(H):
    grid[y][0] = grid[y][W - 1] = 'T'

def fill(x0, y0, x1, y1, ch):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if grid[y][x] == 'T' and ch != 'T':
                continue
            grid[y][x] = ch

# Marina, airship pads, then the avenues (buildings punch through them).
fill(1, 12, 6, 28, 'w')
fill(7, 14, 7, 26, 's')
fill(8, 17, 12, 23, 'D')
fill(4, 1, 22, 4, 'A')
fill(42, 1, 60, 4, 'A')
fill(31, 4, 33, 38, 'P')
fill(8, 19, 56, 21, 'P')

ROOFS = {}

def building(x0, x1, wall_y, door_x, roofs=2, roof=None):
    assert 0 < x0 <= door_x <= x1 < W - 1
    y0 = wall_y - roofs
    assert y0 > 0
    for y in range(y0, wall_y):
        for x in range(x0, x1 + 1):
            grid[y][x] = 'R'
    for x in range(x0, x1 + 1):
        grid[wall_y][x] = 'H'
    if roof:
        ROOFS[roof] = {'x0': x0, 'y0': y0, 'x1': x1, 'y1': wall_y - 1, 'col': 'b'}
    return door_x, wall_y + 1

doors = {}
doors['hc_airport'] = building(26, 38, 3, 32, 2, 'airport')
doors['hc_command'] = building(26, 38, 8, 32, 2, 'command')
doors['hc_barracks'] = building(4, 14, 10, 9, 2, 'barracks')
doors['hc_church'] = building(46, 58, 8, 52, 3, 'chapel')
doors['hc_gym'] = building(18, 26, 12, 22, 2, None)
doors['hc_marina'] = building(14, 22, 16, 18, 2, None)
doors['hc_arena'] = building(40, 50, 14, 45, 2, None)
doors['hc_apt'] = building(4, 12, 24, 8, 2, None)
doors['hc_apt_b'] = building(14, 20, 24, 17, 2, None)
doors['hc_apt_c'] = building(22, 28, 24, 25, 2, None)
doors['hc_school'] = building(6, 16, 28, 11, 2, None)
doors['hc_hall'] = building(26, 38, 28, 32, 2, 'hall')
doors['hc_bank'] = building(44, 54, 28, 49, 2, None)
doors['hc_lantern'] = building(18, 26, 33, 22, 2, None)
doors['hc_mall'] = building(48, 60, 34, 55, 2, None)

def carve(x0, y0, x1, y1):
    if x0 == x1:
        xs, ys = [x0], range(min(y0, y1), max(y0, y1) + 1)
    elif y0 == y1:
        xs, ys = range(min(x0, x1), max(x0, x1) + 1), [y0]
    else:
        raise SystemExit('diagonal carve')
    for y in ys:
        for x in xs:
            ch = grid[y][x]
            if ch in ('R', 'H', 'T', 'w'):
                raise SystemExit('carve hit %s at %d,%d' % (ch, x, y))
            if ch in ('g', 'f', 'p'):
                grid[y][x] = 'P'

# Ways around the civic blocks. Door rows stay open.
carve(16, 4, 40, 4)
carve(16, 4, 16, 11)
carve(40, 4, 40, 11)
carve(16, 9, 56, 9)
carve(9, 11, 9, 19)
carve(18, 17, 18, 19)
carve(22, 13, 27, 13)
carve(27, 13, 27, 19)
carve(39, 9, 39, 19)
carve(39, 15, 45, 15)
carve(8, 25, 34, 25)
carve(8, 29, 56, 29)
carve(22, 34, 46, 34)
carve(22, 35, 58, 35)
carve(22, 34, 22, 35)
carve(32, 30, 32, 38)

# A little park east of the plaza, on whatever grass is left there.
for y in range(22, 25):
    for x in range(35, 39):
        if grid[y][x] == 'g':
            grid[y][x] = 'f'

rows = [''.join(r) for r in grid]
assert all(len(r) == W for r in rows)
assert doors['hc_hall'] == (32, 29), doors['hc_hall']
assert doors['hc_airport'] == (32, 4)

def walkable(x, y):
    if not (0 <= x < W and 0 <= y < H):
        return False
    return grid[y][x] in WALK

# Reachability: signs, npcs and props block. Doors and warps do not.
occ = {}  # (x,y) -> id

def occupy(x, y, oid, kind):
    if not walkable(x, y):
        raise SystemExit('%s %s sits on %s at %d,%d' % (kind, oid, grid[y][x], x, y))
    if (x, y) in occ:
        raise SystemExit('%s %s overlaps %s' % (oid, (x, y), occ[(x, y)]))
    if grid[y][x] == 'H':
        raise SystemExit('object on wall')
    occ[(x, y)] = oid

BLOCK = {'npc', 'sign', 'prop', 'trainer'}

def flood(start):
    seen = set()
    q = [start]
    while q:
        x, y = q.pop()
        if (x, y) in seen or not walkable(x, y):
            continue
        if occ.get((x, y)) and False:
            pass
        # blockers
        seen.add((x, y))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if (nx, ny) in seen or not walkable(nx, ny):
                continue
            q.append((nx, ny))
    return seen

# Objects are registered before the flood so we can recompute with blocks.
objs = []

def add(o):
    kind = o['kind']
    if kind in BLOCK or kind == 'npc':
        occupy(o['x'], o['y'], o['id'], kind)
    elif kind in ('door', 'warp', 'trigger', 'pickup'):
        if not walkable(o['x'], o['y']):
            raise SystemExit('%s not walkable %s' % (o['id'], grid[o['y']][o['x']]))
        if (o['x'], o['y']) in occ:
            raise SystemExit('overlap ' + o['id'])
        occ[(o['x'], o['y'])] = o['id']
    objs.append(o)

def reachable(extra=None):
    blocked_xy = {xy for xy, oid in occ.items() if any(o['id'] == oid and o['kind'] in BLOCK for o in objs)}
    if extra:
        blocked_xy.add(extra)
    seen_xy = set()
    q = [(32, 37)]
    while q:
        x, y = q.pop()
        if (x, y) in seen_xy or (x, y) in blocked_xy or not walkable(x, y):
            continue
        seen_xy.add((x, y))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q.append((x + dx, y + dy))
    return seen_xy

def sign_near(door_id, sid, text):
    x, y = doors[door_id]
    for dx, dy in ((1, 1), (-1, 1), (0, 1), (2, 0), (-2, 0), (1, 0), (-1, 0), (0, 2), (2, 1), (-2, 1)):
        nx, ny = x + dx, y + dy
        if not walkable(nx, ny) or (nx, ny) in occ or grid[ny][nx] == 'H':
            continue
        seen_xy = reachable((nx, ny))
        if all(pt in seen_xy for pt in doors.values()) and (32, 38) in seen_xy and (nx, ny) not in doors.values():
            add({'kind': 'sign', 'id': sid, 'x': nx, 'y': ny, 'text': text})
            return
    raise SystemExit('no sign spot for ' + sid)

# Outdoor doors. Locked neighbours have no interior.
def outdoor_door(did, room, land, extra=None):
    x, y = doors[did]
    o = {'kind': 'door', 'id': did, 'x': x, 'y': y, 'to': room, 'tx': land[0], 'ty': land[1], 'facing': 'up'}
    if extra:
        o.update(extra)
    add(o)

def locked_door(did, deny):
    x, y = doors[did]
    add({'kind': 'door', 'id': did, 'x': x, 'y': y, 'need': 'story.hc_no_room',
         'deny': deny})

outdoor_door('hc_airport', 'hc_airport_in', (4, 5))
outdoor_door('hc_command', 'hc_command_in', (4, 5))
outdoor_door('hc_barracks', 'hc_barracks_in', (4, 5))
outdoor_door('hc_church', 'hc_church_in', (5, 9))
outdoor_door('hc_gym', 'hc_gym_in', (4, 5))
outdoor_door('hc_marina', 'hc_marina_in', (4, 5))
outdoor_door('hc_arena', 'hc_arena_in', (5, 7))
outdoor_door('hc_apt', 'hc_apt_in', (3, 4))
locked_door('hc_apt_b', "A neighbour's ribbon is on the latch.")
locked_door('hc_apt_c', "A neighbour's ribbon is on the latch.")
outdoor_door('hc_school', 'hc_school_in', (4, 5))
outdoor_door('hc_hall', 'hc_hall_in', (5, 9))
outdoor_door('hc_bank', 'hc_bank_in', (4, 5))
outdoor_door('hc_lantern', 'hc_lantern_in', (4, 5))
outdoor_door('hc_mall', 'hc_mall_1', (5, 9))

add({'kind': 'warp', 'id': 'hc_south', 'x': 32, 'y': 38, 'to': 'hearthmoor', 'tx': 12, 'ty': 10, 'facing': 'up'})
add({'kind': 'trigger', 'id': 'hc_gate', 'x': 32, 'y': 36, 'r': 0, 'when': ['!story.hc_greeted'], 'scene': 'hc_gate'})
add({'kind': 'npc', 'id': 'hc_moss', 'name': 'Keeper Moss', 'look': 'moss', 'x': 30, 'y': 36, 'facing': 'right',
     'scene': 'hc_gate',
     'lines': {'story.side=glimmer': 'Guests are welcome. The hall is south of the plaza.',
               'else': 'The lanterns stay lit. The hall is just south.'}})
add({'kind': 'npc', 'id': 'hc_shop', 'name': 'Mira', 'look': 'mira', 'x': 30, 'y': 22, 'facing': 'down',
     'shop': ['heal_snack', 'hearty_snack', 'wake_tonic', 'befriend_treat', 'energy_sip', 'joy_crumb'],
     'lines': {'else': 'Welcome to Lantern Market!'},
     'chatter': {'story.side=glimmer': 'We sell to guests. Have a seat.', 'else': 'Warm buns in the back, keeper.'}})
add({'kind': 'prop', 'id': 'hc_stall_l', 'x': 29, 'y': 23, 'sprite': 'stall_counter',
     'lines': {'else': 'Jars of snacks and a tin marked ACORNS, PLEASE.'}})
add({'kind': 'prop', 'id': 'hc_stall_r', 'x': 31, 'y': 23, 'sprite': 'hall_booth',
     'lines': {'else': 'A chalkboard: LANTERN MARKET · Snacks for the road.'}})
add({'kind': 'npc', 'id': 'hc_baker', 'name': 'Baker Cole', 'look': 'cole', 'x': 36, 'y': 23, 'facing': 'down',
     'lines': {'story.side=glimmer': 'Same buns for guests. Sit if you like.',
               'else': 'The glaze is amber, same as the wild.'},
     'chatter': {'else': 'Warm buns. Mind the glaze.'}})
add({'kind': 'npc', 'id': 'hc_kite', 'name': 'Kit', 'look': 'kit', 'x': 38, 'y': 23, 'facing': 'left',
     'lines': {'else': "Wind's kind today. The kites behave."},
     'chatter': {'else': 'Kites for the plaza. String included.'}})
add({'kind': 'prop', 'id': 'hc_airship', 'x': 8, 'y': 3, 'sprite': 'airship',
     'lines': {'else': 'A lantern airship. Silk, wicker, and a bowl of fire.'}})
add({'kind': 'prop', 'id': 'hc_buoy', 'x': 10, 'y': 18, 'sprite': 'marina_buoy',
     'lines': {'else': 'A buoy. The crabs like the pilings under it.'}})
add({'kind': 'sign', 'id': 'hc_sign_plaza', 'x': 34, 'y': 20,
     'text': 'HIGH CHARITY · Keeper capital. Lanterns on every roof. Be kind in the streets.'})
add({'kind': 'pickup', 'id': 'hc_snack', 'x': 16, 'y': 36, 'item': 'heal_snack', 'n': 1})

SIGNS = {
    'hc_church': 'HIGH CHARITY CHAPEL · The doors stay open. Come in quiet, and leave a little warmer.',
    'hc_school': 'LANTERN SCHOOL · Lessons at the big table. Walklings may sit in, if they can sit still.',
    'hc_bank': 'CIVIC BANK · Your coins are counted and kept. Withdrawals until dusk. Kindness has no fee.',
    'hc_arena': 'CHARITY ARENA · Fair matches and a seat for every keeper. Leave grudges at the rope.',
    'hc_barracks': 'KEEPER BARRACKS · Lamps, maps, and the night watch. Sign the book, then mind the banners.',
    'hc_command': 'SKY-DOCK COMMAND · Lantern airships berth here. Read the board before you step on a pad.',
    'hc_airport': 'AIRSHIP FIELD · They lift when the wind is kind. Hold your hat, and your Walkling.',
    'hc_marina': 'CANAL MARINA · Tie up gently. The buoys mark the deep water. Wave if you need a hand.',
    'hc_mall': 'TWO-FLOOR MALL · Coats upstairs, crumbs downstairs. Walk your Walkling between the benches.',
    'hc_apt': 'KEEPER APARTMENTS · Rooms for keepers new to the city. The landlord keeps the spare keys.',
    'hc_gym': 'TRIAL GYM · Practice before a real Hall. Stones, tides, and blooms are all welcome.',
    'hc_lantern': 'LANTERN HOUSE · Rest is free. The beds stay warm, and nobody asks why you are tired.',
    'hc_hall': 'EVENT HALL · Five booths, one evening. Play kindly. The prizes are small on purpose.',
}
for did, text in SIGNS.items():
    sign_near(did, did.replace('hc_', 'hc_sign_'), text)

# Flood, treating blockers as walls. Doors and warps stay open.
blocked = {xy for xy, oid in occ.items() if any(o['id'] == oid and o['kind'] in BLOCK for o in objs)}
seen = set()
q = [(32, 37)]
while q:
    x, y = q.pop()
    if (x, y) in seen or (x, y) in blocked or not walkable(x, y):
        continue
    seen.add((x, y))
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        q.append((x + dx, y + dy))

for o in objs:
    if o['kind'] in ('door', 'warp'):
        if (o['x'], o['y']) not in seen:
            x, y = o['x'], o['y']
            nbrs = [(x+dx, y+dy, grid[y+dy][x+dx] if 0<=y+dy<H and 0<=x+dx<W else '?') for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))]
            raise SystemExit('unreachable ' + o['id'])
    if o['kind'] in BLOCK:
        nbr = any((o['x'] + dx, o['y'] + dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        if not nbr:
            raise SystemExit('cannot talk to ' + o['id'])
if (32, 37) not in seen or (32, 38) not in seen or (32, 36) not in seen:
    raise SystemExit('gate tiles blocked')
for did, (x, y) in doors.items():
    if grid[y - 1][x] != 'H':
        raise SystemExit('door %s has no wall, tile %s' % (did, grid[y - 1][x]))

# ---- interiors ----
def blank(w, h):
    g = []
    for y in range(h):
        if y == 0:
            g.append('#' * w)
        elif y == 1:
            g.append('#' + 'W' * (w - 2) + '#')
        elif y == h - 1:
            mid = w // 2
            g.append('#' * mid + 'm' + '#' * (w - mid - 1))
        else:
            g.append('#' + '.' * (w - 2) + '#')
    return g

def room(rid, name, w, h, music, door_id, objs_in, grid=None):
    g = grid or blank(w, h)
    assert all(len(r) == w for r in g) and len(g) == h
    assert w <= 11 and h <= 13
    dx, dy = doors[door_id]
    mid = w // 2
    mat = {'kind': 'warp', 'id': rid + '_mat', 'x': mid, 'y': h - 1,
           'to': 'highcharity', 'tx': dx, 'ty': dy, 'facing': 'down'}
    return {
        'name': name, 'kind': 'interior', 'outdoor': 'highcharity', 'door': door_id,
        'backdrop': 'town', 'music': music, 'w': w, 'h': h, 'spawns': None, 'zones': [],
        'safe': {'x': mid, 'y': h - 2},
        'grid': g,
        'objs': [mat] + objs_in,
    }

def line_pair(keepers, glimmer):
    return {'story.side=glimmer': glimmer, 'else': keepers}

rooms = {}
rooms['hc_airport_in'] = room('hc_airport_in', 'Airship Field', 9, 7, 'charity', 'hc_airport', [
    {'kind': 'npc', 'id': 'hc_quin', 'name': 'Porter Quin', 'look': 'quin', 'x': 2, 'y': 3, 'facing': 'down',
     'lines': line_pair('Next lantern-ship lifts at dusk.', 'Guests may watch the ships. No boarding.')},
    {'kind': 'prop', 'id': 'hc_airship_in', 'x': 6, 'y': 3, 'sprite': 'airship',
     'lines': {'else': 'The boarding board. Dusk, if the wind stays kind.'}},
])
rooms['hc_command_in'] = room('hc_command_in', 'Sky-Dock Command', 9, 7, 'charity', 'hc_command', [
    {'kind': 'npc', 'id': 'hc_lumen', 'name': 'Captain Lumen', 'look': 'petra', 'x': 2, 'y': 3, 'facing': 'down',
     'lines': line_pair('Lantern ships. No thunder, no guns.', "The dock is open. Please don't touch the lines.")},
    {'kind': 'prop', 'id': 'hc_console', 'x': 6, 'y': 2, 'sprite': 'skydock_console',
     'lines': {'else': 'A board of little lights. Each one is a ship, not a weapon.'}},
])
rooms['hc_barracks_in'] = room('hc_barracks_in', 'Keeper Barracks', 9, 7, 'charity', 'hc_barracks', [
    {'kind': 'npc', 'id': 'hc_rowan', 'name': 'Keeper Rowan', 'look': 'sorrel', 'x': 2, 'y': 3, 'facing': 'down',
     'lines': line_pair('We walk the walls. The city sleeps.', 'The watch is polite. Please stay on the path.')},
    {'kind': 'prop', 'id': 'hc_banner', 'x': 6, 'y': 2, 'sprite': 'barracks_banner',
     'lines': {'else': 'The night-watch banner. A lantern stitched in yellow.'}},
])
rooms['hc_marina_in'] = room('hc_marina_in', 'Canal Marina', 9, 7, 'charity', 'hc_marina', [
    {'kind': 'npc', 'id': 'hc_ness', 'name': 'Dockhand Ness', 'look': 'ness', 'x': 2, 'y': 3, 'facing': 'down',
     'lines': line_pair('Crabs like the pilings. Be gentle.', 'Boats are for looking. Crabs too.')},
    {'kind': 'prop', 'id': 'hc_buoy_in', 'x': 6, 'y': 3, 'sprite': 'marina_buoy',
     'lines': {'else': 'A spare buoy. It smells like the canal, in a friendly way.'}},
])
rooms['hc_school_in'] = room('hc_school_in', 'Lantern School', 9, 7, 'charity', 'hc_school', [
    {'kind': 'npc', 'id': 'hc_mae', 'name': 'Teacher Mae', 'look': 'nessa', 'x': 2, 'y': 3, 'facing': 'down',
     'lines': line_pair('Ember, Tide, Bloom. Three friends.', 'The lesson is the same for guests.')},
    {'kind': 'prop', 'id': 'hc_desk', 'x': 6, 'y': 3, 'sprite': 'school_desk',
     'lines': {'else': 'A desk copy of the lesson: Ember, Tide, and Bloom.'}},
])
rooms['hc_bank_in'] = room('hc_bank_in', 'Civic Bank', 9, 7, 'charity', 'hc_bank', [
    {'kind': 'npc', 'id': 'hc_ivo', 'name': 'Teller Ivo', 'look': 'teller', 'x': 2, 'y': 3, 'facing': 'down',
     'lines': line_pair('Your Acorns stay in your bag.', "We don't hold lanyards. Or Acorns.")},
    {'kind': 'prop', 'id': 'hc_counter', 'x': 5, 'y': 2, 'sprite': 'bank_counter',
     'lines': {'else': 'The counter is polished. Your Acorns never leave your bag.'}},
])
rooms['hc_gym_in'] = room('hc_gym_in', 'Trial Gym', 9, 7, 'charity', 'hc_gym', [
    {'kind': 'npc', 'id': 'hc_sol', 'name': 'Floor Keeper Sol', 'look': 'sol', 'x': 4, 'y': 3, 'facing': 'down',
     'lines': line_pair('No Seal here. Fen and Hale keep those.', 'No trial today. The floor is just clean.')},
    {'kind': 'sign', 'id': 'hc_gym_note', 'x': 2, 'y': 4, 'text': 'Practice floor. No Seals. Wipe your boots.'},
])
rooms['hc_lantern_in'] = room('hc_lantern_in', 'Lantern House', 9, 7, 'charity', 'hc_lantern', [
    {'kind': 'prop', 'id': 'hc_bed_a', 'x': 1, 'y': 2, 'sprite': 'rest_bed', 'lines': {'else': '@lantern_rest'}},
    {'kind': 'prop', 'id': 'hc_bed_b', 'x': 2, 'y': 2, 'sprite': 'rest_bed', 'lines': {'else': '@lantern_rest'}},
    {'kind': 'prop', 'id': 'hc_bed_c', 'x': 3, 'y': 2, 'sprite': 'rest_bed', 'lines': {'else': '@lantern_rest'}},
    {'kind': 'prop', 'id': 'hc_lantern_light', 'x': 6, 'y': 2, 'sprite': 'floor_lantern',
     'lines': {'else': 'The city lantern. Its glow feels like a hand on your shoulder.'}},
    {'kind': 'sign', 'id': 'hc_lantern_note', 'x': 6, 'y': 4, 'text': 'Rest as long as you like. The city can wait. — High Charity'},
])
rooms['hc_lantern_in']['respawnSpot'] = {'x': 2, 'y': 3, 'facing': 'up'}

church = blank(11, 11)
for y, row in enumerate(church):
    church[y] = list(row)
for y in (5, 6, 7):
    church[y][5] = '='
church = [''.join(r) for r in church]
rooms['hc_church_in'] = room('hc_church_in', 'High Charity Chapel', 11, 11, 'chapel', 'hc_church', [
    {'kind': 'npc', 'id': 'hc_vesper', 'name': 'Keeper Vesper', 'look': 'ivo', 'x': 4, 'y': 3, 'facing': 'down',
     'lines': line_pair("The lamps stay lit for everyone.", "You may sit. The lamps don't ask.")},
    {'kind': 'prop', 'id': 'hc_altar', 'x': 5, 'y': 2, 'sprite': 'altar',
     'lines': {'else': 'A quiet altar. One lantern, and no lecture.'}},
    {'kind': 'prop', 'id': 'hc_pew_w', 'x': 2, 'y': 5, 'sprite': 'pew', 'lines': {'else': 'A pew. The wood is warm from the lamps.'}},
    {'kind': 'prop', 'id': 'hc_pew_e', 'x': 8, 'y': 5, 'sprite': 'pew', 'lines': {'else': 'A pew on the lamp side. Sit a while.'}},
    {'kind': 'prop', 'id': 'hc_pew_w2', 'x': 2, 'y': 7, 'sprite': 'pew', 'lines': {'else': 'Another pew. Someone left a crumb for a Walkling.'}},
    {'kind': 'prop', 'id': 'hc_pew_e2', 'x': 8, 'y': 7, 'sprite': 'pew', 'lines': {'else': 'A pew. The aisle stays clear.'}},
], church)

rooms['hc_hall_in'] = room('hc_hall_in', 'Event Hall', 11, 11, 'arcade', 'hc_hall', [
    {'kind': 'npc', 'id': 'hc_nim', 'name': 'Nim', 'look': 'nim', 'x': 1, 'y': 3, 'facing': 'down', 'booth': 'lantern'},
    {'kind': 'npc', 'id': 'hc_sera', 'name': 'Sera', 'look': 'sera', 'x': 3, 'y': 3, 'facing': 'down', 'booth': 'shells'},
    {'kind': 'npc', 'id': 'hc_otto', 'name': 'Otto', 'look': 'otto', 'x': 5, 'y': 3, 'facing': 'down', 'booth': 'chirp'},
    {'kind': 'npc', 'id': 'hc_bramble', 'name': 'Bramble', 'look': 'bramble', 'x': 7, 'y': 3, 'facing': 'down', 'booth': 'dash'},
    {'kind': 'npc', 'id': 'hc_willa', 'name': 'Willa', 'look': 'willa', 'x': 9, 'y': 3, 'facing': 'down', 'booth': 'pairs'},
    {'kind': 'prop', 'id': 'hc_booth_l', 'x': 2, 'y': 5, 'sprite': 'hall_booth',
     'lines': {'else': 'LANTERN CATCH · The lanterns drift. Catch the warm ones.'}},
    {'kind': 'prop', 'id': 'hc_booth_s', 'x': 4, 'y': 5, 'sprite': 'hall_booth',
     'lines': {'else': 'TREAT SHELLS · Acorns in the shells. Share what you find.'}},
    {'kind': 'prop', 'id': 'hc_booth_c', 'x': 6, 'y': 5, 'sprite': 'hall_booth',
     'lines': {'else': 'CHIRP ECHO · A puddle, a chirp, an answer.'}},
    {'kind': 'prop', 'id': 'hc_booth_d', 'x': 8, 'y': 5, 'sprite': 'hall_booth',
     'lines': {'else': 'PLAZA DASH · Mind the puddles. The plaza is for everyone.'}},
    {'kind': 'sign', 'id': 'hc_hall_note', 'x': 2, 'y': 8,
     'text': 'EVENT HALL · Five games with your Walkling. Three tries a day.'},
])

rooms['hc_arena_in'] = room('hc_arena_in', 'Charity Arena', 11, 9, 'charity', 'hc_arena', [
    {'kind': 'npc', 'id': 'hc_nia', 'name': 'Clerk Nia', 'look': 'nia', 'x': 5, 'y': 3, 'facing': 'down', 'scene': 'hc_arena_ask'},
    {'kind': 'prop', 'id': 'hc_rope_l', 'x': 2, 'y': 4, 'sprite': 'arena_rope',
     'lines': {'else': 'The ring rope. It is yarn, dyed bright.'}},
    {'kind': 'prop', 'id': 'hc_rope_r', 'x': 8, 'y': 4, 'sprite': 'arena_rope',
     'lines': {'else': 'The far rope. Leave grudges on this side of it.'}},
])

rooms['hc_apt_in'] = room('hc_apt_in', 'Your Room', 7, 6, 'charity', 'hc_apt', [
    {'kind': 'npc', 'id': 'hc_oren', 'name': 'Landlord Oren', 'look': 'oren', 'x': 5, 'y': 2, 'facing': 'down',
     'lines': {'else': 'The spare key is yours while you visit. The bed is the blue one.'}},
    {'kind': 'prop', 'id': 'hc_apt_bed', 'x': 1, 'y': 2, 'sprite': 'apt_bed', 'lines': {'else': '@hc_apt_nap'}},
])

mall1 = blank(11, 11)
rooms['hc_mall_1'] = room('hc_mall_1', 'Charity Mall', 11, 11, 'charity', 'hc_mall', [
    {'kind': 'npc', 'id': 'hc_tess', 'name': 'Guide Tess', 'look': 'tess', 'x': 2, 'y': 4, 'facing': 'right',
     'lines': {'else': 'Crumbs on this floor. Coats up the stairs.'}},
    {'kind': 'prop', 'id': 'hc_mann_a', 'x': 2, 'y': 6, 'sprite': 'mannequin',
     'lines': {'else': 'A coat on a stand. It looks heavier than it is.'}},
    {'kind': 'prop', 'id': 'hc_mann_b', 'x': 8, 'y': 6, 'sprite': 'mannequin',
     'lines': {'else': 'Another coat. The colour is lantern-yellow.'}},
    {'kind': 'warp', 'id': 'hc_mall_up', 'x': 9, 'y': 5, 'to': 'hc_mall_2', 'tx': 9, 'ty': 6, 'facing': 'up'},
    {'kind': 'sign', 'id': 'hc_mall_stairs', 'x': 8, 'y': 4, 'text': 'STAIRS · Up to coats. Mind the step.'},
])
rooms['hc_mall_2'] = {
    'name': 'Charity Mall, Upstairs', 'kind': 'interior', 'outdoor': 'highcharity', 'door': 'hc_mall',
    'backdrop': 'town', 'music': 'charity', 'w': 11, 'h': 11, 'spawns': None, 'zones': [],
    'safe': {'x': 5, 'y': 9},
    'grid': blank(11, 11),
    'objs': [
        {'kind': 'warp', 'id': 'hc_mall_down', 'x': 9, 'y': 5, 'to': 'hc_mall_1', 'tx': 9, 'ty': 6, 'facing': 'down'},
        {'kind': 'sign', 'id': 'hc_mall_up_sign', 'x': 5, 'y': 3, 'text': 'Two warm floors. Mind the stairs.'},
        {'kind': 'prop', 'id': 'hc_mann_c', 'x': 3, 'y': 4, 'sprite': 'mannequin',
         'lines': {'else': 'Coats upstairs, just like the sign promised.'}},
        {'kind': 'npc', 'id': 'hc_penn', 'name': 'Clerk Penn', 'look': 'willa', 'x': 5, 'y': 6, 'facing': 'down',
         'lines': {'else': 'Coats, scarves, and a bench if your Walkling sits.'}},
    ],
}

# Room objects must sit on walkable floor and not on the mat or each other.
for rid, rm in rooms.items():
    cells = [list(r) for r in rm['grid']]
    rh, rw = len(cells), len(cells[0])
    seen_xy = set()
    for o in rm['objs']:
        x, y = o['x'], o['y']
        if not (0 <= x < rw and 0 <= y < rh):
            raise SystemExit('%s %s out of room' % (rid, o['id']))
        ch = cells[y][x]
        if ch in ('#', 'W', 'R', 'H'):
            raise SystemExit('%s %s on %s' % (rid, o['id'], ch))
        if (x, y) in seen_xy:
            raise SystemExit('%s overlap %s' % (rid, o['id']))
        seen_xy.add((x, y))

# ---- scenes, trainers, looks ----
scenes = {
    'hc_invite': [
        ['if', '!story.side_pick_done', [
            ['say', 'Warden Ilse', 'Choose a side in Fernbrook first. Then I can send you.'],
        ], [
            ['if', 'story.side=glimmer', [
                ['say', 'Warden Ilse', 'The capital wrote. They are polite about your lanyard. The hall is still open. Go play.'],
            ], [
                ['say', 'Warden Ilse', 'A letter came from the capital. High Charity is lighting its hall. Take {pet} and play.'],
            ]],
            ['choice', 'Will you go?', [
                ["I'll go", [
                    ['say', 'Warden Ilse', 'Good. The lantern coach is just south of the Lodge door.'],
                    ['setFlag', 'story.hc_invite', True],
                ]],
                ['Not yet', [
                    ['say', 'Warden Ilse', 'The letter will keep. The coach can wait.'],
                ]],
            ]],
        ]],
    ],
    'hc_ilse_done': [
        ['say', 'Warden Ilse', "All five games? {pet} must be glowing. I'm glad you went."],
    ],
    'hc_gate': [
        ['say', '', 'High Charity. The roofs are hung with lanterns, and the air smells like warm bread.'],
        ['if', 'story.side=glimmer', [
            ['say', 'Keeper Moss', 'Welcome. We keep the lanterns lit for guests, too.'],
        ], [
            ['say', 'Keeper Moss', 'Welcome home, keeper. The lanterns know your step.'],
        ]],
        ['if', '!story.hc_invite', [
            ['say', 'Keeper Moss', "The Event Hall booths stay covered until Ilse's letter arrives."],
        ]],
        ['setFlag', 'story.hc_greeted', True],
    ],
    'hc_arena_ask': [
        ['if', 'story.side=glimmer', [
            ['say', 'Clerk Nia', 'The ring is open to guests. We play fair, and we watch.'],
        ], [
            ['say', 'Clerk Nia', 'The ring is warm tonight. A kind match, if you want one.'],
        ]],
        ['choice', 'A friendly match?', [
            ['Begin match', [['battle', 'hc_tourney']]],
            ['Not now', []],
        ]],
    ],
    'hc_apt_nap': [
        ['say', '', 'A blue bed under a high window. The city hums outside.'],
        ['choice', 'Nap with your team?', [
            ['Nap', [
                ['rest'],
                ['say', '', 'You wake to lantern light. This is not your home lantern.'],
            ]],
            ['Not now', []],
        ]],
    ],
}

trainers = {
    'hc_tourney': {
        'name': 'Clerk Nia', 'title': 'Ring Keeper', 'map': 'hc_arena_in', 'x': 5, 'y': 3,
        'facing': 'down', 'sight': 0, 'ai': 'basic', 'money': 0,
        'team': [
            {'form': 'bloom/0', 'level': 8},
            {'form': 'tide/0', 'level': 9},
            {'form': 'ember/0', 'level': 10},
        ],
        'lines': {
            'intro': "Let's see a kind battle. My team bows first.",
            'win': 'Lovely footwork. Your Walkling looks proud.',
            'lose': 'Rest at the Lantern House. The ring will be here.',
        },
    },
}

looks = {
    'sera': {'skin': '1', 'hair': 'long', 'hairCol': 'o', 'outfit': 'tunic', 'outfitCol': 'p', 'accent': 'y'},
    'ivo': {'skin': '6', 'hair': 'bun', 'hairCol': 'h', 'outfit': 'coat', 'outfitCol': 'n', 'accent': 'y'},
    'nessa': {'skin': '2', 'hair': 'bun', 'hairCol': 'y', 'outfit': 'tunic', 'outfitCol': 'g', 'accent': 'r'},
    'bram': {'skin': '3', 'hair': 'short', 'hairCol': 'd', 'outfit': 'coat', 'outfitCol': 'b', 'accent': 'w'},
    'sorrel': {'skin': '5', 'hair': 'short', 'hairCol': 'n', 'outfit': 'coat', 'outfitCol': 't', 'accent': 'o'},
    'petra': {'skin': '4', 'hair': 'long', 'hairCol': 'p', 'outfit': 'coat', 'outfitCol': 'm', 'accent': 'c'},
    'oren': {'skin': '4', 'hair': 'short', 'hairCol': 'o', 'outfit': 'hoodie', 'outfitCol': 'm', 'accent': 'y'},
    'willa': {'skin': '1', 'hair': 'spiky', 'hairCol': 'r', 'outfit': 'hoodie', 'outfitCol': 'p', 'accent': 'c'},
    'nim': {'skin': '1', 'hair': 'long', 'hairCol': 'y', 'outfit': 'tunic', 'outfitCol': 'g', 'accent': 'o'},
    'otto': {'skin': '5', 'hair': 'short', 'hairCol': 'd', 'outfit': 'hoodie', 'outfitCol': 'b', 'accent': 'c'},
    'bramble': {'skin': '3', 'hair': 'bun', 'hairCol': 'o', 'outfit': 'tunic', 'outfitCol': 'g', 'accent': 'l'},
    'moss': {'skin': '4', 'hair': 'short', 'hairCol': 'd', 'outfit': 'coat', 'outfitCol': 'm', 'accent': 'y'},
    'mira': {'skin': '2', 'hair': 'long', 'hairCol': 'y', 'outfit': 'tunic', 'outfitCol': 'r', 'accent': 'y'},
    'cole': {'skin': '3', 'hair': 'bun', 'hairCol': 'r', 'outfit': 'tunic', 'outfitCol': 'o', 'accent': 'y'},
    'kit': {'skin': '5', 'hair': 'spiky', 'hairCol': 'y', 'outfit': 'hoodie', 'outfitCol': 'c', 'accent': 'w'},
    'quin': {'skin': '5', 'hair': 'short', 'hairCol': 'y', 'outfit': 'coat', 'outfitCol': 'b', 'accent': 'w'},
    'ness': {'skin': '2', 'hair': 'bun', 'hairCol': 'o', 'outfit': 'tunic', 'outfitCol': 'b', 'accent': 'c'},
    'teller': {'skin': '6', 'hair': 'short', 'hairCol': 'h', 'outfit': 'coat', 'outfitCol': 'n', 'accent': 'w'},
    'sol': {'skin': '4', 'hair': 'short', 'hairCol': 'd', 'outfit': 'tunic', 'outfitCol': 'g', 'accent': 'l'},
    'nia': {'skin': '1', 'hair': 'spiky', 'hairCol': 'o', 'outfit': 'hoodie', 'outfitCol': 'r', 'accent': 'y'},
    'tess': {'skin': '1', 'hair': 'bun', 'hairCol': 'r', 'outfit': 'tunic', 'outfitCol': 'p', 'accent': 'c'},
}
# outfitCol 'o' is NOT in keeper.js outfitCol list. Cole uses outfitCol o. Fix to a legal colour.
looks['cole']['outfitCol'] = 'r'
# accent 'l' is legal. outfit hoodie c is legal (c is not in outfitCol!). kit outfitCol 'c' is ILLEGAL.
# outfitCol: t b g p n r m. accent: r y c l w o p. hairCol: p d o y r h n.
looks['kit']['outfitCol'] = 'b'
looks['otto']['outfitCol'] = 'b'

speakers = {
    'Warden Ilse': 'ilse',
    'Keeper Moss': 'moss',
    'Mira': 'mira',
    'Baker Cole': 'cole',
    'Kit': 'kit',
    'Porter Quin': 'quin',
    'Captain Lumen': 'petra',
    'Keeper Rowan': 'sorrel',
    'Dockhand Ness': 'ness',
    'Teacher Mae': 'nessa',
    'Teller Ivo': 'teller',
    'Floor Keeper Sol': 'sol',
    'Keeper Vesper': 'ivo',
    'Nim': 'nim',
    'Sera': 'sera',
    'Otto': 'otto',
    'Bramble': 'bramble',
    'Willa': 'willa',
    'Clerk Nia': 'nia',
    'Landlord Oren': 'oren',
    'Guide Tess': 'tess',
    'Clerk Penn': 'willa',
    'Porter Bram': 'bram',
}

# Hearthmoor coach: one path tile south of the east-west road, beside the Lodge.
ms = json.loads((root / 'data' / 'maps_slice.json').read_text())
old = ms['maps']['hearthmoor']['grid'][9]
assert len(old) == 24 and old[12] == 'g', old
coach_row = old[:12] + 'p' + old[13:]

TOKEN = {'pet': 10, 'name': 10, 'player': 10, 'species': 9, 'type': 5, 'suggest': 9, 'rival': 9, 'rivalType': 5}

def expanded_len(s):
    def repl(m):
        k = m.group(1)
        if k not in TOKEN:
            raise SystemExit('bad token ' + k)
        return 'x' * TOKEN[k]
    out = re.sub(r'\{(\w+)\}', repl, s)
    if '  ' in s or '{' in out:
        raise SystemExit('double space or leftover token in ' + s)
    return len(out)

def check_text(where, s, limit):
    if not isinstance(s, str):
        return
    n = expanded_len(s)
    if n > limit:
        raise SystemExit('%s over %d (%d): %s' % (where, limit, n, s))

def walk_steps(where, node):
    if not isinstance(node, list):
        return
    if node and node[0] == 'say':
        check_text(where, node[2], 110)
    elif node and node[0] == 'choice':
        check_text(where, node[1], 110)
        for opt in node[2]:
            check_text(where + ' label', opt[0], 30)
            walk_steps(where, opt[1])
        return
    for x in node:
        walk_steps(where, x)

for sid, steps in scenes.items():
    walk_steps(sid, steps)
for o in objs:
    for k, v in (o.get('lines') or {}).items():
        check_text(o['id'] + '.' + k, v, 110)
    for k, v in (o.get('chatter') or {}).items():
        check_text(o['id'] + ' chatter', v, 40)
    if o.get('text'):
        check_text(o['id'], o['text'], 110)
    if o.get('deny'):
        check_text(o['id'] + ' deny', o['deny'], 110)
for rm in rooms.values():
    for o in rm['objs']:
        for k, v in (o.get('lines') or {}).items():
            if isinstance(v, str) and not v.startswith('@'):
                check_text(o['id'] + '.' + k, v, 110)
        for k, v in (o.get('chatter') or {}).items():
            check_text(o['id'] + ' chatter', v, 40)
        if o.get('text'):
            check_text(o['id'], o['text'], 110)

doc = {
    'spec': 'HIGH_CHARITY',
    'version': '1.0',
    '_about': 'High Charity, the Keeper capital. Largest outdoor map (64x40). Unlocked after the faction pledge. Five Event Hall minigames are a side quest from Warden Ilse, not a step in the main chain.',
    'tiles': {
        'P': {'name': 'plaza stone', 'walk': True},
        'D': {'name': 'dock plank', 'walk': True},
        'A': {'name': 'airship pad', 'walk': True},
    },
    'slicePatch': {
        '_note': 'The lantern coach sits on Hearthmoor, one tile south of the east-west path. The warp stays hidden until the faction pledge.',
        'maps': {
            'hearthmoor': {
                'gridRows': {'9': coach_row},
                'addObjs': [
                    {'kind': 'warp', 'id': 'hm_to_hc', 'x': 12, 'y': 9, 'to': 'highcharity', 'tx': 32, 'ty': 37,
                     'facing': 'up', 'when': ['story.side_pick_done'], 'need': 'story.side_pick_done',
                     'setFlag': 'story.hc_arrived'},
                    {'kind': 'npc', 'id': 'hm_bram', 'name': 'Porter Bram', 'look': 'bram', 'x': 11, 'y': 9, 'facing': 'right',
                     'when': ['story.side_pick_done'],
                     'lines': {
                         '!story.hc_invite': "Ilse has a letter inside. The city is open, but the hall booths are not.",
                         'else': "Step on the lantern mark. I'll have you at the south gate.",
                     }},
                    {'kind': 'sign', 'id': 'hm_sign_coach', 'x': 13, 'y': 9, 'when': ['story.side_pick_done'],
                     'text': 'LANTERN COACH · High Charity. Step on the mark.'},
                ],
            },
        },
    },
    'maps': {
        'highcharity': {
            'name': 'High Charity', 'backdrop': 'town', 'music': 'charity',
            'w': W, 'h': H, 'spawns': None, 'respawn': None,
            'respawnIn': {'map': 'hc_lantern_in', 'x': 2, 'y': 3, 'facing': 'up'},
            'safe': {'x': 32, 'y': 37}, 'zones': [],
            'roofs': ROOFS,
            'grid': rows,
            'objs': objs,
        },
    },
    'rooms': rooms,
    'scenes': scenes,
    'trainers': trainers,
    'looks': looks,
    'speakers': speakers,
}

for o in doc['slicePatch']['maps']['hearthmoor']['addObjs']:
    for k, v in (o.get('lines') or {}).items():
        check_text(o['id'], v, 110)
    if o.get('text'):
        check_text(o['id'], o['text'], 110)

out = root / 'data' / 'highcharity.json'
out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + '\n')
print('wrote', out, 'tiles', W * H, 'objs', len(objs), 'rooms', len(rooms), 'reachable', len(seen))
