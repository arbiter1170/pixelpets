"""HC_PARADE v0.2 (design specs/HC_PARADE.md, D1353-D1369, all settled Tue Nov 3, 2026): the beat sheet and its compiler.

Called by tools/build_hc_city.py after the five chunks are dressed. Everything here lands in data/hc_city_v2.json (the city
preview data, window.PP_HC_V2), so it exists only while the city is on (HC_CITY_V2 or ?debug=1&hccity=2); normal play is
untouched. The beat table (BEATS) is the source for the scenes and for the handoff table in handoff/maps/HC_PARADE.md.

Scenes:  hc_parade      Part 1 on Lantern Square (the parade), then the warp, then `run hc_parade_hill`.
         hc_parade_hill Part 2 (the speech) and Part 3 (three street battles) on Charter Hill. Standalone, so E10 can replay it.
Flags:   story.hc_parade_square (1.8, saved by the warp), story.hc_sf_1..3 (each street battle won), story.hc_parade_seen and
         story.hc_greeted (the end). All CHAIN rows (D1365); save v2, no new field.
Words:   every line is PLACEHOLDER until Story signs it (the packet's §4 lines verbatim). Speaker "The President" (D1366).
Sound:   the anthem cues (KEEPER_ANTHEM, D1357) are not built: the `music` steps name them and play nothing (an unknown id is a
         no-op), so the city's own loop keeps playing. The grey-box hum (D1371) is not built either. No new sound.
"""

