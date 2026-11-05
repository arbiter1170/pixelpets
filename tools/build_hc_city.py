#!/usr/bin/env python3
"""HIGH_CHARITY_LAYOUT v0.4.2 (phase 1, "the capital, day one", plus the phase 2 rows that need no new room): writes
data/hc_city_v2.json.
v0.3 (D1354): the Keeper High Court stands on the Parade's south half, its front and wide steps facing Muster Road.
v0.4 (D1426): the Governor's House floors 1-2 open in Act 2; the President's rooms keep Act 5. v0.4.1-v0.4.2: names and text
only. Rooms that still wait for Vincent's rule 9 previews are listed in RULE9_HELD and are never built here.

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
ROAD = set('CZ')            # carriageway and crosswalk: walk tiles nothing may stand on (layout §4.1)
RWALK = set('.=m-+*,:;~')   # room floor, rug, mat; - + * are the Cabinet Room's runner (CABINET 1b); , : ; ~ the museum's (WAR_MUSEUM)
fails, notes = [], []

def fail(msg): fails.append(msg)
def note(msg): notes.append(msg)

ap = argparse.ArgumentParser()
ap.add_argument('--layout', default=os.path.join(ROOT, 'design', 'specs', 'high_charity_layout.json'))
ap.add_argument('--rotor', default=None, help='design specs/rotor_craft_preview/rotor_craft_frames.json (ROTOR_CRAFT draft frames); default: next to --layout')
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
    'gov_line': "Without an appointment? I'm afraid even I need one of those, most days.",
    # GOVERNOR_MEETING v0.2.1 §5 (D1471, D1472, D1473); signed by Story, STORY_LINES D2138 (gov_line and gov_m6 re-voiced)
    'gov_desk': "The Governor will see you, Cadet. Go on through.",
    'gov_m2': "Warden Ilse's new Cadet. Don't sit. You won't be here long enough to need a chair.",
    'gov_m3': "I've work for you. Kilnmouth's springs have gone cold this season. Nobody there can tell me why.",
    'gov_m4': "A Calm Tower went up there the same season. Its permit is in order. I checked it myself.",
    'gov_m5': "And their council has an empty seat. Everyone has a name for it. I'd like the town's.",
    'gov_m6': "Go and look. Listen more than you talk. Then come back and tell me what you found, in plain words.",
    'gov_m7a': "You know where Fernbrook's Seals went.",
    'gov_tell': "Tell him about the ledger",
    'gov_keep': "Keep it to myself",
    'gov_told_n': "You tell him about the crate ledger: LAMP STOCK, from the Fernbrook allotment. By permit.",
    'gov_told': "Lamp stock. My office signs a hundred permits a week. I'll ask. Kindly, but I'll ask.",
    'gov_kept': "You've the look of someone holding something back. Keep it, then. Bring it when it's ready.",
    'gov_m8': "Kilnmouth, then. Safe roads, Cadet.",
    'gov_after': "Kilnmouth's springs, and the empty seat. Come back when you know more.",
    'gov_stair': "[PLACEHOLDER] Upstairs is the President's floor. Not today, holder.",
    'court': "The Court is not sitting.",
    'closed': "Closed for now.",                                # PLACEHOLDER facade line (Store Row a-c, the Exchange, Ferry House, College)
    'boarded': "Boarded up.",                                   # PLACEHOLDER (Store Row d, the Glimmerwell named slot)
    'fish': "The stalls are packed away for now.",              # PLACEHOLDER
    'gallery': "[PLACEHOLDER] The gallery stair is roped off for now.",
    'hb14_gate': "Sealed. The tide decides.",                  # §11 HB14, Design's stub for Story (PLACEHOLDER)
    'news_bill': 'A Block News bill. BLOCK NEWS · Who. Where. What changed.',
    'apt_b': None,                                              # kept text
    # CABINET_AND_COUNCILS v0.2.2 phase 1b. thr_cabinet_lead is CHIP_HINTS' four SIGNED lines (D1470: unchanged). The rest is the
    # packet's v0.1 words, which Story's CABINET_LINES keeps as written (D2152; settled by Vincent, Wed Nov 4, 2026, all defaults).
    'lead_1': "Sit a moment, {name}. A new report on the lamps came in this morning. Half of it was gone by noon.",
    'lead_2': "People tell us their Walklings come home quiet. A week later, the same people won't say a word.",
    'lead_3': "The Governor wants you at the cabinet table in High Charity. Take the seat. Keep your ears open.",
    'lead_4': "Every case on those lamps reaches the Court empty. Ask yourself who empties them.",
    'cab_deny': "Cabinet in session. Members only.",               # L1
    'cab_plate': "A brass plate: FOR A HOLDER OF THE ROLL.",        # L2
    'cab_board_6': "KILNMOUTH: 6 OF 7",                             # B1 (CABINET §4.1 T2)
    'cab_board_7': "KILNMOUTH: 7 OF 7",                             # B2
    's1_ask': "First matter. Kilnmouth's empty seat. Our Cadet went and listened. Cadet, whose name?",
    's1_town': "The Bathkeeper", 's1_cmdr': "The Commander's pick", 's1_co': "The works foreman", 's1_wait': "Not yet",
    's1_3a': "The town's own name. Well. Order will follow, I'm sure.",
    's1_3b': "A Keeper's man. Good. Order first.",
    's1_3c': "A sensible name. Kilnmouth will be warm by spring.",
    's1_3d': "Then go back and listen. The matter waits for you.",
    's1_4': "Then it's confirmed. Take the letter to the Reeve, Cadet.",
    # CABINET §3.5 K6, the report-back (CABINET_LINES K6.1-K6.3, KEEP; settled by Vincent Wed Nov 4 with the rest of that file)
    'k6_1': "In default of the council? I stamped that. It was in order. It was also a tie.",
    'k6_2': "Two names were on my desk before you left. One came down from upstairs.",
    'k6_3': "A seat is confirmed at the cabinet, Cadet, not in an office. Bring the name to the table.",
    # §8.2 scheduled townsfolk: the layout gives roles, not lines; Story writes them (PLACEHOLDER)
    'sch_student': "[PLACEHOLDER: a College student's line; Story writes it.]",
    'sch_clerk': "[PLACEHOLDER: the Exchange clerk's line; Story writes it.]",
    'sch_dockhand': "[PLACEHOLDER: the pier dockhand's line; Story writes it.]",
    'sch_shopper': "[PLACEHOLDER: the shopper's line; Story writes it.]",
    'sch_office': "[PLACEHOLDER: the office worker's line; Story writes it.]",
}
# WAR_MUSEUM v0.1.1 (design specs/WAR_MUSEUM.md, settled by Vincent Thu Nov 5, 2026, all defaults: D2300-D2318). Every line is the
# packet's PLACEHOLDER copy for Story, word for word (§2, §3.2, §7); names stay PLACEHOLDER (D2302). Lines marked ENG are the
# engineer's (the packet wrote none for that spot), listed in OPEN_DECISIONS (D2307-build). All inside §3.3's limits (D2317).
TXT.update({
    'wm_sign': "MUSTER ROAD MUSEUM. Open every day. Free.",
    'wm_runner': "Walk the middle. Both sides are yours.",
    # the curator (§7.1) and the Stamp Trail (§2.1)
    'wm_cur_hello': "Welcome, colleague. Both halves are open, both are free. I wrote the cards on this side.",
    'wm_cur_wing': "The Wing's cards come printed from Brightgate. I'm allowed to dust them.",
    'wm_cur_stone': "Carried. Moved. Carried. I keep changing that card. The Stone doesn't mind.",
    'wm_cur_case': "It isn't lost. It's kept. Those are different words, colleague.",
    'wm_cur_switch': "Wine vest or green pin, the cases don't check. Mind the glass.",
    'wm_cur_seen': "You've seen the page, then. Don't tell me what's on it. I like my case empty.",
    'wm_cur_best': "My best curator's back. Touch nothing. Look at everything.",
    'wm_cur_plates': "Old script. We can't read it, so we frame it.",
    'wm_hook': "Every visitor gets a card. Five cases, five stamps. Grown-ups are allowed.",
    'wm_ask': "Stamp the card at the lantern wall, the map case, the Scout's lamp, the drum, and the empty case.",
    'wm_snag': "That one's a trick. There's no stamp. You fill it yourself. What goes in it?",
    'wm_pick_lantern': "A lantern", 'wm_pick_name': "A name", 'wm_pick_empty': "Leave it empty",
    'wm_res_lantern': "Bright answer.", 'wm_res_name': "Whose, I wonder.", 'wm_res_empty': "Ha. You'd make a good curator.",
    'wm_journal': "Stamped the whole card at the Muster Road Museum.",
    'wm_stamped': "Card stamped.",                                                  # ENG toast
    'wm_got_lamp': "{name} got an old oil lamp keepsake.",                         # ENG (the reward's own line)
    # the donation lantern and the plaque (§2.2)
    'wm_give': "Gifts keep the lamps lit. Give?", 'wm_give_10': "10 Acorns", 'wm_give_50': "50 Acorns", 'wm_give_no': "Not now",
    'wm_short': "Not enough Acorns.",                                               # ENG (the game's own short-purse words)
    'wm_friends_toast': "Your name is on the Friends board.",
    'wm_plaque_ask': "[PLACEHOLDER] A plaque, then. Which case gets your plate?",   # ENG prompt; the labels are the packet's
    'wm_plaque_l': "The lanterns", 'wm_plaque_d': "The drum", 'wm_plaque_t': "The letters",
    'wm_lit_by': "A small plate: Lit by {name}.",
    # the docent (§7.2) and the bench regular (§7.3)
    'wm_doc_hello': "Welcome to the Bright Years Wing! Hard years, new partners, brighter by nature!",
    'wm_doc_any': "The old side has carts. We have lamps. Which would you rather read by?",
    'wm_doc_switch': "Associate! You'll love the kiosk. Same slides as the lobby. Have a bright day!",
    'wm_doc_drum': "We restored it! Partnership is looking after old things. Kindly.",
    'wm_eld_a': "I come for the letters. I don't read them. I just sit with them.",
    'wm_eld_b': "Lanterns that heavy, you don't pull alone.",
    'wm_eld_late': "They walked home. Some of us walked with them.",
    # the exhibits (§3.2): label (the card or plate), then what a tap adds
    'k1_label': "Lanterns of the war years, lent by the towns.", 'k1_tap': "Dented, every one. One has never been lit.",
    'k1_pet': "{pet} looks at the dark one.",
    'k2_label': "A Keeper notice, from the war.", 'k2_tap': "WALK BESIDE THEM, NOT AHEAD. A lot of blank paper under it.",
    'k2_after': "One line, and room for one more.",
    'k3_label': "THE LANTERN MUSTER. Chapter four.", 'k3_tap': "Chapter four ends mid-page.",
    'k4_label': "Rubbings of the Hall plates, lent by holders.", 'k4_tap': "Old script. Nobody here can read it.",
    'k4_eighth': "The eighth plate is under the Muster Hall, they say.",
    'k5_label': "THE ROLL. First page.", 'k5_card': "Kept by the Warden of the Roll. Not shown here.",
    'k5_card_after': "On view in the Muster Hall.", 'k5_tap': "An empty case, dusted every day.",
    'k6_label': "The Duskwater Stone, carried to safety.", 'k6_tally': "ONE STONE. WHOLE.",
    'k6_tap': "The road runs to the capital. Some towns on the map are inked over.", 'k6_after': "It went where the roll was kept.",
    'k7_label': "Walklings served.", 'k7_tap': "A lantern cart. The hook at the front is empty.", 'k7_cut': "Hook, no strap.",
    'k7_after': "They walked home in these.",
    'k8_label': "The lanterns stayed lit on every road.", 'k8_tap': "A coach bell, tied to the lantern's foot.",
    'k9_label': "Letters home.", 'k9_tap': "Most say the weather. One says: he's eating well, don't worry.",
    'k9_regular': "Somebody reads these every day.",
    'k10_label': "A Keeper Scout's lamp.", 'k10_tap': "Old Scouts didn't write much down. They said things twice.",
    'k11_brass': "The first Picking Day drum. The peace's gift.", 'k11_new': "Restored with the kind support of Glimmerwell Co.",
    'k11_tap': "The drum turns. Nothing falls out.", 'k11_parade': "A card pinned on: PICKING DAY SUSPENDED. BY ORDER.",
    'k11_after': "The one Walkling nobody could call.",
    'k12_label': "Kids' corner. Stamps are free.", 'k12_tap': "Stamp the card. Five cases, five stamps.",
    'k12_easel': "Drawings by visiting kids. One Walkling has a lantern tail.",
    'k13_friends': "FRIENDS OF THE MUSEUM.", 'k13_friends_named': "FRIENDS OF THE MUSEUM. {name}.",
    'w1_label': "The Bright Years. New light for every roof.", 'w1_tap': "Partnership started in hard years. The years aren't named.",
    'w2_label': "Our first lamp. It lit the hard years.", 'w2_tap': "It looks newer than the cart next door.",
    'w3_label': "Touch to learn more!", 'w3_s1': "Hard years.", 'w3_s2': "New partners.", 'w3_s3': "Brighter by nature! Have a bright day!",
    'w3_next': "Next", 'w3_leave': "Leave",
    'wm_sponsor': "THE BRIGHT YEARS WING. Given by Glimmerwell Co.",
})
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
    'hc_president': {'skin': '3', 'hair': 'short', 'hairCol': 'w', 'outfit': 'coat', 'outfitCol': 'g', 'accent': 'y', 'accessory': 'sash'},   # RETIRED (LOOK_LOCK D2275): nobody wears it; the President is `president`. Kept, never removed
    'hc_aide':      {'skin': '2', 'hair': 'bun', 'hairCol': 'd', 'outfit': 'jacket', 'outfitCol': 'g', 'accent': 'w'},
    # §8.2 scheduled townsfolk (PLACEHOLDER looks from the kit's parts)
    'hc_student_a': {'skin': '3', 'hair': 'curls', 'hairCol': 'd', 'outfit': 'sweater', 'outfitCol': 'r', 'accent': 'w', 'accessory': 'glasses'},
    'hc_student_b': {'skin': '5', 'hair': 'pony', 'hairCol': 'k', 'outfit': 'cardigan', 'outfitCol': 'b', 'accent': 'y'},
    'hc_clerk_x':   {'skin': '1', 'hair': 'short', 'hairCol': 'o', 'outfit': 'vest', 'outfitCol': 'm', 'accent': 'w'},
    'hc_shopper':   {'skin': '6', 'hair': 'bob', 'hairCol': 'd', 'outfit': 'raincoat', 'outfitCol': 't', 'accent': 'y'},
    'hc_officeworker': {'skin': '2', 'hair': 'short', 'hairCol': 'h', 'outfit': 'jacket', 'outfitCol': 'm', 'accent': 'w'},
    # WAR_MUSEUM v0.1.1 §7 (D2315): the three looks from the kit's parts, checked by tests/look_lock.spec.js. The curator is a
    # civilian (no Keeper green, no pin); the docent wears Glimmerwell's staff set (rule 11: wine top, soot trim, the lanyard).
    'hc_curator':   {'skin': '2', 'hair': 'long', 'hairCol': '5', 'outfit': 'cardigan', 'outfitCol': 'E', 'accent': 'C', 'accessory': 'glasses'},
    'hc_docent':    {'skin': '2', 'hair': 'pony', 'hairCol': 'A', 'outfit': 'vest', 'outfitCol': 'V', 'accent': 'N', 'accessory': 'lanyard'},
    'hc_bench_regular': {'skin': '4', 'hair': 'buzz', 'hairCol': 'w', 'outfit': 'coat', 'outfitCol': 'I', 'accent': 'F', 'accessory': 'cap'},
}
SPEAKERS = {'Child': 'hc_child', 'Parent': 'hc_parent', 'Old holder': 'hc_oldholder', 'Dockhand': 'hc_dockhand',
            'Editor': 'hc_editor', 'Keeper reader': 'clerk', 'The President': 'president', 'Aide': 'hc_aide',
            'Commander': 'captain', 'Duty Keeper': 'officer', 'Governor Merriden': 'hc_governor', 'Visitor': 'hc_visitor',
            'Resident': 'hc_resident', 'Captain Lumen': 'captain',
            'Curator Edda Lorne': 'hc_curator', 'Associate Tansy': 'hc_docent', 'Bench regular': 'hc_bench_regular'}   # WAR_MUSEUM §7

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
        if not self.free(x, y) or self.ch(x, y) in ROAD: return False
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
# ROUTE_TO_GOVERNOR §5.9 (D1853): Charter Hill gains a north mouth, m_c1_n, five cells at x 46-50 on the top row (trees in the
# layout, so T becomes P). It opens into the lane between the Governor's House and the east block; it pairs with the river road
# (route4_reeds, outside the city), so it is built here rather than in the layout's chunk-to-chunk mouths.
R4_MOUTH = {'id': 'm_c1_n', 'cells': [(x, 0) for x in range(46, 51)], 'to': 'route4_reeds', 'tx': 1, 'ty0': 8, 'facing': 'right'}
_c1 = CHUNKS['hc_civic']
for (x, y) in R4_MOUTH['cells']:
    if _c1.grid[y][x] != 'T' or _c1.grid[y + 1][x] not in WALK: fail(f'hc_civic: north mouth cell {(x, y)} is not a tree over a walk tile')
    _c1.grid[y] = _c1.grid[y][:x] + 'P' + _c1.grid[y][x + 1:]
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
    'hc_gov':  {'to': 'hc_gov_1', 'tx': 7, 'ty': 14, 'facing': 'up', 'need': GOV1 + ' & story.gov_posted', 'deny': TXT['gov_door']},   # D1426/D1439: Act 2 on; D1473: after Ilse's posting
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

# ---------- HC_PARADE v0.3.1 stands (design specs/HC_PARADE.md §2-§3; the scene is #286/#296's tools/hc_parade.py) ----------
# The tiles the parade's crowd, cordon, guards, officers, car and crowd strips stand on. The city never dresses them (no lamp,
# sign, planter, bench or parked car), so the scene draws on clear ground; the roads themselves are clear by ROAD (layout §4.1).
# Copied from the beat sheet on claude/b1-parade-lore (#296) so the two builds agree; the scene stays that PR's.
PARADE_STANDS = {
    'highcharity': [(21, 23), (21, 24)] + [(x, 23) for x in range(17, 26)] + [(x, 24) for x in range(17, 26)]   # SPOT, P1_CROWD
                   + [(x, 22) for x in range(17, 27)],                                                         # P1_CORDON bays
    'hc_civic': [(28, 30), (28, 34), (24, 30), (25, 30), (26, 30), (24, 31), (25, 31), (26, 31), (27, 31), (24, 33), (25, 33),
                 (26, 33), (27, 33), (23, 33)]                                                                  # HILL_SPOT, CIV2
                + [(29, 28), (30, 28), (34, 28), (35, 28)]                                                      # LINE2
                + [(x, 29) for x in range(26, 37)]                                                              # CORDON2 bays
                + [(30, 26), (31, 26), (33, 26), (34, 26), (26, 28), (37, 28), (32, 31), (32, 30), (32, 29), (32, 28)]   # CLOSE2, OFF2, the car
                + [(21, 30), (21, 31), (21, 33), (21, 34), (24, 34), (37, 33), (41, 33), (37, 34), (41, 34), (25, 36), (29, 36),
                   (33, 36), (37, 36), (45, 33), (21, 28), (17, 28), (41, 28), (45, 28), (17, 30), (17, 31), (17, 33), (17, 34),
                   (21, 36), (41, 36), (45, 36), (45, 34), (38, 30), (42, 30), (46, 30), (38, 31), (42, 31), (46, 31)],   # STRIPS2
}
for cid, cells in PARADE_STANDS.items():
    for p in cells:
        if CHUNKS[cid].ch(*p) not in WALK | {'U'}: fail(f'{cid}: parade stand {p} is not a walk tile or a kerb bay')
    CHUNKS[cid].reserved.update(cells)

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

# ROUTE_TO_GOVERNOR §5.9 (D1853, D1867): the north mouth's warps (no `when`: walking out of the capital always works), the
# gate arch and the signpost one tile inside, two clipped trees down the lane, and the walk-in trigger (Moss's welcome, unchanged).
for i, (x, y) in enumerate(R4_MOUTH['cells']):
    _c1.add({'kind': 'warp', 'id': f"{R4_MOUTH['id']}_{i}", 'x': x, 'y': y, 'to': R4_MOUTH['to'], 'tx': R4_MOUTH['tx'], 'ty': R4_MOUTH['ty0'] + i,
             'facing': R4_MOUTH['facing']}, blocks=False)
    _c1.reserved.add((x, y))
    if not _c1.free(x, y + 1): fail(f'hc_civic: north mouth landing {(x, y + 1)} is not free')
    _c1.reserved.add((x, y + 1))
_c1.targets['mouth:' + R4_MOUTH['id']] = R4_MOUTH['cells'][2]
_c1.add({'kind': 'decal', 'id': 'hc2_arch_' + R4_MOUTH['id'], 'x': R4_MOUTH['cells'][0][0], 'y': 1, 'sprite': 'hc_gate_arch'})
_c1.add({'kind': 'trigger', 'id': 'hc_walk_in', 'x': 48, 'y': 1, 'r': 2, 'when': ['story.r4_walked', '!story.hc_arrived | !story.hc_greeted'],
         'scene': 'r4_walk_in'}, blocks=False)
for oid, (x, y), kw in (('hc2_post_' + R4_MOUTH['id'], (47, 2), {'kind': 'sign', 'sprite': 'signpost', 'text': f"{DISTRICT['hc_civic']} · This way: THE RIVER ROAD."}),
                        ('hc2_lane_tree_w', (47, 5), {'kind': 'prop', 'sprite': 'clipped_tree'}),
                        ('hc2_lane_tree_e', (49, 8), {'kind': 'prop', 'sprite': 'clipped_tree'})):
    if not _c1.safe_block(x, y): fail(f'hc_civic: {oid} at {(x, y)} would block the lane')
    _c1.add(dict(kw, id=oid, x=x, y=y))

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
        if {(x, y), (x + 1, y)} & set(PARADE_STANDS.get(cid, [])): continue                    # the parade's cordon bays stay empty
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
# §8.2 scheduled townsfolk (phase 2): schedule rows {when, map, x, y, facing, state, place}, first match wins, the last row
# (map null) is the fallback, so a body is off the map at home outside its rows. Each row's tile is checked like any blocker
# (never a door, mouth, patrol leg, parade stand, road or anchor; place_near nudges a spec tile that is solid or taken, and the
# build notes it). The row's map holds one body per map (same name; the first carries the rows; game.js wireSchedules joins
# them by name). Names are the layout's placeholder roles (D1277: Story names people); the key stays unique and the shown label
# drops the letter (NAMES_PASS D1744's rule). Lines without a §11 sample are marked PLACEHOLDER.
SCHED_LABEL = {}
def sched(oid, name, look, rows, label=None, **kw):
    out, bodies = [], {}
    for r in rows:
        if r[1] is None: out.append({'map': None, 'x': 0, 'y': 0, 'state': 'home', 'place': 'home (off the map)'}); continue
        when, mid, x, y, facing, state, place = r
        c = CHUNKS[mid]; spot = c.place_near(x, y, r=4, need_tap=True)
        if not spot: fail(f'{mid}: no tile for {oid} near {(x, y)}'); continue
        if spot != (x, y): note(f'{mid}: {oid} ({place}) wanted {(x, y)}, stands at {spot}')
        c.block[spot] = oid
        out.append({'when': when, 'map': mid, 'x': spot[0], 'y': spot[1], 'facing': facing, 'state': state, 'place': place})
        bodies.setdefault(mid, (spot, facing))
    if out[-1]['map'] is not None: fail(f'{oid}: schedule has no fallback row')
    for i, (mid, (spot, facing)) in enumerate(bodies.items()):
        o = dict({'kind': 'npc', 'id': oid if i == 0 else f'{oid}_{mid.replace("hc_", "")}', 'name': name, 'look': look,
                  'x': spot[0], 'y': spot[1], 'facing': facing, 'still': True}, **kw)
        if i == 0: o['schedule'] = out
        CHUNKS[mid].add(o, blocks=False)
    if label: SCHED_LABEL[name] = label

SQ, CO, EX, WF_, CV = 'highcharity', 'hc_college', 'hc_exchange', 'hc_waterfront', 'hc_civic'
HOME = (None, None)
sched('hc_child', 'Child', 'hc_child', [('phase:day', SQ, 14, 25, 'up', 'idle', 'under the noon lanterns'),
                                        ('phase:dusk', CO, 30, 35, 'down', 'play', 'the kite field'), HOME],
      scene='hc2_noon', lines={'else': TXT['hb1_child']})
sched('hc_parent', 'Parent', 'hc_parent', [('phase:day', SQ, 15, 25, 'up', 'idle', 'under the noon lanterns'),
                                           ('phase:dusk', CO, 31, 35, 'down', 'play', 'the kite field'), HOME],
      scene='hc2_noon', lines={'else': TXT['hb1_parent']})
sched('hc_oldholder', 'Old holder', 'hc_oldholder', [('phase:day', CO, 16, 40, 'right', 'idle', 'Charity Park bench'),
                                                      ('phase:dusk|phase:night', SQ, 24, 14, 'down', 'idle', 'the Lantern Steps'), HOME],
      scene='hc2_gran', lines={'else': TXT['hb8_gran']})
sched('hc_student_a', 'Student A', 'hc_student_a', [('phase:day', CO, 34, 20, 'down', 'study', 'the Quad'),
                                                     ('phase:dusk', SQ, 16, 27, 'right', 'idle', 'Lantern Square'), HOME],
      label='Student', lines={'else': TXT['sch_student']})
sched('hc_student_b', 'Student B', 'hc_student_b', [('phase:day', CO, 30, 12, 'up', 'study', 'College steps'),
                                                     ('phase:dusk', CO, 36, 37, 'down', 'idle', 'the bandstand'), HOME],
      label='Student', lines={'else': TXT['sch_student']})
sched('hc_clerk_x', 'Exchange Clerk', 'hc_clerk_x', [('phase:dawn', SQ, 36, 36, 'up', 'walk', 'the coach stop'),
                                                      ('phase:day', EX, 27, 14, 'down', 'work', 'the Exchange steps'),
                                                      ('phase:dusk', SQ, 20, 25, 'down', 'idle', 'Lantern Square bench'), HOME],
      label='Clerk', lines={'else': TXT['sch_clerk']})
sched('hc_dockhand_b', 'Dockhand B', 'hc_dockhand', [('phase:dawn|phase:day', WF_, 12, 28, 'left', 'work', 'the middle pier'),
                                                      ('phase:dusk', WF_, 33, 33, 'up', 'idle', 'the fish market'), HOME],
      label='Dockhand', lines={'else': TXT['sch_dockhand']})
sched('hc_shopper', 'Shopper', 'hc_shopper', [('phase:day', EX, 33, 33, 'down', 'shop', 'Store Row'),
                                              ('phase:dusk', SQ, 46, 28, 'up', 'shop', 'Lantern Market'), HOME],
      lines={'else': TXT['sch_shopper']})
sched('hc_officeworker', 'Office worker', 'hc_officeworker', [('phase:day', CV, 26, 17, 'down', 'work', "the Governor's steps"), HOME],
      lines={'else': TXT['sch_office']})
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
prop('hc_exchange', 'hc2_news_poster', 50, 16, 'poster_stand', r=3, lines={'else': TXT['news_bill']})

# Lantern Quay: rope coils and nets on the piers, the moored ferry spot noted for phase 2.
for i, (x, y) in enumerate([(12, 26), (12, 30), (12, 34)]): prop('hc_waterfront', f'hc2_rope_{i}', x, y, 'rope_coil', r=5)
prop('hc_waterfront', 'hc2_net', 30, 30, 'net_hang', r=3)
SC['hc2_gran'] = [['say', 'Old holder', TXT['hb8_gran']], ['setFlag', 'story.hc_gran', True]]

# College Green: the Quad clock statue, the park, the old holder's bench (HB8, day tile as a fixed anchor in phase 1).
prop('hc_college', 'hc2_college_clock', 36, 24, 'lm_statue', r=2)
for i, (x, y) in enumerate([(15, 40), (30, 36), (38, 30)]): prop('hc_college', f'hc2_park_bench_{i}', x, y, 'bench_long', r=2)
for i, (x, y) in enumerate([(5, 26), (20, 30), (42, 42), (6, 44)]): prop('hc_college', f'hc2_park_tree_{i}', x, y, 'lm_big_tree', r=3)

# Phase 2, the hooks and P1 props that need no new room (layout §10, §11, §12):
# HB14 the capital road (D1279, yellow at its default, behind HC_SPIRE_ROAD_HOOK): a sealed sea gate at the Quay's south end,
# 21,38 (the layout's hook_spire_road), tap only, no flag, no content. A52's art is P1 (Pia); the built weir sluice stands in.
HC_SPIRE_ROAD_HOOK = True
if HC_SPIRE_ROAD_HOOK:
    hook = next(h for h in CH['hc_waterfront']['hooks'] if h['id'] == 'hook_spire_road')
    o = prop('hc_waterfront', 'hc_sea_gate', hook['x'], hook['y'], 'weir_sluice', r=0, name='a sealed sea gate',
             lines={'else': TXT['hb14_gate']})
    if not o or (o['x'], o['y']) != (hook['x'], hook['y']): fail('hc_waterfront: the sea gate must stand on its hook tile 21,38')
# A46-A48 (P1, reuse): cafe tables by the Lantern Market, a Block News bill on the Square, bikes by the College steps.
for i, (x, y) in enumerate([(44, 30), (50, 30)]): prop('highcharity', f'hc2_sq_cafe_{i}', x, y, 'cafe_table', r=2)
prop('highcharity', 'hc2_sq_news_poster', 37, 30, 'poster_stand', r=3, lines={'else': TXT['news_bill']})
for i, x in enumerate((17, 29)): prop('hc_college', f'hc2_college_bike_{i}', x, 12, 'bike', r=2)

# Parks are spotless: clipped hedges and flowerbeds on open grass, a few per chunk, never on a way through.
# The Court's old corner (v0.3, D1354; the layout's §7.6) stays plain grass: no planting is placed there. WAR_MUSEUM (D2300) builds
# the museum on it, below, after every other placement on the hill.
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

# ---------- HC_PARADE (design specs/HC_PARADE.md v0.2): the parade, the speech and the street battles (tools/hc_parade.py) ----------
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hc_parade
PARADE = hc_parade.build(CHUNKS, keep, fail)
# ROTOR_CRAFT v0.1.1 (D1385-D1394, settled): Design's draft frames, read from the design repo and carried into the city data
# (rows deduplicated); sprites.js paints them on first draw. Without the file the engineer's own draft in sprites.js stands in.
ROTOR = args.rotor or os.path.join(os.path.dirname(os.path.abspath(args.layout)), 'rotor_craft_preview', 'rotor_craft_frames.json')
PARADE_ART = None
if os.path.exists(ROTOR):
    RF = json.load(open(ROTOR)); rows, idx, sprites = [], {}, {}
    for k, sp in RF['sprites'].items():
        def ri(r):
            if r not in idx: idx[r] = len(rows); rows.append(r)
            return idx[r]
        e = {'w': sp['w'], 'h': sp['h'], 'ms': sp['ms'], 'frames': [[ri(r) for r in f] for f in sp['frames']]}
        if sp.get('legend'): e['legend'] = sp['legend']
        sprites[k] = e
    PARADE_ART = {'_about': 'ROTOR_CRAFT v0.1.1 draft frames (design specs/rotor_craft_preview/rotor_craft_frames.json), Pia redraws; '
                            'rows of PAL keys, "." clear, legend chars are [PAL key, alpha]. Painted on first draw (sprites.js).',
                  'rows': rows, 'sprites': sprites}
    for k in ('keeper_rotor_r', 'keeper_rotor_front', 'rotor_shadow', 'rotor_shadow_front', 'rotor_beam_down'):
        if k not in sprites: fail(f'ROTOR_CRAFT frames: no {k}')
else:
    note('ROTOR_CRAFT frames not found (' + ROTOR + '): the engineer draft rotor art stands in')
hc_parade.use_rotor_frames(PARADE_ART is not None)
SC.update(PARADE['scenes'])
LOOKS.update(PARADE['looks'])

# ---------- WAR_MUSEUM v0.1.1: the Muster Road Museum on Charter Hill (D2300, D2301, D2305, D2314) ----------
# Design specs/WAR_MUSEUM.md §1.2, §4.3, §5.2 (settled by Vincent Thu Nov 5, 2026, all defaults; rule 9 previews approved). D2300
# lifts HIGH_CHARITY_LAYOUT §7.6's "nothing new is placed there" for the museum only: roof rows 38-41 and facade rows 42-43 on
# cells 2-14, a paved forecourt on row 44, door 8,44, facing south onto the sidewalk. E1 Banner Front as previewed (D2301): a
# green shingle gable on pale ashlar, arched lit windows, J trim, a lit finial, the cut-stone lintel, two banners (the Wing's is
# the only wine on the front), the forecourt pieces and the boot-and-paw print trail on row 45 (decals, walkable). Rule 10 (D2314):
# the facade cells beside the door (7,43 and 9,43) stay bare, there is no badge plate, and the town map gives it the plain door
# mark (the door is not in TOWN_DOOR_ART). Opens from story.hc_arrived (D2305), behind HC_MUSEUM, after HC phase 1. Built here,
# after every other placement on the hill, so no earlier piece or id moves; only the corner's round planter (15,41) goes (§5.2).
HC_MUSEUM = True
MUSEUM_BOX, MUSEUM_DOOR = (2, 38, 14, 43), (8, 44)
if HC_MUSEUM:
    M = CHUNKS['hc_civic']
    for y in range(MUSEUM_BOX[1], MUSEUM_BOX[3] + 2):          # 38-41 roof, 42-43 facade, 44 the forecourt
        for x in range(MUSEUM_BOX[0], MUSEUM_BOX[2] + 1):
            if M.ch(x, y) != 'g': fail(f'hc_civic: museum cell {(x, y)} is not lawn ({M.ch(x, y)})')
            if (x, y) in M.block or (x, y) in M.reserved: fail(f'hc_civic: museum cell {(x, y)} is taken')
            M.grid[y] = M.grid[y][:x] + ('R' if y <= 41 else 'H' if y <= 43 else 'P') + M.grid[y][x + 1:]
    for o in [o for o in M.objs if o['id'] == 'hc2_plant_hc_civic_5']:
        if (o['x'], o['y']) != (15, 41): fail('hc_civic: hc2_plant_hc_civic_5 moved; WAR_MUSEUM §5.2 removes the planter at 15,41')
        M.objs.remove(o); M.ids.discard(o['id']); M.block.pop((o['x'], o['y']), None)
    roofs['hc_civic']['museum'] = roof_entry([MUSEUM_BOX[0], MUSEUM_BOX[1], MUSEUM_BOX[2], 41],
        {'roof': 'roof_shingle_g', 'wall': 'wall_ashlar_w', 'door': 'door_double', 'win': ['win_arch'], 'trim': 'J', 'shape': 'gable'})
    dx, dy = MUSEUM_DOOR
    M.add({'kind': 'door', 'id': 'hc_museum', 'x': dx, 'y': dy, 'to': 'hc_museum_in', 'tx': 7, 'ty': 14, 'facing': 'up',
           'need': 'story.hc_arrived', 'setFlag': 'story.wm_visited'}, blocks=False)
    M.reserved.add((dx, dy)); M.targets['door:hc_museum'] = (dx, dy)
    M.add({'kind': 'decal', 'id': 'hc2_finial_museum', 'x': 8, 'y': 38, 'sprite': 'hc_finial'})   # A34: lit, like every roof but the Hall's
    M.add({'kind': 'prop', 'id': 'wm_lintel', 'x': 8, 'y': 42, 'sprite': 'wm_x_lintel'})            # A-X1, on the facade
    M.add({'kind': 'prop', 'id': 'wm_ban_k', 'x': 4, 'y': 43, 'sprite': 'wm_x_banner_keeper'})      # A-X2
    M.add({'kind': 'prop', 'id': 'wm_ban_w', 'x': 12, 'y': 43, 'sprite': 'wm_x_banner_wing'})       # A-X3
    for oid, x, sprite, kw in (('wm_urn_w', 2, 'stone_urn', {}), ('wm_lamp_w', 3, 'hc_lamp_box', {'lines': {'else': TXT['hb2_box']}}),
                               ('wm_poster', 5, 'poster_stand', {}), ('wm_bench', 11, 'bench_long', {}),
                               ('wm_lamp_e', 13, 'hc_lamp_box', {'lines': {'else': TXT['hb2_box']}}), ('wm_urn_e', 14, 'stone_urn', {})):
        if not M.safe_block(x, 44): fail(f'hc_civic: {oid} at {(x, 44)} would block the museum forecourt')
        M.add(dict({'kind': 'prop', 'id': oid, 'x': x, 'y': 44, 'sprite': sprite}, **kw))
    if not M.safe_block(6, 44): fail('hc_civic: wm_sign at (6, 44) would block')
    M.add({'kind': 'sign', 'id': 'wm_sign', 'x': 6, 'y': 44, 'text': TXT['wm_sign']})
    for x in range(8, 19, 2):                                    # A-X4: the prints lead the last ten tiles along row 45 (§1.2)
        if not M.walk(x, 45): fail(f'hc_civic: print {(x, 45)} is not on the sidewalk')
        M.add({'kind': 'decal', 'id': f'wm_prints_{x}', 'x': x, 'y': 45, 'sprite': 'wm_x_prints'})
    for x in (7, 9):                                             # D2314: the cells beside the door stay bare
        if any(o['x'] == x and o['y'] == 43 for o in M.objs): fail(f'hc_civic: rule 10 cell {(x, 43)} is dressed')

# ---------- the final outdoor checks ----------
for cid, c in CHUNKS.items():
    for (x, y), who in c.block.items():
        if c.ch(x, y) in ROAD: fail(f'{cid}: {who} stands on the road at {(x, y)} (layout §4.1: nothing on a road stops a holder)')
        if (x, y) in PARADE_STANDS.get(cid, ()) and who != 'hc_court_steps': fail(f'{cid}: {who} stands on a parade stand {(x, y)}')
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
def S_(oid, x, y, text, sprite=None, **kw):
    o = {'kind': 'sign', 'id': oid, 'x': x, 'y': y, 'text': text}
    if sprite: o['sprite'] = sprite
    o.update(kw)
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
# §5.3): the door, Governor Merriden and the ORDERS DOWN chute (HB12) open with GOV1. CABINET_AND_COUNCILS 1b: the stair goes to
# the Cabinet Room (floor 2), open on the seat's key (CAB, §4.3, D1465 moved there) or on GOV3, so an Act 5 save from before the
# cabinet still reaches the President's rooms (floor 3) through it. A blocked stair says its deny on the bump.
part = lambda: '#' + '.' * 8 + '#' + '.' * 5 + '#'
g = ['#' * 16, '#' + 'W' * 14 + '#'] + [part() for _ in range(3)] + ['#' + '.' * 14 + '#'] * 2 + [part() for _ in range(8)] + ['#######m########']
GOV3 = '!story.side=glimmer & story.act>=5 & story.hc_gov_met'
CAB = '!story.side=glimmer & story.thr_chip_rumour & story.hc_parade_seen'     # CABINET §4.3: the room opens
STAIR2 = CAB + ' | ' + GOV3
LEAD = ['!story.side=glimmer', 'story.km_reported', '!story.thr_chip_rumour']   # CABINET §4.3: the lead-in's key
SIT1 = ['!story.side=glimmer', 'story.pres_cabinet_first', '!story.km_seat_pick']   # S1's key (K2a's flag; K2a waits on the parade)
objs = [{'kind': 'warp', 'id': 'hc_gov_1_mat', 'x': 7, 'y': 15, 'to': 'hc_civic', 'tx': 32, 'ty': 16, 'facing': 'down'},
        {'kind': 'warp', 'id': 'hc_gov_up', 'x': 1, 'y': 2, 'to': 'hc_gov_2', 'tx': 1, 'ty': 3, 'facing': 'down', 'need': STAIR2,
         'deny': TXT['cab_deny']},
        D('hc2_gov_stair_1', 1, 2, 'stair_flight')]
objs += [P(f'hc2_lobbydesk_{x}', x, 9, 'keep_desk', name='the Keeper desk') for x in (2, 3, 4)]
objs.append(N('hc_gov_keeper_a', 'Keeper', 'officer', 3, 8, 'down', lines={'story.gov_posted & !story.hc_gov_met': TXT['gov_desk'], 'else': 'Welcome to the Governor\'s House, holder.'}))
objs.append(N('hc_gov_keeper_b', 'Keeper', 'officer', 2, 3, 'down', lines={STAIR2: 'Go on up, holder.', 'else': TXT['gov_stair']}))
# CABINET §4.3 (D1470 = A): Lumen's lead-in, four SIGNED lines, on a Captain Lumen body in the lobby (default staging), keyed after
# the Kilnmouth report-back. It is the only setter of story.thr_chip_rumour; the body leaves once it is set. Keyed on a story flag,
# not `else`, so the High Charity letter's lines (D174, spliced in front of everyday chatter) stay behind it.
LUMEN = 'Captain Lumen'
SC['thr_cabinet_lead'] = [['say', LUMEN, TXT['lead_1']], ['say', LUMEN, TXT['lead_2']], ['say', LUMEN, TXT['lead_3']],
                          ['say', LUMEN, TXT['lead_4']], ['setFlag', 'story.thr_chip_rumour', True]]
objs.append(N('cab_lumen_lobby', LUMEN, 'captain', 4, 3, 'down', when=LEAD, lines={'story.km_reported': '@thr_cabinet_lead'}))
objs += [P(f'hc2_govdesk_{x}', x, 4, 'keep_desk', name="the Governor's desk") for x in (11, 12)]
SC['hc2_chute'] = [['say', '', TXT['hb12_chute']], ['setFlag', 'story.hc_chute', True]]
objs.append(P('hc_chute_mouth', 13, 4, 'hc_chute_mouth', name='the ORDERS DOWN chute', scene='hc2_chute', lines={'else': TXT['hb12_chute']}))
# GOVERNOR_MEETING v0.2.1 §5 (D1471-D1473): the meeting, one scene for every holder (no @glimmer variant, D1543). He comes
# round the chute end of his desk (13,3 / 14,3 / 14,4); the player stands at governor_front (12,5). The only choice shows
# when the holder saw Fernbrook's ledger (story.shift_g). Flags are written at the end, so an interrupted meeting replays.
GM = 'Governor Merriden'
SC['hc_gov_meet'] = [
    ['walkTo', 'hc_governor', 14, 4],
    ['say', GM, TXT['gov_m2']], ['say', GM, TXT['gov_m3']], ['say', GM, TXT['gov_m4']], ['say', GM, TXT['gov_m5']], ['say', GM, TXT['gov_m6']],
    ['if', 'story.shift_g', [
        ['choice', TXT['gov_m7a'], [
            [TXT['gov_tell'], [['say', '', TXT['gov_told_n']], ['say', GM, TXT['gov_told']], ['setFlag', 'story.gov_told', 'told']]],
            [TXT['gov_keep'], [['say', GM, TXT['gov_kept']], ['setFlag', 'story.gov_told', 'kept']]],
        ], ''],
    ]],
    ['say', GM, TXT['gov_m8']],
    ['setFlag', 'story.km_assigned', True], ['setFlag', 'story.hc_gov_met', True],
]
# CABINET §3.5 K6 (1a): the Kilnmouth report-back replaces his repeat once the fence permit is read; it opens the lead-in (§4.3).
SC['km_report'] = [['say', GM, TXT['k6_1']], ['say', GM, TXT['k6_2']], ['say', GM, TXT['k6_3']], ['setFlag', 'story.km_reported', True]]
objs.append(N('hc_governor', GM, 'hc_governor', 12, 3, 'down', when=['story.act>=2'],
              lines={'story.gov_posted & !story.hc_gov_met': '@hc_gov_meet', 'story.km_permit_seen & !story.km_reported': '@km_report',
                     'story.km_assigned': TXT['gov_after'], 'else': TXT['gov_line']}))
objs += [P('hc2_gov_flag_w', 10, 2, 'banner_keeper'), P('hc2_gov_flag_e', 14, 2, 'banner_keeper')]
ROOMS['hc_gov_1'] = room('hc_gov_1', "Governor's House", 'hc_gov', 'hc_civic', g, 'hc_gov_1', objs, (7, 14))

# hc_gov_2, the Cabinet Room, 14x12 (§7.3 floor 2; CABINET_AND_COUNCILS v0.2.2 §4.1-§4.3, phase 1b). Rule 9: Vincent approved the
# previews (Wed Nov 4, 2026: 14x12, the seat tells as drawn, a third floor tile); the placements are the layout draft's (§3-§5).
# Reached by stairs only: down to floor 1 (1,2), up to floor 3 (1,10, GOV3). The long table (3x5 slices) with twelve chairs, even
# seats west at the Governor's right hand; the twelfth is a walkable decal and S1's trigger. Tells as drawn: the Treasury's folder
# with its `r` ribbon (table slice 2), Roads and Coaches' newer chair (seat 4). The members sit as bodies only at a sitting.
g = ['#' * 14, '#' + 'W' * 12 + '#', '#' + '.' * 12 + '#'] + ['#..=' + '.' * 9 + '#' for _ in range(5)] + \
    ['#..+--*......#', '#' + '.' * 12 + '#', '#' + '.' * 12 + '#', '#' * 14]
objs = [{'kind': 'warp', 'id': 'hc_gov2_down', 'x': 1, 'y': 2, 'to': 'hc_gov_1', 'tx': 2, 'ty': 2, 'facing': 'right'},
        {'kind': 'warp', 'id': 'hc_gov2_up', 'x': 1, 'y': 10, 'to': 'hc_gov_3', 'tx': 2, 'ty': 12, 'facing': 'up', 'need': GOV3},
        D('hc2_gov_stair_2', 1, 2, 'stair_flight'), D('hc2_gov_stair_2up', 1, 10, 'stair_flight')]
# the wall face (row 1): the order paper, the seating board (B1, B2), the towns map, the chute pipe, the OUT slot, a clock
objs += [D('cab_order_paper', 3, 1, 'pa_notice_pins'),
         D('cab_seat_board', 4, 1, 'cab_seat_board', when=['!story.km_seat_filled']),
         D('cab_seat_board_full', 4, 1, 'cab_seat_board_full', when=['story.km_seat_filled']),
         S_('cab_board_6', 4, 1, TXT['cab_board_6'], 'none', when=['!story.km_seat_filled']),
         S_('cab_board_7', 4, 1, TXT['cab_board_7'], 'none', when=['story.km_seat_filled'])]
objs += [D(f'cab_towns_map_{i}', 5 + i, 1, f'cab_towns_map_{i}') for i in range(3)]
objs += [D('cab_chute_pipe', 8, 1, 'cab_chute_pipe'), D('cab_out_slot', 9, 1, 'cab_out_slot'), D('cab_clock', 11, 1, 'pa_clock_round')]
# the floor: the charter case, records, the flag, the gallery and its ends, the sideboard, the minutes desk, the tall clock
objs += [P('cab_charter', 2, 2, 'cab_charter_case', name="the Keepers' charter"), P('cab_records', 1, 6, 'pc_records', name='records'),
         P('cab_flag_w', 1, 8, 'pc_flag_stand', name='a flag'), P('cab_plant', 12, 2, 'pv_fern', name='a fern'),
         P('cab_ballot', 12, 8, 'pc_ballot_box', name='a ballot box'), P('cab_clock_tall', 12, 10, 'pn_clock_tall', name='a tall clock'),
         P('cab_sideboard_0', 5, 10, 'cab_sideboard_0', name='a sideboard'), P('cab_sideboard_1', 6, 10, 'cab_sideboard_1', name='a sideboard'),
         P('cab_minutes_desk_0', 9, 10, 'pc_clerk_desk_0', name='the minutes desk'), P('cab_minutes_desk_1', 10, 10, 'pc_clerk_desk_1', name='the minutes desk')]
objs += [P(f'cab_rail_{y}', 11, y, 'pc_rail', name='the gallery rail') for y in (3, 4, 6, 7, 8)]
objs.append(D('cab_rail_gate', 11, 5, 'pc_rail_gate'))
objs += [P(f'cab_gallery_{y}', 12, y, 'cab_gallery_chair', name='a gallery chair') for y in (3, 4, 6, 7)]
# the table (x 5-7, y 3-7); slice 13 is the twelfth place, set: its tap reads the twelfth chair's plate (L2)
for i in range(15):
    x, y = 5 + i % 3, 3 + i // 3
    kw = {'name': 'the twelfth place', 'lines': {'else': TXT['cab_plate']}} if i == 13 else {'name': 'the cabinet table'}
    objs.append(P(f'cab_table_{i}', x, y, f'cab_table_{i}', **kw))
CAB_SEATS = {1: (6, 2), 2: (4, 3), 3: (8, 3), 4: (4, 4), 5: (8, 4), 6: (4, 5), 7: (8, 5), 8: (4, 6), 9: (8, 6), 10: (4, 7), 11: (8, 7), 12: (6, 8)}
for n, (x, y) in CAB_SEATS.items():
    if n == 1: objs.append(P('cab_chair_1', x, y, 'cab_chair_head', name="the Governor's chair"))
    elif n == 12: objs.append(D('cab_chair_12', x, y, 'cab_chair_up'))
    else: objs.append(P(f'cab_chair_{n}', x, y, 'cab_chair_r_new' if n == 4 else 'cab_chair_r' if x == 4 else 'cab_chair_l', name='a cabinet chair'))
# S1 (§4.5, v0.1 settled): K2a sets story.pres_cabinet_first and plays on entering; K2a waits on the parade (#296), so S1 is built
# behind its flag. The holder walks the runner to the twelfth chair (10 steps, D1985) and S1 plays there. Flags are written at the
# end of a pick (the packet's "each pick sets"), so "Not yet" and an interrupted sitting write nothing and replay.
PRES = 'The President'
def s1_pick(line, pick):
    return [['say', PRES, line], ['say', GM, TXT['s1_4']], ['setFlag', 'story.cab_seat', True],
            ['setFlag', 'story.km_seat_pick', pick], ['setFlag', 'story.km_seat_filled', True]]
SC['cab_s1'] = [
    ['choice', TXT['s1_ask'], [
        [TXT['s1_town'], s1_pick(TXT['s1_3a'], 'town'), None, 'story.km_names>=3'],
        [TXT['s1_cmdr'], s1_pick(TXT['s1_3b'], 'commander')],
        [TXT['s1_co'], s1_pick(TXT['s1_3c'], 'company')],
        [TXT['s1_wait'], [['say', GM, TXT['s1_3d']]], None, 'story.km_names<3'],
    ], GM],
]
objs.append({'kind': 'trigger', 'id': 'cab_seat12', 'x': 6, 'y': 8, 'r': 0, 'when': SIT1, 'scene': 'cab_s1'})
# the sitting's bodies (S1): the Governor at the head, Captain Lumen in the Keepers' chair, the President at the Governor's shoulder
# (K2a's staging, behind its flag). Lighter C's three company bodies (seats 3, 4, 9) are phase 1c.
objs += [N('cab_governor', GM, 'hc_governor', 6, 2, 'down', when=SIT1), N('cab_lumen', LUMEN, 'captain', 4, 3, 'right', when=SIT1),
         N('cab_president', PRES, 'hc_president', 7, 2, 'down', when=SIT1)]
objs.append(N('hc_gov2_keeper', 'Keeper', 'officer', 2, 10, 'down', lines={GOV3: 'Go on up, holder.', 'else': TXT['gov_stair']}))
ROOMS['hc_gov_2'] = room('hc_gov_2', "Governor's House", 'hc_gov', 'hc_civic', g, 'hc_gov_2', objs, (1, 3), wall={'windows': [10, 12]})

# hc_gov_3, the President's rooms, 12x14 (§7.3 floor 3). No Summit staging here (X7).
g = ['#' * 12, '#' + 'W' * 10 + '#'] + ['#' + '.' * 10 + '#' for _ in range(6)] + ['#.=======..#'] + ['#' + '.' * 10 + '#' for _ in range(4)] + ['#' * 12]
objs = [{'kind': 'warp', 'id': 'hc_gov_down', 'x': 1, 'y': 12, 'to': 'hc_gov_2', 'tx': 1, 'ty': 9, 'facing': 'up'},   # CABINET 1b: via floor 2
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
objs.append(N('hc_president', 'The President', 'president', 7, 2, 'down', scene='hc2_chambers', lines={'else': TXT['hb13_president']}))
objs.append(N('hc_aide', 'Aide', 'hc_aide', 2, 11, 'down', lines={'else': TXT['hb13_aide']}))
objs.append(N('hc_clerk3', 'Clerk', 'clerk', 9, 7, 'left'))
objs.append(N('hc_commander3', 'Commander', 'captain', 1, 11, 'down', lines={'else': TXT['hb13_commander']}))
ROOMS['hc_gov_3'] = room('hc_gov_3', "Governor's House", 'hc_gov', 'hc_civic', g, 'hc_gov_3', objs, (2, 12))

# hc_museum_in, the Muster Road Museum, 14x16 (WAR_MUSEUM v0.1.1 §3-§5, §7; I1 Loop Gallery). Rule 9: Vincent approved the
# previews (Thu Nov 5, 2026, D2301), so it is built as previewed: the placement is §5.2's, cell for cell. One room split down a
# seam: the city's Long Watch on oak parquet (x 1-7, `.`), Glimmerwell's Bright Years Wing on pale stone (x 8-12, `,`), the sand
# runner from the mat up the seam to the empty case (`:` and `;`, x 6-7, rows 5-14), the kids' rug (`~`, x 1-4, rows 12-14).
# The wall face (row 1) is dressed in every cell; its exhibits are `none` signs on the wall cells, tapped from row 2. Wall pieces
# with no exhibit (the Glimmerwell banner, the clock) are decals only, and the K1 shelf at 1,1 is tapped at 6,1 (a fern stands
# below 1,1). Prop library v0.2 has landed, so the three spots the packet marks "in v0.2 if it lands" take those pieces (§5.2):
# pu_lantern_shelf for A-W1, pf_front_counter_civic for the desk, pt_station for the clock. Every exhibit is a tap (label, then
# what the tap adds, keyed on the story's own flags, §3.2); the Act 4 lines wait for story.hc_trial_called (§3.3).
if HC_MUSEUM:
    CUR_ = 'Curator Edda Lorne'; DOC_ = 'Associate Tansy'; REG_ = 'Bench regular'
    def wm_row(y):
        out = ''
        for x in range(1, 13):
            if x in (6, 7) and 5 <= y <= 14: out += ':' if x == 6 else ';'
            elif x <= 4 and 12 <= y <= 14: out += '~'
            else: out += ',' if x >= 8 else '.'
        return '#' + out + '#'
    g = ['#' * 14, '#' + 'W' * 12 + '#'] + [wm_row(y) for y in range(2, 15)] + ['#######m######']
    # The Stamp Trail (§2.1, D2307): the curator's card (story.wm_card) is the accept, by talk; five stamps, each once, in any
    # order (story.wm_st_<case> beside the packet's count story.wm_trail); the empty case is the snag and its choice
    # (story.wm_trail_pick, read only by her later greeting); the fifth stamp, wherever it lands, pays once (story.wm_trail_done).
    REWARD = [['give', 'old_oil_lamp', 1], ['say', '', TXT['wm_got_lamp']], ['acorns', 50], ['say', '', TXT['wm_journal']],
              ['setFlag', 'story.wm_trail_done', True]]
    def stamp(key, before=()):
        return ['if', f'story.wm_card & !story.wm_st_{key}', list(before) + [
            ['setFlag', f'story.wm_st_{key}', True], ['inc', 'story.wm_trail', 1], ['sfx', 'tap'], ['toast', TXT['wm_stamped']],
            ['if', 'story.wm_trail>=5 & !story.wm_trail_done', REWARD, []]], []]
    def lit_by(pick): return ['if', f'story.wm_plaque={pick}', [['say', '', TXT['wm_lit_by']]], []]   # §2.2: the plaque's plate
    def say_(*keys): return [['say', '', TXT[k]] for k in keys]
    def when_(c, keys, other=()): return ['if', c, say_(*keys), say_(*other)]
    SNAG = ['choice', TXT['wm_snag'], [[TXT['wm_pick_' + k], [['say', CUR_, TXT['wm_res_' + k]], ['setFlag', 'story.wm_trail_pick', k]]]
                                       for k in ('lantern', 'name', 'empty')], CUR_]
    SC.update({
        'wm_k1': say_('k1_label', 'k1_tap') + [['if', 'partner:out', say_('k1_pet'), []], lit_by('lanterns'), stamp('lanterns')],
        'wm_k2': say_('k2_label') + [when_('story.wb_cut', ['k2_after'], ['k2_tap'])],
        'wm_k3': say_('k3_label', 'k3_tap'),
        'wm_k4a': say_('k4_label') + [when_('story.plates_read>=1', ['k4_tap'])],
        'wm_k4b': say_('k4_label') + [when_('story.plates_read>=5', ['k4_tap']), ['say', '', TXT['k4_eighth']]],
        'wm_k5': say_('k5_label') + [when_('story.hc_trial_called', ['k5_card_after'], ['k5_card'])] + say_('k5_tap') + [stamp('case', [SNAG])],
        'wm_k6': say_('k6_label', 'k6_tap') + [when_('story.hc_trial_called', ['k6_after']), stamp('map')],
        'wm_k6_tally': say_('k6_tally'),
        'wm_k7': say_('k7_label', 'k7_tap') + [when_('story.wb_cut', ['k7_cut']), when_('story.hc_trial_called', ['k7_after'])],
        'wm_k8': say_('k8_label', 'k8_tap'),
        'wm_k9': say_('k9_label', 'k9_tap', 'k9_regular') + [lit_by('letters')],
        'wm_k10': say_('k10_label', 'k10_tap') + [stamp('scout')],
        'wm_k11': say_('k11_tap') + [when_('story.hc_parade_seen', ['k11_parade']), when_('story.hc_trial_called', ['k11_after']),
                                     lit_by('drum'), stamp('drum')],
        'wm_k11_labels': say_('k11_brass', 'k11_new'),
        'wm_k12': say_('k12_label', 'k12_tap'),
        'wm_w1': say_('w1_label', 'w1_tap'),
        'wm_w2': say_('w2_label', 'w2_tap'),
        'wm_w3': say_('w3_label') + [['choice', TXT['w3_s1'], [
            [TXT['w3_next'], [['choice', TXT['w3_s2'], [[TXT['w3_next'], say_('w3_s3')], [TXT['w3_leave'], []]], '']]],
            [TXT['w3_leave'], []]], '']],
        'wm_runner': [['say', '', TXT['wm_runner']], ['setFlag', 'story.wm_runner', True]],
    })
    # The donation lantern (§2.2, D2308): 10 or 50 from the bag through the bank's moneyDelta (BANK_AND_HOMES, #334), one ledger line
    # with the memo "Museum gift" (`pay`'s ref museum_gift; bank.js SCENE_MEMO). story.wm_given counts; the Friends board shows the
    # holder's name from 100; at 500 the curator offers the plaque (story.wm_plaque). The lantern glows for a beat (`glow`; reduced
    # motion lights it without the pulse).
    PLAQUE = ['choice', TXT['wm_plaque_ask'], [[TXT['wm_plaque_l'], [['setFlag', 'story.wm_plaque', 'lanterns']]],
                                               [TXT['wm_plaque_d'], [['setFlag', 'story.wm_plaque', 'drum']]],
                                               [TXT['wm_plaque_t'], [['setFlag', 'story.wm_plaque', 'letters']]]], CUR_]
    def gift(n):
        return ['pay', n, [
            ['if', 'story.wm_given<100', [['inc', 'story.wm_given', n], ['if', 'story.wm_given>=100', [['toast', TXT['wm_friends_toast']]], []]],
             [['inc', 'story.wm_given', n]]],
            ['glow', 'wm_donation'], ['sfx', 'rest'],
            ['if', 'story.wm_given>=500 & !story.wm_plaque', [PLAQUE], []]], say_('wm_short'), 'museum_gift']
    SC['wm_give'] = [['choice', TXT['wm_give'], [[TXT['wm_give_10'], [gift(10)]], [TXT['wm_give_50'], [gift(50)]], [TXT['wm_give_no'], []]], '']]
    SC['wm_plaque'] = [PLAQUE]
    # The people (§7). Lines are keyed on the story's flags; plain repeats turn by this visit's talks (`talked:` marks, never saved).
    SC['wm_cur_hello'] = [['say', CUR_, TXT['wm_cur_hello']], ['say', CUR_, TXT['wm_hook']], ['say', '', TXT['wm_ask']],
                          ['setFlag', 'story.wm_card', True]]
    SC['wm_cur_talk'] = [['if', 'story.plates_read>=1 & !talked:wm_cur_p', [['say', CUR_, TXT['wm_cur_plates']], ['mark', 'wm_cur_p']], [
                          ['if', '!talked:wm_cur_w', [['say', CUR_, TXT['wm_cur_wing']], ['mark', 'wm_cur_w']], [
                           ['if', '!talked:wm_cur_s', [['say', CUR_, TXT['wm_cur_stone']], ['mark', 'wm_cur_s']], [
                            ['say', CUR_, TXT['wm_cur_case']]]]]]]]]
    SC['wm_doc_talk'] = [['if', '!talked:wm_doc_h', [['say', DOC_, TXT['wm_doc_hello']], ['mark', 'wm_doc_h']], [
                          ['if', 'talked:wm_drum & !talked:wm_doc_d', [['say', DOC_, TXT['wm_doc_drum']], ['mark', 'wm_doc_d']], [
                           ['say', DOC_, TXT['wm_doc_any']]]]]]]
    SC['wm_eld_talk'] = [['if', 'story.hc_trial_called & !talked:wm_eld_l', [['say', REG_, TXT['wm_eld_late']], ['mark', 'wm_eld_l']], [
                          ['if', '!talked:wm_eld_a', [['say', REG_, TXT['wm_eld_a']], ['mark', 'wm_eld_a']], [['say', REG_, TXT['wm_eld_b']]]]]]]
    SWITCHER = 'story.switched_a3 | story.side=glimmer'
    ex = lambda sc: {'lines': {'else': '@' + sc}}
    objs = [{'kind': 'warp', 'id': 'hc_museum_in_mat', 'x': 7, 'y': 15, 'to': 'hc_civic', 'tx': 8, 'ty': 45, 'facing': 'down'}]
    # the wall face (row 1), every cell dressed (S2): K1 old lanterns, K2 the notice, K4 the plate frames (filled by the plates
    # packet's count story.plates_read, which nothing sets yet), K3 the chapter, K1 again, W1 (new lanterns, the panel, the photo
    # wall), the sponsor board, the Glimmerwell banner, the clock
    objs += [D('wm_lanterns_old_a', 1, 1, 'pu_lantern_shelf'), D('wm_notice', 2, 1, 'wm_notice')]
    PR = 'story.plates_read'
    for side, x, lo, top in (('a', 3, 0, 4), ('b', 4, 4, 3)):   # frames 1-4, then 5-7 (the eighth frame stays empty, §3.2 K4)
        for k in range(top + 1):                                  # board shows k filled frames
            c = ([f'{PR}>={lo + k}'] if k else []) + ([f'{PR}<{lo + k + 1}'] if k < top else [])
            objs.append(D(f'wm_plates_{side}_{k}', x, 1, f'wm_plates_{k}', when=c))
    objs += [D('wm_chapter', 5, 1, 'wm_chapter'), D('wm_lanterns_old_b', 6, 1, 'pu_lantern_shelf'),
             D('wm_lanterns_new_a', 7, 1, 'wm_lanterns_new'), D('wm_wing_panel', 8, 1, 'wm_wing_panel'), D('wm_photo', 9, 1, 'photo_wall'),
             D('wm_sponsor', 10, 1, 'wm_sponsor'), D('wm_banner_glim', 11, 1, 'pg_banner'), D('wm_clock', 12, 1, 'pt_station')]
    objs += [S_('wm_tap_k2', 2, 1, TXT['k2_label'], 'none', **ex('wm_k2')), S_('wm_tap_k4a', 3, 1, TXT['k4_label'], 'none', **ex('wm_k4a')),
             S_('wm_tap_k4b', 4, 1, TXT['k4_label'], 'none', **ex('wm_k4b')), S_('wm_tap_k3', 5, 1, TXT['k3_label'], 'none', **ex('wm_k3')),
             S_('wm_tap_k1', 6, 1, TXT['k1_label'], 'none', **ex('wm_k1'))]
    objs += [S_(f'wm_tap_w1_{x}', x, 1, TXT['w1_label'], 'none', **ex('wm_w1')) for x in (7, 8, 9)]
    objs.append(S_('wm_tap_sponsor', 10, 1, TXT['wm_sponsor'], 'none'))
    # the floor (§5.2)
    objs += [P('wm_fern_k', 1, 2, 'pv_fern', name='a fern'), P('wm_glim_planter', 12, 2, 'pg_planter', name='a planter'),
             P('wm_sea_lantern', 1, 4, 'wm_road_lantern', name='the road lantern', **ex('wm_k8')),   # K8; id kept from v0.1 (§5.2)
             P('wm_lectern_stone', 2, 4, 'pc_lectern', name="the carters' tally", **ex('wm_k6_tally')),
             P('wm_mapcase_0', 3, 4, 'wm_mapcase_0', name="the Stone's road", **ex('wm_k6')),
             P('wm_mapcase_1', 4, 4, 'wm_mapcase_1', name="the Stone's road", **ex('wm_k6')),
             P('wm_rope_w', 5, 4, 'wm_rope_post', name='a rope post'),
             P('wm_case_empty_0', 6, 4, 'wm_case_empty_0', name='the empty case', **ex('wm_k5')),
             P('wm_case_empty_1', 7, 4, 'wm_case_empty_1', name='the empty case', **ex('wm_k5')),
             P('wm_rope_e', 8, 4, 'wm_rope_post', name='a rope post'),
             N('npc_docent', DOC_, 'hc_docent', 11, 4, 'left', lines={SWITCHER: TXT['wm_doc_switch'], 'else': '@wm_doc_talk'}),
             P('wm_glim_case', 10, 6, 'pg_display_case', name='our first lamp', **ex('wm_w2')),
             P('wm_kiosk', 12, 6, 'pg_kiosk', name='the Partnership kiosk', **ex('wm_w3')),
             P('wm_cart_0', 1, 7, 'wm_cart_0', name='the lantern cart', **ex('wm_k7')),
             P('wm_cart_1', 2, 7, 'wm_cart_1', name='the lantern cart', **ex('wm_k7')),
             P('wm_scout_lamp', 4, 7, 'wm_scout_lamp', name="the Scout's lamp", **ex('wm_k10')),
             P('wm_bench_0', 3, 9, 'pq_bench_wood_0', name='a bench'), P('wm_bench_1', 4, 9, 'pq_bench_wood_1', name='a bench'),
             P('wm_drum', 9, 9, 'wm_drum', name='the Picking Day drum', **ex('wm_k11')),
             P('wm_lectern_drum', 10, 9, 'pc_lectern', name="the drum's plates", **ex('wm_k11_labels')),
             P('wm_tree_w', 12, 9, 'pv_potted_tree', name='a potted tree'),
             P('wm_letters', 1, 10, 'wm_letters', name='letters home', **ex('wm_k9')),
             N('npc_elder', REG_, 'hc_bench_regular', 2, 10, 'left', lines={'else': '@wm_eld_talk'}),
             P('wm_easel', 1, 12, 'easel', name='the easel', lines={'else': TXT['k12_easel']}),
             N('npc_curator', CUR_, 'hc_curator', 8, 12, 'down', lines={
                 '!story.wm_card': '@wm_cur_hello', 'story.wm_given>=500 & !story.wm_plaque': '@wm_plaque',
                 'story.wm_trail_done & story.wm_trail_pick=empty': TXT['wm_cur_best'], 'story.hc_trial_called': TXT['wm_cur_seen'],
                 SWITCHER: TXT['wm_cur_switch'], 'else': '@wm_cur_talk'}),
             P('wm_desk_0', 9, 12, 'pf_front_counter_civic_0', name="the curator's desk"),
             P('wm_desk_1', 10, 12, 'pf_front_counter_civic_1', name="the curator's desk"),
             P('wm_records', 11, 12, 'pc_records', name='records'),
             P('wm_friends', 12, 12, 'wm_friends', name='the Friends board',
               lines={'story.wm_given>=100': TXT['k13_friends_named'], 'else': TXT['k13_friends']}),
             P('wm_stamp_table', 3, 13, 'wm_stamp_table', name='the stamp table', **ex('wm_k12')),
             P('wm_stool_b', 4, 13, 'wm_stool', name='a stool'),
             P('wm_cubbies', 1, 14, 'walkling_cubbies', name='cubbies'),
             P('wm_stool_a', 3, 14, 'wm_stool', name='a stool'),
             P('wm_donation', 11, 14, 'wm_donation', name='the donation lantern', **ex('wm_give')),
             P('wm_flag', 12, 14, 'pc_flag_stand', name='a flag')]
    # §5.2's runner tap (7,6) is a walk-on line, once (story.wm_runner), on both runner cells of row 6: a sign there would be an
    # unseen wall in the middle of the two-wide runner.
    objs += [{'kind': 'trigger', 'id': f'wm_runner_{x}', 'x': x, 'y': 6, 'r': 0, 'when': ['!story.wm_runner'], 'scene': 'wm_runner'} for x in (6, 7)]
    ROOMS['hc_museum_in'] = room('hc_museum_in', 'Muster Road Museum', 'hc_museum', 'hc_civic', g, 'hc_museum_in', objs, (7, 14))

# AGENTS rule 9 (room redesigns): a room is built here only after Vincent has seen its 390 previews and said yes. The phase 1
# rooms above were approved on Tue Nov 3, 2026 (handoff/maps/HC_CITY_V2.md, "Sign-off"). These v0.4 rooms are specced but have
# no approved preview (and need the rule 9 inspiration pass first), so they are held: never built, listed in the output.
# hc_gov_2, the Cabinet Room, left this list when Vincent approved its previews (Wed Nov 4, 2026; CABINET_AND_COUNCILS 1b, above).
RULE9_HELD = {
    'hc_lantern_up': 'grand Lantern House gallery (layout §7.1): grid in §7.1, no preview',
    'hc_college_in': 'College Great Hall (layout §7.4): no grid, no preview',
    'hc_trial_in': 'the Muster Hall, Hall 8 (layout §7.5; also waits on the Hall 8 build and HC_TRIAL_HALL): blockout only',
    'hc_trial_stone': 'the Hall Stone room (layout §7.5, phase 3): blockout only',
    'hc_library_in': 'College Library (layout §7.4, phase 3): no grid, no preview',
    'hc_gym_in (expansion)': 'the Dojo expansion (layout §7.4, phase 3; D1281 keeps the 9x7 room): no grid, no preview',
}
for rid in RULE9_HELD:
    if rid in ROOMS: fail(f'{rid}: held for rule 9 previews, but built')

TARGETS = {
    'hc_lantern_in': ((8, 20), {'mat': (8, 21), 'ines': (7, 15), **{f'bed{i}': (x + 1, y) for i, (x, y) in enumerate(beds)}}),
    'hc_news_1': ((7, 14), {'mat': (7, 15), 'stair': (12, 12), 'editor': (7, 8), 'spike': (11, 8)}),
    'hc_news_2': ((11, 12), {'stair': (12, 12), 'reader': (1, 7), 'tray': (6, 8)}),
    'hc_gov_1': ((7, 14), {'mat': (7, 15), 'stair': (1, 2), 'governor_front': (12, 5), 'lumen_front': (4, 4)}),
    'hc_gov_2': ((1, 3), {'stair_down': (1, 2), 'stair_up': (1, 10), 'arrive_up': (1, 9), 'seat12': (6, 8), 'governor_side': (5, 2),
                          'charter_front': (2, 3), 'gallery': (12, 5), 'board_front': (4, 2), 'keeper_front': (2, 9)}),
    'hc_gov_3': ((2, 12), {'stair': (1, 12), 'president_front': (7, 4) if False else (5, 4), 'cups': (3, 10), 'stamp': (10, 11)}),
}
if HC_MUSEUM:   # WAR_MUSEUM §5.3: a tap or talk cell for every target, from the arrival (7,14)
    TARGETS['hc_museum_in'] = ((7, 14), {'mat': (7, 15), 'curator': (8, 13), 'donation': (10, 14), 'friends': (12, 13), 'drum': (8, 9),
        'stamp_table': (3, 12), 'easel': (2, 12), 'elder': (3, 10), 'empty_case': (7, 5), 'letters': (1, 11), 'scout': (4, 8),
        'first_lamp': (10, 5), 'cart': (1, 8), 'map_case': (3, 5), 'kiosk': (11, 6), 'docent': (10, 4), 'face_row': (9, 2), 'road_lantern': (1, 5)})
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
def walk_says(steps, sid):   # every say, at any depth (if and choice branches), and every choice label
    for st in steps if isinstance(steps, list) else []:
        if not isinstance(st, list) or not st: continue
        if st[0] == 'say' and len(st[2]) > 110: fail(f'{sid}: say over 110')
        if st[0] == 'choice':
            if len(st[1]) > 110: fail(f'{sid}: choice prompt over 110')
            for opt in st[2]:
                if len(opt[0]) > 30: fail(f'{sid}: choice over 30')
                walk_says(opt[1], sid)
        if st[0] in ('if', 'pay'): walk_says(st[2], sid); walk_says(st[3] if len(st) > 3 else [], sid)   # pay: WAR_MUSEUM's gift
for sid, steps in SC.items():
    walk_text(steps, sid)
    walk_says(steps, sid)
# GOVERNOR_MEETING §5 (D1473): one scene for every holder; the build fails if a Glimmer variant of the meeting ever appears.
for sid in SC:
    if sid.startswith('hc_gov_meet') and sid != 'hc_gov_meet': fail(f'{sid}: no variant of hc_gov_meet (D1543)')

# ---------- the reputation cast (every named body needs an entry; only added while the city is on) ----------
# D1439: the Governor is a civil post, not a Keeper; the cast has no civil value, so he takes 'none' (as civilians do)
KEEPER_NAMES = {'Duty Keeper', 'Keeper', 'Keeper reader', 'The President', 'Aide', 'Commander', 'Clerk', 'Captain Lumen'}
names = sorted({o['name'] for c in CHUNKS.values() for o in c.objs if o['kind'] == 'npc'} |
               {o['name'] for r in ROOMS.values() for o in r['objs'] if o['kind'] == 'npc'})
GLIMMER_NAMES = {'Associate Tansy': {'rank': 'Associate', 'given': 'Tansy'}}   # WAR_MUSEUM §7.2: the Wing's company docent
CAST = [dict({'name': n, 'faction': 'keepers' if n in KEEPER_NAMES else 'glimmer' if n in GLIMMER_NAMES else 'none', 'base': 50},
             **({'label': SCHED_LABEL[n]} if n in SCHED_LABEL else {}), **GLIMMER_NAMES.get(n, {}))
        for n in names]
CAST += [r for r in PARADE['castRows'] if r['name'] not in names]   # HC_PARADE's generic labels (D1361)
for e in CAST:   # NPC_RANKS: a Keeper cast entry needs a rank, a pending proposal or a flag; the city's ranks are Story's to set
    if e['faction'] == 'keepers': e['rankFlag'] = 'D1374: city cast, ranks PLACEHOLDER until Story'

# WAR_MUSEUM §8: every museum flag is a new story.* key on S.flags (save pixelpets.save.v2, v 2, additive; nothing is written at
# load). story.wm_trail_done is the Stamp Trail's side-chain step (quests.js); the rest are results and counters, never steps.
WM_NOT_STEPS = ['story.wm_visited', 'story.wm_card', 'story.wm_trail', 'story.wm_trail_pick', 'story.wm_given', 'story.wm_plaque',
                'story.wm_runner', 'story.wm_st_lanterns', 'story.wm_st_map', 'story.wm_st_scout', 'story.wm_st_drum', 'story.wm_st_case']

# ---------- write ----------
for k, v in room_keep.items(): keep[k] = v
lines_patch = {}
for rid, r in ROOMS.items():
    for oid, ln in r.pop('_lines', {}).items(): lines_patch[oid] = ln
# KEEPER_ANTHEM v0.2.1 §8a.3 M11 (D1420, D1423): the anthem's two rooms. game.js applyHcCity() reads `roomPatch` (M10): the room
# loop becomes anthem_hall and one framed-sheet sign names the anthem (D1419). City only: data/highcharity.json keeps `charity`.
ANTHEM_SHEET = '[PLACEHOLDER] A framed sheet of music: EVERY ROOF A LANTERN. The Keeper anthem.'
room_patch = {
    'hc_command_in': {'music': 'anthem_hall', 'add': [{'kind': 'sign', 'id': 'hc_anthem_sheet_c', 'x': 4, 'y': 2, 'text': ANTHEM_SHEET}]},
    'hc_barracks_in': {'music': 'anthem_hall', 'add': [{'kind': 'sign', 'id': 'hc_anthem_sheet_b', 'x': 4, 'y': 2, 'text': ANTHEM_SHEET}]},
}
for rid, p in room_patch.items():
    r = OLD['rooms'].get(rid)
    if not r: fail(f'roomPatch: no room {rid} in data/highcharity.json'); continue
    for o in p['add']:
        if not (0 < o['x'] < r['w'] - 1 and 0 < o['y'] < r['h'] - 1): fail(f'roomPatch: {o["id"]} off the room floor')
        if any(q['x'] == o['x'] and q['y'] == o['y'] and q['kind'] != 'trigger' for q in r['objs']): fail(f'roomPatch: {o["id"]} tile taken in {rid}')
        if len(o['text']) > 110: fail(f'roomPatch: {o["id"]} text over 110 characters')
MAPS = {}
for cid, c in CHUNKS.items():
    MAPS[cid] = {'name': 'High Charity', 'district': DISTRICT[cid], 'backdrop': 'town', 'music': 'charity', 'w': c.w, 'h': c.h,
                 'spawns': None, 'respawn': None, 'respawnIn': {'map': 'hc_lantern_in', 'x': 8, 'y': 19, 'facing': 'up'},
                 'safe': {'x': c.arrival[0], 'y': c.arrival[1]}, 'zones': [], 'variants': True, 'roofs': roofs[cid],
                 'grid': c.grid, 'objs': c.objs,
                 'hcSlots': [h for h in c.src['hooks']]}
out = {
    'spec': 'HIGH_CHARITY_LAYOUT v0.4.2 (design specs/HIGH_CHARITY_LAYOUT.md); built by tools/build_hc_city.py',
    'rule9Held': RULE9_HELD,
    'paradeStands': {cid: [list(p) for p in sorted(set(cells))] for cid, cells in PARADE_STANDS.items()},
    '_about': 'City preview data. Not in MAPDATA. Merged into WORLD only while HC_CITY_V2 or ?debug=1&hccity=2 is on. '
              'All player text is PLACEHOLDER until Story signs it (layout §11). Art keys hc_* are PLACEHOLDER (HC_PLACEHOLDER_ART).',
    'tiles': {'C': {'name': 'carriageway', 'walk': True}, 'Z': {'name': 'crosswalk', 'walk': True},
              'U': {'name': 'kerb bay', 'walk': False}, 'M': {'name': 'median', 'walk': False}},
    'maps': MAPS,
    'rooms': ROOMS,
    'keep': keep,
    'roomPatch': room_patch,
    'matMoves': mat_moves,
    'linesPatch': lines_patch,
    'art': PARADE_ART,
    'scenes': SC,
    'looks': LOOKS,
    'speakers': SPEAKERS,
    'cast': CAST,
    'castAt': PARADE['castAt'],
    'notStepFlags': ['story.hc_noon', 'story.hc_board', 'story.hc_mural', 'story.hc_lampstock', 'story.hc_gran', 'story.hc_news',
                     'story.hc_wall', 'story.hc_chute', 'story.hc_chambers', 'story.hc_gov_met', 'story.hc_trial_called',
                     'story.gov_told', 'story.cab_seat', 'story.km_seat_filled'] + PARADE['notStepFlags']
                    + (WM_NOT_STEPS if HC_MUSEUM else []),   # + CABINET §6 (1b)   # GOVERNOR_MEETING §6.2; story.km_assigned is the gov_meet chain step
}
for n in notes: print('note:', n)
if fails:
    print('FAIL'); [print(' -', f) for f in fails]; sys.exit(1)
txt = json.dumps(out, ensure_ascii=False, indent=1)
txt = re.sub(r'\n\s+("[^"]*",?|\d+,?|true,?|false,?|null,?)(?=\n)', r' \1', txt)   # compact short scalars
open(OUT, 'w').write(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT)} bytes)')
print('build_hc_city: PASS')