# ---------- cast (castAt entries: people use a look, props a sprite) ----------
OFFICER = 'officer'
CIV_LOOKS = {   # PLACEHOLDER townsfolk looks from the look kit (existing parts only). The supporters' vests are
#   Glimmerwell's locked set (AGENTS rule 11): wine `V`, soot `N` trim, no crimson (owner, Tue Nov 3, 2026: mint no longer fits)
    'hc_pr_civ_1': {'skin': '2', 'hair': 'short', 'hairCol': 'o', 'outfit': 'coat', 'outfitCol': 'b', 'accent': 'w'},
    'hc_pr_civ_2': {'skin': '4', 'hair': 'bob', 'hairCol': 'd', 'outfit': 'cardigan', 'outfitCol': 'o', 'accent': 'y'},   # not red: reads apart from the wine vests
    'hc_pr_civ_3': {'skin': '1', 'hair': 'curls', 'hairCol': 'y', 'outfit': 'sweater', 'outfitCol': 'm', 'accent': 'w'},
    'hc_pr_civ_4': {'skin': '5', 'hair': 'buzz', 'hairCol': 'k', 'outfit': 'jacket', 'outfitCol': 'n', 'accent': 'o'},
    'hc_pr_civ_5': {'skin': '3', 'hair': 'bun', 'hairCol': 'p', 'outfit': 'raincoat', 'outfitCol': 'y', 'accent': 'w'},
    'hc_pr_civ_6': {'skin': '6', 'hair': 'long', 'hairCol': 'd', 'outfit': 'tunic', 'outfitCol': 'p', 'accent': 'y'},
    'hc_pr_mv_1': {'skin': '2', 'hair': 'pony', 'hairCol': 'F', 'outfit': 'vest', 'outfitCol': 'V', 'accent': 'N'},
    'hc_pr_mv_2': {'skin': '5', 'hair': 'short', 'hairCol': 'd', 'outfit': 'vest', 'outfitCol': 'V', 'accent': 'N'},
    'hc_pr_mv_3': {'skin': '3', 'hair': 'curls', 'hairCol': 'k', 'outfit': 'vest', 'outfitCol': 'V', 'accent': 'N'},
    'hc_pr_mv_4': {'skin': '1', 'hair': 'bob', 'hairCol': 'y', 'outfit': 'vest', 'outfitCol': 'V', 'accent': 'N'},
    'hc_pr_mv_5': {'skin': '4', 'hair': 'spiky', 'hairCol': 'o', 'outfit': 'vest', 'outfitCol': 'V', 'accent': 'N'},
    'hc_pr_mv_6': {'skin': '6', 'hair': 'bun', 'hairCol': 'h', 'outfit': 'vest', 'outfitCol': 'V', 'accent': 'N'},
}
# Generic labels (D1361: no new names). Officer A / Officer B are the packet's FRIEND SLOT placeholders.
N_OFF_A, N_OFF_B, N_GUARD, N_SUPP, N_CIV, N_KEEPER = 'Officer A', 'Officer B', 'Keeper Guard', 'Glimmerwell supporter', 'Citizen', 'Keeper'
CAST = {
    '_note': 'HC_PARADE casts (city only). People use a look; props a sprite. Officers, guards and marchers wear the built '
             'Keeper officer look (rule 11). Names are generic labels or FRIEND SLOT placeholders (D1361).',
    'pr_off_a': {'name': N_OFF_A, 'look': OFFICER}, 'pr_off_b': {'name': N_OFF_B, 'look': OFFICER},
    # ROTOR_CRAFT §6 (D1392): altitude 24 for the fly-by, 36 for the hover; the lead's beam (tank_beam_r) one tile ahead of it;
    # the Court hover faces the crowd, its down-beam on its cell, both in the air pass (D1391: the shadow after the people).
    'pr_rotor_a': {'sprite': 'keeper_rotor_r', 'fly': True, 'shadow': 'rotor_shadow', 'alt': 24},
    'pr_rotor_b': {'sprite': 'keeper_rotor_r', 'fly': True, 'shadow': 'rotor_shadow', 'alt': 24},
    'pr_beam_a': {'sprite': 'tank_beam_r', 'fly': True, 'alt': 0},
    'pr_rotor_h': {'sprite': 'keeper_rotor_front', 'fly': True, 'shadow': 'rotor_shadow_front', 'alt': 36},
    'pr_court_beam': {'sprite': 'rotor_beam_down', 'fly': True, 'alt': 0},
    'pr_tank_a': {'sprite': 'keeper_tank_r'}, 'pr_tank_b': {'sprite': 'keeper_tank_cmd_r'},
    'pr_tank_w': {'sprite': 'keeper_tank_r'}, 'pr_tank_e': {'sprite': 'keeper_tank_l'},
    'pr_car': {'sprite': 'hc_pcar_r'}, 'pr_car2': {'sprite': 'hc_pcar_l'},
    'pr_pres': {'sprite': 'hc_president'},
}
for i in range(1, 9): CAST[f'pr_march_{i}'] = {'name': N_KEEPER, 'look': OFFICER}
for i in range(1, 5): CAST[f'pr_guard_{i}'] = {'name': N_GUARD, 'look': OFFICER}   # the car's close guards (Parts 1 and 2)
for i in range(1, 5): CAST[f'pr_line_{i}'] = {'name': N_GUARD, 'look': OFFICER}    # the guard line at the foot of the steps
for i in range(1, 9): CAST[f'pr_cordon_{i}'] = {'sprite': 'lantern_cordon'}
for i, v in enumerate('abc' * 12, 1): CAST[f'pr_strip_{i}'] = {'sprite': 'hc_crowd_' + v}

# ---------- Part 1: Lantern Square (map highcharity) ----------
GATE = (32, 36)
SPOT = {'keepers': (21, 23), 'glimmer': (21, 24)}                   # 1.3: the front of the crowd / behind it
P1_CROWD = {   # 1.4: seven civilians on the south sidewalk (row 23); plain looks only on the Square
    'keepers': [(17, 23), (18, 23), (19, 23), (20, 23), (22, 23), (23, 23), (24, 23)],
    'glimmer': [(18, 23), (19, 23), (20, 23), (21, 23), (22, 23), (23, 23), (24, 23)],
}
P1_CIV = [f'pr_c1_{i}' for i in range(1, 8)]
for i, cid in enumerate(P1_CIV): CAST[cid] = {'name': N_CIV, 'look': f'hc_pr_civ_{i % 6 + 1}'}
P1_CORDON = [(17, 22), (19, 22), (21, 22), (23, 22), (25, 22)]       # lantern cordon in the kerb bays in front of the crowd
X0, X1 = 6, 36                                                      # a wave enters off the view's west edge and drops past its east edge
MARCH_MS, TANK_MS, CAR_MS, FLY_MS = 160, 280, 240, 100

def cast(i, x, y, f='down'): return ['castAt', i, x, y, f]
def walk(i, x, y, **o): return ['walkTo', i, x, y, o] if o else ['walkTo', i, x, y]

def wave_march(x0=X0):
    st = [cast(f'pr_march_{k + 1}', x0 - k // 2, 20 + k % 2, 'right') for k in range(8)]
    st.append(['walkAll', [[f'pr_march_{k + 1}', x0 - k // 2 + (X1 - X0), 20 + k % 2, {'ms': MARCH_MS, 'line': True, 'drop': True}] for k in range(8)]])
    return st

def part1_tail(sd):
    """1.3-1.8 for one side (sd): the escort, the crowd, the waves, the car, the curtain and the warp."""
    sx, sy = SPOT[sd]
    S = [cast(c, x, y, 'up') for c, (x, y) in zip(P1_CIV, P1_CROWD[sd])]                                     # 1.4
    S += [['castAt', f'pr_cordon_{k + 1}', x, y, 'down'] for k, (x, y) in enumerate(P1_CORDON)]
    S += [['walkAll', [['player', sx, sy, {'with': 'pr_off_a'}], ['pr_off_b', sx + 2, 24 if sd == 'keepers' else 25]]]]   # 1.3
    # 1.5 the waves
    S += [cast('pr_beam_a', X0 - 1, 23, 'right'), cast('pr_rotor_a', X0 - 2, 23, 'right'),                    # wave 1 (ROTOR_CRAFT §6.1):
          cast('pr_rotor_b', X0 - 5, 22, 'right'),                                                              # A over the crowd row with
          ['walkAll', [['pr_beam_a', X1 + 7, 23, {'ms': FLY_MS, 'line': True, 'drop': True, 'with': 'pr_rotor_a'}],   # its beam, B three behind
                       ['pr_rotor_b', X1 + 3, 22, {'ms': FLY_MS, 'line': True, 'drop': True}]]]]                       # and a row north
    S += wave_march()                                                                                           # wave 2
    S += [cast('pr_tank_a', X0, 21, 'right'), cast('pr_tank_b', X0 - 5, 21, 'right'),                           # wave 3 (2 tanks max)
          ['walkAll', [['pr_tank_a', X1, 21, {'ms': TANK_MS, 'line': True, 'drop': True}],
                       ['pr_tank_b', X1 - 5, 21, {'ms': TANK_MS, 'line': True, 'drop': True}]]]]
    S += wave_march()                                                                                           # wave 4
    car_stop = sx                                                                                               # wave 5: the car stops in front of the holder
    S += [cast('pr_car', X0, 20, 'right'), ['camera', 'pr_car'],                                               # owner: follow the car
          cast('pr_guard_1', X0 + 3, 21, 'right'), cast('pr_guard_2', X0 - 2, 21, 'right'),                   # the 64 px car spans x-1.5..x+2.5
          cast('pr_guard_3', X0 + 3, 19, 'right'), cast('pr_guard_4', X0 - 2, 19, 'right'),
          ['walkAll', [['pr_car', car_stop, 20, {'ms': CAR_MS, 'line': True}],
                       ['pr_guard_1', car_stop + 3, 21, {'ms': CAR_MS, 'line': True}], ['pr_guard_2', car_stop - 2, 21, {'ms': CAR_MS, 'line': True}],
                       ['pr_guard_3', car_stop + 3, 19, {'ms': CAR_MS, 'line': True}], ['pr_guard_4', car_stop - 2, 19, {'ms': CAR_MS, 'line': True}]]],
          ['prop', 'pr_car', 'hc_pcar_hand_r'], ['wait', 1200],                                                  # 1.6 one gloved hand at the window
          ['emote', 'pr_off_a', 'emote_hand', 900], ['wait', 300],
          ['emoteAll', P1_CIV, 'emote_clap', 1100], ['wait', 1100],                                              # E8: all at once, stops at once
          ['camera', None],
          ['prop', 'pr_car', 'hc_pcar_r'],
          ['walkAll', [['pr_car', 53, 20, {'ms': CAR_MS, 'line': True}], ['pr_guard_1', 56, 21, {'ms': CAR_MS, 'line': True}],
                       ['pr_guard_2', 51, 21, {'ms': CAR_MS, 'line': True}], ['pr_guard_3', 56, 19, {'ms': CAR_MS, 'line': True}],
                       ['pr_guard_4', 51, 19, {'ms': CAR_MS, 'line': True}]]],
          ['walkAll', [['pr_car', 53, 8, {'ms': CAR_MS, 'line': True, 'drop': True}],                            # 1.7 north up Charter Avenue
                       ['pr_guard_1', 56, 8, {'ms': CAR_MS, 'line': True, 'drop': True}], ['pr_guard_2', 51, 8, {'ms': CAR_MS, 'line': True, 'drop': True}],
                       ['pr_guard_3', 56, 7, {'ms': CAR_MS, 'line': True, 'drop': True}], ['pr_guard_4', 51, 7, {'ms': CAR_MS, 'line': True, 'drop': True}]]]]
    S += [cast('pr_tank_a', X0, 21, 'right'),                                                                   # wave 6: an escort tank, a last column
          ['walkAll', [['pr_tank_a', X1, 21, {'ms': TANK_MS, 'line': True, 'drop': True}]]]]
    S += wave_march(X0 - 2)
    S += [['say', N_OFF_A, 'The President speaks at the Court. Citizens will attend.'],                        # 1.7
          ['walkAll', [[c, x + 12, y, {'line': True, 'drop': True}] for c, (x, y) in zip(P1_CIV, P1_CROWD[sd])]],
          ['curtain', 'on'], ['setFlag', 'story.hc_parade_square', True]]                                        # 1.8
    S += [['warp', 'hc_civic', *HILL_SPOT[sd], 'up'], ['run', 'hc_parade_hill']]
    return S

# ---------- Part 2 and Part 3: Charter Hill (map hc_civic), Muster Road closed, the Court's steps on rows 26-27 (layout v0.3) ----------
HILL_SPOT = {'keepers': (28, 30), 'glimmer': (28, 34)}               # 2.1: the front edge of the crowd / the very back
CIV2 = [(24, 30), (25, 30), (26, 30), (24, 31), (25, 31), (26, 31), (27, 31), (24, 33), (25, 33), (26, 33), (27, 33), (23, 33)]
VEST2 = {1, 5, 6, 8, 10, 11}                                         # six of the twelve wear the vest (the foe pool for six picks)
P2_CIV = [f'pr_c2_{i}' for i in range(1, 13)]
mv = iter(range(1, 7)); cv = iter(range(1, 13))
for i, cid in enumerate(P2_CIV):
    if i in VEST2: CAST[cid] = {'name': N_SUPP, 'look': f'hc_pr_mv_{next(mv)}'}
    else: CAST[cid] = {'name': N_CIV, 'look': f'hc_pr_civ_{(next(cv) - 1) % 6 + 1}'}
P2_VEST = [P2_CIV[i] for i in sorted(VEST2)]
LINE2 = [(29, 28), (30, 28), (34, 28), (35, 28)]                     # 2.2 the guard line, behind the cordon
CORDON2 = [(26, 29), (27, 29), (28, 29), (29, 29), (30, 29), (34, 29), (35, 29), (36, 29)]
STRIPS2 = [(21, 30), (21, 31), (21, 33), (21, 34), (24, 34), (37, 33), (41, 33), (37, 34), (41, 34),
           (25, 36), (29, 36), (33, 36), (37, 36), (45, 33),
           # denser at the Court (relayed from Vincent's preview review): both sidewalks, the far road ends, the back rows
           (21, 28), (17, 28), (41, 28), (45, 28), (17, 30), (17, 31), (17, 33), (17, 34), (21, 36), (41, 36), (45, 36), (45, 34)]
# Once the car has stopped, the crowd closes in on the road behind it (east of the aisle), so the way stays open while it drives.
STRIPS2_LATE = [(38, 30), (42, 30), (46, 30), (38, 31), (42, 31), (46, 31)]
COURT_DOOR, PRES_TOP = (32, 26), (32, 26)   # HIGH_CHARITY_LAYOUT v0.3 (D1354): door 32,26, steps rows 26-27
CLOSE2 = [(30, 26), (31, 26), (33, 26), (34, 26)]                    # 2.4 four close guards around him on the steps
OFF2 = {'pr_off_a': (26, 28), 'pr_off_b': (37, 28)}
CAR_STOP = (32, 31)   # the 64 px car spans 30.5-34.5; its rear door (left-facing) sits at about 33, on the crosswalk

def part2_stage():
    S = [['if', '!story.hc_sf_1', [['music', 'anthem_march', {'keep': True, 'near': True}]], []],   # §6.4: an E10 replay of Part 2 hears the march at full (inside a run from Part 1 it is already playing)
         ['hide', 'people'], ['hide', ['hc2_sign_court']], ['curtain', 'on'],   # the Court's sign (33,26) steps aside for the close guards
         ['if', 'story.side=glimmer', [walk('player', *HILL_SPOT['glimmer'])], [walk('player', *HILL_SPOT['keepers'])]]]   # a resume lands here first
    S += [cast('pr_tank_w', 4, 31, 'right'), cast('pr_tank_e', 60, 31, 'left'),
          cast('pr_rotor_h', 32, 25, 'down'), cast('pr_court_beam', 32, 25, 'down')]                  # ROTOR_CRAFT §6.2: one row behind his step
    S += [['castAt', f'pr_strip_{k + 1}', x, y, 'up'] for k, (x, y) in enumerate(STRIPS2)]
    S += [['castAt', f'pr_cordon_{k + 1}', x, y, 'down'] for k, (x, y) in enumerate(CORDON2)]
    S += [cast(c, x, y, 'up') for c, (x, y) in zip(P2_CIV, CIV2)]
    S += [cast(f'pr_line_{k + 1}', x, y, 'down') for k, (x, y) in enumerate(LINE2)]
    S += [cast(i, x, y, 'down') for i, (x, y) in OFF2.items()]
    return S

def part2_speech():
    S = [['curtain', 'off']]
    # 2.3 a marching column arrives along the road and files into the Court (frees its slots before the car)
    S += [cast(f'pr_march_{k + 1}', 40 + k, 31, 'left') for k in range(4)]
    S += [['walkAll', [[f'pr_march_{k + 1}', *COURT_DOOR, {'ms': 150, 'drop': True}] for k in range(4)]]]
    # 2.4 the car up the aisle, four close guards beside it; a small figure gets out
    S += [cast('pr_car2', 54, 31, 'left'), cast('pr_guard_1', 57, 30, 'left'), cast('pr_guard_2', 52, 30, 'left'),
          cast('pr_guard_3', 57, 32, 'left'), cast('pr_guard_4', 52, 32, 'left'), ['camera', 'pr_car2'],   # owner: the view rides with the car
          ['walkAll', [['pr_car2', *CAR_STOP, {'ms': CAR_MS, 'line': True}],
                       ['pr_guard_1', CAR_STOP[0] + 3, 30, {'ms': CAR_MS, 'line': True}], ['pr_guard_2', CAR_STOP[0] - 2, 30, {'ms': CAR_MS, 'line': True}],
                       ['pr_guard_3', CAR_STOP[0] + 3, 32, {'ms': CAR_MS, 'line': True}], ['pr_guard_4', CAR_STOP[0] - 2, 32, {'ms': CAR_MS, 'line': True}]]],
          *[['castAt', f'pr_strip_{len(STRIPS2) + k + 1}', x, y, 'up'] for k, (x, y) in enumerate(STRIPS2_LATE)],
          ['prop', 'pr_car2', 'hc_pcar_door_l'], cast('pr_pres', 33, 30, 'up'), ['camera', 'pr_pres'], ['wait', 400],   # ...until he is in view
          ['walkAll', [['pr_pres', *PRES_TOP, {'ms': 260}]] + [[f'pr_guard_{k + 1}', x, y, {'ms': 260}] for k, (x, y) in enumerate(CLOSE2)]],
          ['prop', 'pr_car2', 'hc_pcar_l']]
    # 2.5 nobody gets close
    S += [['walkTo', 'pr_c2_7', 27, 30], ['walkTo', 'pr_line_2', 31, 29],
          ['music', 'anthem_dark', {'fadeOut': 900, 'minDelay': 1600, 'fadeIn': 2400}],   # KEEPER_ANTHEM §6.4 (D1379): the march dies, ~0.7 s quiet, the dark cue
          ['say', N_GUARD, 'Citizen. Back.'], ['walkTo', 'pr_c2_7', 27, 31], ['walkTo', 'pr_line_2', 30, 28],
          ['wait', 600]]
    # 2.6 the speech (§4, PLACEHOLDER until Story signs it; D1358). No portrait (D1356).
    for line in SPEECH: S.append(['say', 'The President', line, {'face': False}])
    if True:   # 2.7 the clap on the raised hand
        S += [['emote', 'pr_off_a', 'emote_hand', 900], ['wait', 250], ['emoteAll', P2_CIV, 'emote_clap', 1100], ['wait', 1100]]
    S += [['camera', None], ['walkTo', 'pr_pres', *COURT_DOOR, {'drop': True}]]                                  # he goes back in before the battles (owner); the guards stay
    return S

SPEECH = [
    "Citizens. Glimmerwell has crossed every line we drew. We will not wait for the next one.",
    "From today, the national draft returns. Every able citizen will answer the roll.",
    "Picking Day is closed to civilians. No civilian may pick a Walkling.",
    "Our schools will teach again from the first page. Every lesson will serve the lantern.",
    "Anyone who stands with Glimmerwell in public will be fined or jailed.",
    "And to those who stand with them today: we see you.",
    "Keepers. Into the crowd.",
]
GUARDS2 = [f'pr_line_{k}' for k in range(1, 5)] + [f'pr_guard_{k}' for k in range(1, 5)]
FIGHT = {   # §5 (D1360, D1361): the pools, labels and the PLACEHOLDER team pool per side (Story and Design, open)
    'again': 'Get up. Again.',
    'pools': {
        'keepers': {'ally': GUARDS2, 'foe': P2_VEST, 'allyName': N_GUARD, 'foeName': N_SUPP, 'call': 'Holder. With me.',
                    'team': ['moth/1', 'crab/1', 'vane/0'], 'allyTeam': ['mole/1'],
                    'lines': {'intro': "You won't take this street.", 'win': 'Fine. Fine!', 'lose': 'Not today, Keeper.'}},
        'glimmer': {'ally': P2_VEST, 'foe': GUARDS2, 'allyName': N_SUPP, 'foeName': N_GUARD, 'call': "You're with us? Then stand with me.",
                    'team': ['mole/1', 'beetle/1', 'stone/0'], 'allyTeam': ['moth/1'],
                    'lines': {'intro': 'Citizen. Stand down.', 'win': 'Fall back.', 'lose': 'Stay down, citizen.'}},
    },
    'stage': {'keepers': {'ally': [[1, 0]], 'foe': [[0, 1], [1, 1]]}, 'glimmer': {'ally': [[1, 0]], 'foe': [[0, -1], [1, -1]]}},
}
RESTAGE = '[PLACEHOLDER] Muster Road is still packed. The guards push in again.'
BETWEEN = {'keepers': ['Another one. Left side!', 'Hold the line!'], 'glimmer': ["They're boxing us in!", 'This way!']}

def part3():
    S = []
    for n in (1, 2, 3):
        S.append(['if', 'story.side=glimmer', [['say', N_SUPP, BETWEEN['glimmer'][n - 2]]] if n > 1 else [],
                  [['say', N_GUARD, BETWEEN['keepers'][n - 2]]] if n > 1 else []])
        S.append(['hcFight', n, FIGHT])
    keepers_end = [['walkTo', 'pr_off_a', 27, 30],
                   ['say', N_OFF_A, '[PLACEHOLDER: Officer A thanks the holder and hands off to the next Keeper quest (D1363).]'],
                   ['if', '!story.hc_invite', [['say', N_OFF_A, "The Event Hall booths stay covered until Ilse's letter arrives."]]]]
    glimmer_end = [['say', N_SUPP, 'Not here. Run!'],
                   ['walkTo', 'player', 12, 34, {'line': True}], ['curtain', 'on'],
                   ['warp', 'hc_waterfront', *QUAY_NORTH, 'down'], ['curtain', 'off'],
                   ['say', '', '[PLACEHOLDER: the hook for the next Glimmer quest (D1362).]'],
                   ['if', '!story.hc_invite', [['say', '', "The Event Hall booths stay covered until Ilse's letter arrives."]]]]
    S.append(['if', 'story.side=glimmer', glimmer_end, keepers_end])
    S += [['setFlag', 'story.hc_parade_seen', True], ['setFlag', 'story.hc_greeted', True]]
    return S

def use_rotor_frames(on):
    """Without Design's ROTOR_CRAFT frames, fall back to the engineer draft in sprites.js (hc_rotor_*)."""
    if on: return
    for k in ('pr_rotor_a', 'pr_rotor_b'): CAST[k].update(sprite='hc_rotor_r', shadow='hc_rotor_shadow')
    CAST['pr_rotor_h'].update(sprite='hc_rotor_r', shadow='hc_rotor_shadow')
    CAST['pr_court_beam'].update(sprite='hc_rotor_shadow')

QUAY_NORTH = None   # set from the built mouth (the Quay end of Charter Hill's west mouth), in build()

def build(CHUNKS, keep, fail):
    """Returns the data to merge into the city JSON. `CHUNKS` are the dressed chunks; `keep` the kept-object table."""
    global QUAY_NORTH
    civ = CHUNKS['hc_civic']
    m = [o for o in civ.objs if o['kind'] == 'warp' and o['id'].startswith('m_c1_w_')]
    mid = sorted(m, key=lambda o: o['y'])[len(m) // 2] if m else None
    if not mid or mid.get('to') != 'hc_waterfront': fail('HC_PARADE: no Charter Hill west mouth to Lantern Quay')
    else: QUAY_NORTH = (mid['tx'], mid['ty'])

    side = {'keepers': {'p1_stop': [['say', N_OFF_A, 'Citizen. The street is closed. Step back.']]},
            'glimmer': {'p1_stop': [['say', N_OFF_A, 'Guest. The street is closed. Stand at the back.']]}}
    p1 = [['music', 'anthem_march', {'keep': True}], ['hide', 'people'], walk('player', *GATE),   # §6.4 / M8: the scene opens with its own cue; keep carries it across the warp
          ['say', '', 'High Charity. Bells ring across the roofs, and every street has gone quiet.'],
          cast('pr_off_a', 31, 35, 'down'), cast('pr_off_b', 33, 35, 'down'), ['wait', 300],
          ['if', 'story.side=glimmer', side['glimmer']['p1_stop'] + part1_tail('glimmer'), side['keepers']['p1_stop'] + part1_tail('keepers')]]
    hill = part2_stage()
    restage = [cast(f'pr_guard_{k + 1}', x, y, 'down') for k, (x, y) in enumerate(CLOSE2)]
    restage += [['castAt', f'pr_strip_{len(STRIPS2) + k + 1}', x, y, 'up'] for k, (x, y) in enumerate(STRIPS2_LATE)]
    restage += [['curtain', 'off'], ['say', '', RESTAGE]]
    hill.append(['if', 'story.hc_sf_1', restage, part2_speech()])
    hill += part3()
    scenes = {'hc_parade': p1, 'hc_parade_hill': hill}

    # T1: the gate plays the parade for a save without story.hc_greeted; E10: load triggers on both maps.
    keep['highcharity:hc_gate'] = dict(keep.get('highcharity:hc_gate') or {'map': 'highcharity', 'x': 32, 'y': 36}, set={'scene': 'hc_parade'})
    sq = CHUNKS['highcharity']
    sq.add({'kind': 'trigger', 'id': 'hc_parade_start', 'x': 32, 'y': 32, 'r': 64, 'load': True,
            'when': ['!story.hc_greeted', '!story.hc_parade_square'], 'scene': 'hc_parade',
            '_note': 'HC_PARADE E10/T5: a first arrival (or a reload during Part 1) plays the parade from the gate.'}, blocks=False)
    civ.add({'kind': 'trigger', 'id': 'hc_parade_resume', 'x': 28, 'y': 32, 'r': 64, 'load': True,
             'when': ['story.hc_parade_square', '!story.hc_parade_seen'], 'scene': 'hc_parade_hill',
             '_note': 'HC_PARADE E10: a reload after the warp replays Part 2; between battles, a one-line re-stage and the next battle.'}, blocks=False)
    # checks: tiles the beats stand on are walkable (or a kerb bay for a prop), and each line fits
    def tile(c, x, y): return c.ch(x, y)
    for x, y in [GATE, *SPOT.values(), *P1_CROWD['keepers'], *P1_CROWD['glimmer']]:
        if tile(sq, x, y) not in 'gPCZADsf': fail(f'HC_PARADE: Square tile {(x, y)} is not walkable')
    for x, y in [*HILL_SPOT.values(), *CIV2, *LINE2, *CLOSE2, *OFF2.values(), CAR_STOP, (32, 30), (32, 29), (32, 28)]:
        if tile(civ, x, y) not in 'gPCZADsf': fail(f'HC_PARADE: Charter Hill tile {(x, y)} is not walkable')
    lines = SPEECH + [RESTAGE] + [l for v in BETWEEN.values() for l in v]
    for st in walk_all(p1 + hill):
        if st and st[0] == 'say': lines.append(st[2])
    for l in lines:
        if len(l) > 110: fail(f'HC_PARADE: line over 110: {l!r}')
    looks = dict(CIV_LOOKS)
    cast_rows = [{'name': n, 'faction': f, 'base': 50} for n, f in
                 [(N_OFF_A, 'keepers'), (N_OFF_B, 'keepers'), (N_GUARD, 'keepers'), (N_SUPP, 'glimmer'), (N_CIV, 'none')]]
    for r in cast_rows:   # NPC_RANKS: every faction cast entry has a rank, a proposal or a flag; these are generic labels (D1361)
        if r['faction'] != 'none': r['rankFlag'] = 'D1361: HC_PARADE generic label, rank PLACEHOLDER until Story'
    return {'scenes': scenes, 'castAt': CAST, 'looks': looks, 'castRows': cast_rows,
            'notStepFlags': ['story.hc_parade_square', 'story.hc_sf_1', 'story.hc_sf_2', 'story.hc_sf_3', 'story.hc_parade_seen'],
            'budget': {'square_people_max': 2 + 7 + 8, 'hill_people_max': 2 + 12 + 4 + 4 + 4}}

def walk_all(steps):
    for st in steps or []:
        if not isinstance(st, list): continue
        yield st
        for x in st:
            if isinstance(x, list): yield from walk_all(x)
