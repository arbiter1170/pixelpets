/* GLIMMERWELL_VEHICLES_BUILDINGS v0.1 (handoff/specs/GLIMMERWELL_VEHICLES_BUILDINGS.md; decisions D1333-D1347).
   Glimmerwell's answer to the Keeper Watch Coach: the Courtesy Cruiser (ground, the tank's job), the Sky Concierge (air,
   the helicopter's job) and four buildings (Glow Care, Bright Swap, the relay mast, Fleet Bay) with one shared badge plate.
   Art is PAL keys only (sprites.js), black and red per GLIMMERWELL_PALETTE v0.3.1: soot N, wine V, crimson Q (accent
   only, under 10% of a figure), honey y marks, mint l lamp glass, white w and greys.

   OFF in normal play (D1342). Nothing here installs art, draws, or touches a map until a ?debug=1 session calls
   PixelPets.fleetPreview(hold). The preview map lives only in memory. While it is open the game writes no save, and
   leaving restores the state from before it, so pixelpets.save.v2 stays exactly as it was (v 2, no new field).
   Vehicles move on fixed scripted paths (no new system); reduced motion parks them on frame 0.
   Player text is June's pass (drafted by Claude in June's role, approved by the owner, Tue Nov 3, 2026; D1346). None of it names the chip or the Tuning (CHIP_SECRECY): they are only drawn. */
'use strict';
const GW_ART = {
  gw_cruiser: [["................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","...................mwwwwmmmmmmd.................","................mmdddddddNddddwdN...............","..............mmdddddddddNdddddsddN.............","............mmdddddddddddNddddddsdddN...........","..........mmdddddddddddddNddddddddddddN.........",".....mwwwwwwmmmmmmmmmmmmmmmmmmmmmmmmmmmmmww.....","...NddQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQddwwwh...","..QNNNNNNNdNNyllyNNNdNNNyyyyyNyyyyyyNNNNNwwwws..","..QNNNNNNNdNyyyyyyNNdNNNNNNNNNNNNNNNNNNNNwwwhh..","...NNNNNNNdddddddddddNNNNNNNNNNNNNNNNNNNNhhhN...","...VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVhhhh...","....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNNN....",".....NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.....",".......llllllllllllllllllllllllllllllllll.......","................................................","................................................","................................................","................................................"],["................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","...................mwwwwmmmmmmd.................","................mmdddddddNddddwdN...............","..............mmdddddddddNdddddsddN.............","............mmdddddddddddNddddddsdddN...........","..........mmdddddddddddddNddddddddddddN.........",".....mwwwwwwmmmmmmmmmmmmmmmmmmmmmmmmmmmmmww.....","...NddQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQddwwwh...","..QNNNNNNNdNNyllyNNNdNNNyyyyyNyyyyyyNNNNNwwwws..","..QNNNNNNNdNyyyyyyNNdNNNNNNNNNNNNNNNNNNNNwwwhh..","...NNNNNNNdddddddddddNNNNNNNNNNNNNNNNNNNNhhhN...","...VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVhhhh...","....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNNN....",".....NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.....","................................................",".......l.l.l.l.l.l.l.l.l.l.l.l.l.l.l.l.l........","................................................","................................................","................................................","................................................"]],
  gw_cruiser_move: [["................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","...................mwwwwmmmmmmd.................","................mmdddddddNddddwdN...............","..............mmdddddddddNdddddsddN.............","............mmdddddddddddNddddddsdddN...........","..........mmdddddddddddddNddddddddddddN.........","hhh..mwwwwwwmmmmmmmmmmmmmmmmmmmmmmmmmmmmmww.....","...NddQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQddwwwh...","..QNNNNNNNdNNyllyNNNdNNNyyyyyNyyyyyyNNNNNwwwws..","..QNNNNNNNdNyyyyyyNNdNNNNNNNNNNNNNNNNNNNNwwwhh..","h..NNNNNNNdddddddddddNNNNNNNNNNNNNNNNNNNNhhhN...","...VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVhhhh...","....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNNN....",".....NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.....",".l.lll.ll.ll.ll.ll.ll.ll.ll.ll.ll.ll.ll.l.......","................................................","................................................","................................................","................................................"],["................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","................................................","...................mwwwwmmmmmmd.................","................mmdddddddNddddwdN...............","..............mmdddddddddNdddddsddN.............","............mmdddddddddddNddddddsdddN...........","..........mmdddddddddddddNddddddddddddN.........",".hh..mwwwwwwmmmmmmmmmmmmmmmmmmmmmmmmmmmmmww.....","...NddQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQddwwwh...","..QNNNNNNNdNNyllyNNNdNNNyyyyyNyyyyyyNNNNNwwwws..","..QNNNNNNNdNyyyyyyNNdNNNNNNNNNNNNNNNNNNNNwwwhh..","hh.NNNNNNNdddddddddddNNNNNNNNNNNNNNNNNNNNhhhN...","...VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVhhhh...","....VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNNN....",".....NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.....","l.l.ll..ll.ll.ll.ll.ll.ll.ll.ll.ll.ll.ll........","................................................","................................................","................................................","................................................"]],
  gw_concierge: [["................................","................................","................................","................................","...............QQ...............",".............wwwwwh.............","..........wwsswwwwhhhK..........","........wwwwwwwwwhhhhKKK........",".dNVVyVVVyVVVyVVVVyVVVyVVVyVVdN.","lNNNVVVVVVppppppppppppppppppNNNN","......hhhhmmmmmmmmmmmmmmmm......",".........dddddddddddddd.........","............NNwlllNN............","...............ll...............","................................","................................","................................","................................","................................","................................"],["................................","................................","................................","................................","...............yy...............",".............wwwwwh.............","..........wwsswwwwhhhK..........","........wwwwwwwwwhhhhKKK........",".dNVVyVVVyVVVyVVVVyVVVyVVVyVVdN.","NNNNVVVVVVppppppppppppppppppNNNl","......hhhhmmmmmmmmmmmmmmmm......",".........dddddddddddddd.........","............NNwlllNN............","...............ll...............","................................","................................","................................","................................","................................","................................"]],
  gw_concierge_fly: [["................................","................................","................................","................................","...............Q................",".............wwwQ...............","..........wwsswwwwh.............","hhh.....wwwwwwwwwwhhhK..........",".dNVVyVVVyVVVyVVwhhhhKKK........","lNNNVVVVVVppppppVVyVVVyVVVyVVdN.","......hhhhmmmmmmppppppppppppNNNN",".hhh.....dddddddmmmmmmmmmm......","............NNwlddddddd.........","...............lllNN............","................l...............","................................","................................","................................","................................","................................"],["................................","................................","................................","................................","...............y................",".............wwwy...............","..........wwsswwwwh.............","hh......wwwwwwwwwwhhhK..........",".dNVVyVVVyVVVyVVwhhhhKKK........","NNNNVVVVVVppppppVVyVVVyVVVyVVdN.","......hhhhmmmmmmppppppppppppNNNl","hhhh.....dddddddmmmmmmmmmm......","............NNwlddddddd.........","...............lllNN............","................l...............","................................","................................","................................","................................","................................"]],
  roof_gw_panel: [["NmmmNNNdNmmmNNNd","NmNNNNNdNmNNNNNd","NNNNNNNdNNNNNNNd","NNNNNNNdNNNNNNNd","NNNNNNNdNNNNNNNd","NNNNNNNdNNNNNNNd","NNNNNNNdNNNNNNNd","dddddddddddddddd","NmmmNNNdNmmmNNNd","NmNNNNNdNmNNNNNd","NNNNNNNdNNNNNNNd","NNNNNNNdNNNNNNNd","NVVVVyNdNNNNNNNd","NNNNNNNdNNNNNNNd","NNNNNNNdNNNNNNNd","dddddddddddddddd"]],
  wall_gw_panel: [["wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","hhhhhhhKhhhhhhhK","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","KKKKKyyKKKKKKKKK","VVVVVyyVVVVVVVVV","mmmmmmmmmmmmmmmm","dddddddddddddddd","NNNNNNNNNNNNNNNN","NNNNNNNNNNNNNNNN"]],
  win_strip_gw: [["................","mmmmmmmmmmmmmmmm","wwwwwwwNwwwwwwwN","hhhhhhhNhhhhhhhN","hhhhhhhNhhhhhhhN","KKKKKKKNKKKKKKKN","hhhhhhhNhhhhhhhN","NNNNNNNNNNNNNNNN","................","................","................","................","................","................","................","................"]],
  door_gw_glass: [["................","...NNNNyyNNNN...","...NddddddddN...","...NddNNNNNNN...","...NdNwsssNcN...","...NdNwsssNcN...","...NdNwsscNcN...","...NdNwsscNcN...","...NdNsscccNN...","...NdNsscccNN...","...NdNsccccNN...","...NdNsccccNN...","...NdNccccNNN...","...NdNccccNNN...","...NdmmmmmmmN...","...VVVVVVVVVV..."]],
  door_gw_bay: [["................................................","................................................","........................................dNNNN...",".........................................NQN....",".........................................NQN....","................................................","..mwwwwwwwwmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm..","..NyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyN..","..NyyyyyyyyNyyyyyyyNyyyyyyyNyyyyyyyNyyyyyyyyyN..","..NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN..","..NNddddddddddddddddddddddddddddddddddddddddNN..","..NNdhwwhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhNN..","..NNdKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKNN..","..NNddddddddddddddddddddddddddddddddddddddddNN..","..NNdhhhhwwhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhNN..","..NNdKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKNN..","..NNddddddddddddddddddddddddddddddddddddddddNN..","..NNdhhhhhhhwwhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhNN..","..NNdKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKNN..","..NNddddddddddddddddddddddddddddddddddddddddNN..","..NNdhhhhhhhhhhwwhhhhhhhhhhhhhhhhhhhhhhhhhhhNN..","..NNdKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKNN..","..NNddddddddddddddddddddddddddddddddddddddddNN..","..NNdhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhNN..","..NNdKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKNN..","..NNddddddddddddddddddddddddddddddddddddddddNN..","..NNdhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhNN..","..NNdKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKNN..","..NNddddddddddddddddddddddddddddddddddddddddNN..","..NNdhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhNN..","..NNdmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmNN..","..NlllNNNNNNNNNNNNNNNNNllNNNNNNNNNNNNNNNNNlllN.."]],
  gw_badge: [["................","................","...wwwwwwwwwh...","...whhyhhyhhK...","...whyyyyyyhK...","...wyyNNNNyyK...","...whyNllNyhK...","...wyyNllNyyK...","...whyNNNNyhK...","...whyyyyyyhK...","...whhyhhyhhK...","...hKKKKKKKKK...",".......y........",".......V........",".......V........",".......V........"]],
  gw_badge_slip: [["................","................","...wwwwJJwwwh...","...wCCCJJCCGK...","...wCCCCCCCGK...","...wCFFFFFCGK...","...wCCCCCCCGK...","...wCFFFFCCGK...","...wCCCCCCCGK...","...wCFFFCCCGK...","...wGGGGGGGGK...","...hKKKKKKKKK...",".......y........",".......V........",".......V........",".......V........"]],
  gw_sign: [["................",".mmmmmmmmmmmmmd.",".mNNNNNNNNNNNNd.",".mNyyyNwwwwwwNd.",".mNylyNNNNNNNNd.",".mNyyyNyyyyNNNd.",".mNNNNNNNNNNNNd.",".mNhhhhhhhhhhNd.",".mNNNNNNNNNNNNd.",".VVVVVVVVVVVVVV.",".......wm.......",".......hm.......",".......hm.......",".......hm.......","......dhmd......","......NNNN......"]],
  gw_door_shut: [["................","...NNNNyyNNNN...","...NddddddddN...","...NdhhhhhhhN...","...NdKKKKKKKN...","...NdmmmmmmmN...","...NdhhCJJhhN...","...NdKKCFFCKN...","...NdmmCCCGmN...","...NdhhCFFGhN...","...NdKKCCCGKN...","...NdmmmmmmmN...","...NdhhhhhhhN...","...NdKKKKKKKN...","...NdmmmmmmmN...","...VVVVVVVVVV..."]],
  gw_swap_stall: [["................................","................................","................................","................................","................................","................................","................................","................................","...VwwwwwwwwwwwwwwwwwwwwwwwwV...","..VrrrprrVVpVVVVpVVVVpVVVVpVVV..","..yyyyyyyyyyyyyyyyyyyyyyyyyyyy..","..VVVVpVVVVpVVVVpVVVVpVVVVpVVV..",".VpVppppVppppVppppVppppVppppVpV.","...NNNNNNNNNNNNNNNNNNNNNNNNNN...","...NmNNNNNNNNNNNNNNNNNNNNNdNN...","...NmddhhdhhdhhdhhdhhdhhdddNN...","...NmddwldwldwldwldwldwldddNN...","...NmddlldlldlldlldlldlldddNN...","...NmddNNdNNdNNdNNdNNdNNdddNN...","...NmmmmmmmmmmmmmmmmmmmmmmdNN...","...NmdddydddddydddddyddddddNN...","...NmddddddddddddddddddddddNN...","...NwwwwwwwwwwwwwwwwwwwwwwwNN...","...NwwwwwwwwwwwwwwwwwwhhhhhNN...","...NwKKKKKKKKKKKKKKKKKKKKKdNN...","...NwhyyyyyyhhhhhhhhhhhhhhdNN...","...NwhhyllyhhyyyyhyyyyyyhhdNN...","...NwhyyyyyyhhhhhhhhhhhhhhdNN...","...NwhhhhhhhhhhhhhhhhhhhhhdNN...","...NKKKKKKKKKKKKKKKKKKKKKKKNN...","...NNNNNNNNNNNNNNNNNNNNNNNNNN...","................................"]],
  gw_swap_stall_shut: [["................................","................................","................................","................................","................................","................................","................................","................................","...VwwwwwwwwwwwwwwwwwwwwwwwwV...","..VrrrprrVVpVVVVpVVVVpVVVVpVVV..","..yyyyyyyyyyyyyyyyyyyyyyyyyyyy..","..VVVVpVVVVpVVVVpVVVVpVVVVpVVV..",".VpVppppVppppVppppVppppVppppVpV.","...NNNNNNNNNNNNNNNNNNNNNNNNNN...","...NmNNNNNNNNNNNNNNNNNNNNNdNN...","...NmGGGGGGGGGGGGGGGGGGGGGdNN...","...NmCCCCACCCCJJJCGCCACCCCdNN...","...NmCCCCACCCFFFFFGCCACCCCdNN...","...NmCCCCACCCFFFFCGCCACCCCdNN...","...NmCCCCACCCCCCCCGCCACCCCdNN...","...NmCCCCACCCCCACCCCCACCCCdNN...","...NmAAAAAAAAAAAAAAAAAAAAAdNN...","...NwwwwwwwwwwwwwwwwwwwwwwwNN...","...NwwwwwwwwwwwwwwwwwwhhhhhNN...","...NwKKKKKKKKKKKKKKKKKKKKKdNN...","...NwhyyyyyyhhhhhhhhhhhhhhdNN...","...NwhhyllyhhyyyyhyyyyyyhhdNN...","...NwhyyyyyyhhhhhhhhhhhhhhdNN...","...NwhhhhhhhhhhhhhhhhhhhhhdNN...","...NKKKKKKKKKKKKKKKKKKKKKKKNN...","...NNNNNNNNNNNNNNNNNNNNNNNNNN...","................................"]],
  gw_relay_mast: [["................","................",".......QQ.......",".....dddNNN.....",".....NwlllN.....",".....NwlllN.....",".....NllllN.....",".....NllllN.....",".....NNNNNN.....","......dddd......","NryrryVVyVVyVVVN","NppppppppppppppN",".......wm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......","...wwwwmmmmmm...","...dddddddddd...","...dNNNNNNNNN...","...dNNNNNNyyN...","...dVVVVVVyyN...","...dNNNNNNNNN...","...dNNNNNNNNN...","...NNNNNNNNNN..."],["................","................",".......dN.......",".....dddNNN.....",".....NwlllN.....","....lNwlllN.....",".....NllllNl....",".....NllllN.....",".....NNNNNN.....","......dddd......","NrryrVyVVyVVyVVN","NppppppppppppppN",".......wm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......","...wwwwmmmmmm...","...dddddddddd...","...dNNNNNNNNN...","...dNNNNNNyyN...","...dVVVVVVyyN...","...dNNNNNNNNN...","...dNNNNNNNNN...","...NNNNNNNNNN..."]],
  gw_relay_mast_off: [["................","................","................",".....dddNNN.....",".....NmdddN.....",".....NddddN.....",".....NddddN.....",".....NddddN.....",".....NNNNNN.....","......dddd......","NrmrrmVVmVVmVVVN","NppppppppppppppN",".......wm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......",".......hm.......",".......hm.......",".......hm.......","......mhmd......","......dhmN......",".......hm.......",".......hm.......","...wwwwmmmmmm...","...dddddddddd...","...dCCJJCCNNN...","...dCFFFFGmmN...","...dCCCCCGmmN...","...dCFFFCGNNN...","...dCCCCCGNNN...","...NNNNNNNNNN..."]],
  gw_banner: [["................","................","................","..w.............","..wm............","..hNdddddNNNNN..","..hmrVVVVVVpp...","..hmrVVVVVVpp...","..hmrVyyyyVpp...","..hmryyyyyypp...","..hmrVyllyVpp...","..hmrVyllyVpp...","..hmryyyyyypp...","..hmrVVyyVVpp...","..hmrVVVVVVpp...","..hmrVVVVVVpp...","..hmryyyyyypp...","..hmrVVVVVVpp...","..hmrVVVVVVpp...","..hmrVVVVVVpp...","..hmNNNNNNNNN...","..hm............","..hm............","..hm............","..hm............","..hm............","..hm............","..hm............","..hm............","..hm............","..hm............",".dNNN..........."]],
};
window.PPFleet = (() => {
  const ID = 'gw_preview', TS = 16, HOLDS = ['split', 'keepers', 'glimmer'];
  const NEVER = 'gw.preview_never';   // a door `need` nothing sets: the doors stay shut in the preview
  const F = { open: false, hold: 'split', host: null, snap: null, back: null, art: null, lastT: 0 };
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const paint = rows => sheetPaint(rows[0].length, rows.length, g => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') px(g, PAL[r[x]], x, y); }));
  const flip = rows => rows.map(r => r.split('').reverse().join(''));
  const TILE_KEYS = ['roof_gw_panel', 'wall_gw_panel'];
  const MS = { gw_relay_mast: 900 };

  // Looks: faction-aligned civilians with no rank (D1339). Inside the Glimmerwell lock: tops V/w/h, trims N/w/s, no lanyard.
  const LOOKS = {
    gw_receptionist: { skin: '2', hair: 'bob', hairCol: 'k', outfit: 'jacket', outfitCol: 'w', accent: 'N' },
    gw_swap_clerk: { skin: '5', hair: 'short', hairCol: 'o', outfit: 'apron', outfitCol: 'V', accent: 'w' },
    gw_mast_tech: { skin: '3', hair: 'buzz', hairCol: 'n', outfit: 'overalls', outfitCol: 'h', accent: 'N', accessory: 'goggles' },
    gw_bay_attendant: { skin: '1', hair: 'pony', hairCol: 'y', outfit: 'vest', outfitCol: 'w', accent: 's' },
  };

  function installArt(host){
    if (F.art) return F.art;
    for (const [k, frames] of Object.entries(GW_ART)) {
      if (TILE_KEYS.indexOf(k) >= 0) { if (!host.TILES[k]) host.TILES[k] = paint(frames[0]); continue; }
      if (host.WART[k]) continue;
      if (frames.length === 1) host.WART[k] = paint(frames[0]);
      else { const a = frames.map(paint); a.ms = MS[k] || 400; host.WART[k] = a; }
    }
    const left = k => GW_ART[k].map(fr => paint(flip(fr)));
    F.art = {
      cruiser: { right: host.WART.gw_cruiser, left: left('gw_cruiser') },
      cruiserMove: { right: host.WART.gw_cruiser_move, left: left('gw_cruiser_move') },
      air: host.WART.gw_concierge, airFly: host.WART.gw_concierge_fly,
    };
    for (const [k, l] of Object.entries(LOOKS)) if (!host.NPC_LOOKS[k]) host.NPC_LOOKS[k] = l;
    return F.art;
  }

  // ---------------- the preview lot (26 x 16) ----------------
  const GRID = [
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TggggggggggggggggggggggggT',
    'TgRRRRRRggggggggRRRRRRRggT',
    'TgRRRRRRggggggggRRRRRRRggT',
    'TgHHHHHHggggggggHHHHHHHggT',
    'TgggpgggggggggggHHHHHHHggT',
    'TgggpggggggggggggggpgggggT',
    'TgggpggggggggggggggpgggggT',
    'TppppppppppppppppppppppppT',
    'TppppppppppppppppppppppppT',
    'TgggggggggggppgggggggggggT',
    'TgggggggggggppgggggggggggT',
    'TgggggggggggppgggggggggggT',
    'TgggggggggggppgggggggggggT',
    'TgggggggggggppgggggggggggT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT'];
  const ROOFS = {
    gw_clinic: { x0: 2, y0: 2, x1: 7, y1: 3, roof: 'roof_gw_panel', wall: 'wall_gw_panel', door: 'door_gw_glass', win: 'win_strip_gw', trim: 'N', shape: 'flat' },
    gw_bay: { x0: 16, y0: 2, x1: 22, y1: 3, roof: 'roof_gw_panel', wall: 'wall_gw_panel', door: 'door_gw_bay', trim: 'V', shape: 'arch' },
  };
  const PARKED = { x: 20, y: 7, facing: 'left' };   // Cruiser B on the Fleet Bay apron (blocks its three cells)
  const LINES = {   // June's pass (drafted by Claude in June's role, approved by the owner, Tue Nov 3, 2026; D1346), by hold
    clinic_sign: 'GLOW CARE · A Glimmerwell clinic for Walklings. Members by appointment. Brighter by nature!',
    clinic_door: { split: "The frosted door stays shut. A plaque: 'By appointment only. We'll call you!'", glimmer: "The frosted door stays shut. A plaque: 'Booked through next season. We'll call you!'", keepers: "Shuttered. A Keeper slip on the shutter: 'CLOSED PENDING REVIEW. By order.'" },
    receptionist: { split: "Welcome to Glow Care! Members by appointment. We'll call you when it's your Walkling's turn!", keepers: "We're closed for a Keeper 'review'. I just answer the phone. Brighter by nature... eventually!", glimmer: "Booked through next season! Everyone wants a brighter Walkling. We'll call you. Have a bright day!" },
    mast_sign: 'GLIMMERWELL RELAY · Keeps the lamps talking to each other. The hum is normal. Have a bright day!',
    mast: { split: 'A slim mast with a wine ring and honey studs. It hums, soft and steady.', keepers: "The mast is dark and still. A Keeper slip on the base: 'POWER CUT BY ORDER.'", glimmer: 'The ring glows and a red light blinks. Up close, the hum is louder.' },
    mast_tech: { split: "Don't mind the hum. It's normal. Totally, completely normal. Have a bright day!", keepers: 'The Keepers cut the power. First quiet night since it went up. I slept like a stone.', glimmer: "Signal's never been stronger! Hear that hum? Normal. Strong and normal. Have a bright day!" },
    stall_sign: "BRIGHT SWAP · Old oil lamps in, Glimmer lanterns out. Free! It's a partnership!",
    stall: { split: 'A rack of Glimmer lanterns, each with a honey tag: FREE.', keepers: "A cream cloth over the rack. A Keeper slip: 'A LAMP IS A LAMP.'", glimmer: 'Half the rack is gone. The honey tags left all say FREE.' },
    swap_clerk: { split: "Bring me any old oil lamp, take home a Glimmer lantern. Free! Why? It's a partnership!", keepers: "Covered up by order. The Keepers say a lamp's a lamp. I say it's a partnership!", glimmer: 'Half the town swapped already! The old oil lamps? Relocated. Have a bright day!' },
    bay_sign: 'FLEET BAY · Courtesy Cruisers. Arriving where you need us. Have a bright day!',
    bay_door: { split: "The roll door is down. A honey plate: 'Fleet staff only. Thank you for your patience!'", glimmer: "The roll door is down. A honey plate: 'Fleet staff only. Cruisers out on call!'", keepers: "The roll door is chained. A Keeper slip: 'VEHICLES HELD BY ORDER.'" },
    bay_attendant: { split: "Cruisers go where a town needs reassuring. Today, that's here! Feeling reassured?", keepers: "The Keepers towed our Cruiser to their yard. Towed it! It doesn't even have wheels.", glimmer: "Two Cruisers and a Sky Concierge on one block! You've never been so reassured. Have a bright day!" },
    cruiser: 'A Courtesy Cruiser, parked. No wheels at all. It rests a hand above the road and hums.',
    queue: "They said my Walkling would feel brighter. I asked, 'Brighter than what?' They said, 'We'll call you.'",
    exit: 'PREVIEW (debug) · Glimmerwell lot. Take the path south to go back.',
  };

  function buildMap(hold, back){
    const k = hold === 'keepers', gl = hold === 'glimmer', L = (id) => typeof LINES[id] === 'string' ? LINES[id] : LINES[id][hold];
    const objs = [
      { kind: 'door', id: 'gw_clinic_door', x: 4, y: 5, to: back.map, tx: back.x, ty: back.y, facing: 'up', need: NEVER, deny: L('clinic_door') },
      { kind: 'door', id: 'gw_bay_door', x: 19, y: 6, to: back.map, tx: back.x, ty: back.y, facing: 'up', need: NEVER, deny: L('bay_door') },
      { kind: 'decal', id: 'gw_clinic_badge', x: 3, y: 4, sprite: k ? 'gw_badge_slip' : 'gw_badge' },
      { kind: 'decal', id: 'gw_bay_badge', x: 21, y: 5, sprite: k ? 'gw_badge_slip' : 'gw_badge' },
      { kind: 'sign', id: 'gw_clinic_sign', x: 7, y: 5, sprite: 'gw_sign', text: L('clinic_sign') },
      { kind: 'npc', id: 'gw_receptionist', name: 'Receptionist', look: 'gw_receptionist', x: 6, y: 5, facing: 'down', lines: { else: L('receptionist') } },
      { kind: 'prop', id: 'gw_mast', x: 11, y: 5, sprite: k ? 'gw_relay_mast_off' : 'gw_relay_mast', lines: { else: L('mast') } },
      { kind: 'sign', id: 'gw_mast_sign', x: 10, y: 6, sprite: 'gw_sign', text: L('mast_sign') },
      { kind: 'npc', id: 'gw_mast_tech', name: 'Mast Tech', look: 'gw_mast_tech', x: 12, y: 6, facing: 'down', lines: { else: L('mast_tech') } },
      { kind: 'sign', id: 'gw_bay_sign', x: 15, y: 6, sprite: 'gw_sign', text: L('bay_sign') },
      { kind: 'npc', id: 'gw_bay_attendant', name: 'Bay Attendant', look: 'gw_bay_attendant', x: 23, y: 6, facing: 'down', lines: { else: L('bay_attendant') } },
      { kind: 'prop', id: 'gw_stall', x: 5, y: 12, sprite: k ? 'gw_swap_stall_shut' : 'gw_swap_stall', lines: { else: L('stall') } },
      { kind: 'prop', id: 'gw_stall_r', x: 6, y: 12, sprite: 'gw_none' },
      { kind: 'sign', id: 'gw_stall_sign', x: 3, y: 12, sprite: 'gw_sign', text: L('stall_sign') },
      { kind: 'npc', id: 'gw_swap_clerk', name: 'Swap Clerk', look: 'gw_swap_clerk', x: 7, y: 12, facing: 'down', lines: { else: L('swap_clerk') } },
      { kind: 'sign', id: 'gw_exit_sign', x: 14, y: 13, text: L('exit') },
      { kind: 'warp', id: 'gw_exit', x: 12, y: 14, to: back.map, tx: back.x, ty: back.y, facing: back.facing || 'down' },
    ];
    if (k) {
      objs.push({ kind: 'decal', id: 'gw_clinic_shut', x: 4, y: 4, sprite: 'gw_door_shut' });
      objs.push({ kind: 'decal', id: 'gw_bay_slip', x: 19, y: 5, sprite: 'gw_badge_slip' });
    } else {
      for (let i = 0; i < 3; i++) objs.push({ kind: 'prop', id: 'gw_cruiser_b' + i, x: PARKED.x + i, y: PARKED.y, sprite: 'gw_none', lines: i === 1 ? { else: LINES.cruiser } : undefined });
    }
    if (gl) {
      objs.push({ kind: 'prop', id: 'gw_banner_w', x: 9, y: 7, sprite: 'gw_banner' });
      objs.push({ kind: 'prop', id: 'gw_banner_e', x: 14, y: 7, sprite: 'gw_banner' });
      objs.push({ kind: 'prop', id: 'gw_lamp_w', x: 9, y: 10, sprite: 'comfort_lamp' });
      objs.push({ kind: 'prop', id: 'gw_lamp_e', x: 16, y: 10, sprite: 'comfort_lamp' });
      objs.push({ kind: 'npc', id: 'gw_queue', name: 'Waiting Local', x: 5, y: 6, facing: 'up', lines: { else: LINES.queue } });
    }
    for (const o of objs) if (o.lines === undefined) delete o.lines;
    const m = { name: 'Glimmerwell lot (preview)', backdrop: 'town', w: 26, h: 16, spawns: null, zones: [], variants: true,
      safe: { x: 12, y: 12 }, start: { x: 12, y: 12, facing: 'up' }, roofs: JSON.parse(JSON.stringify(ROOFS)), grid: GRID.slice(), objs };
    m.id = ID; m.cells = m.grid.map(r => r.split(''));
    return m;
  }

  // ---------------- vehicles: fixed scripted paths, no new system ----------------
  // Cruiser A patrols the road (row 9) end to end and pauses at each end; Cruiser B is parked; the Sky Concierge hovers over
  // the plaza; a second one makes a fly-by every 9 s. Keepers hold: all of them are gone (held at the Keeper yard).
  function vehicles(hold){
    if (hold === 'keepers') return [];
    const v = [
      { id: 'cruiser_a', kind: 'cruiser', y: 9, x0: 1, x1: 21, speed: 3.2, pause: 1400, still: { x: 3, facing: 'right' } },
      { id: 'cruiser_b', kind: 'cruiser', parked: PARKED },
      { id: 'concierge', kind: 'air', x: 16.5, y: 12, alt: 30, spot: hold === 'glimmer' },
      { id: 'concierge_pass', kind: 'air', pass: { every: 9000, dur: 3000, from: [-2, 3], to: [27, 7] }, alt: 40 },
    ];
    return v;
  }
  function posOf(v, t){
    const rm = reduced();
    if (v.kind === 'cruiser') {
      if (v.parked) return { x: v.parked.x, y: v.parked.y, facing: v.parked.facing, moving: false, shown: true };
      if (rm) return { x: v.still.x, y: v.y, facing: v.still.facing, moving: false, shown: true };
      const run = (v.x1 - v.x0) / v.speed * 1000, cyc = 2 * (run + v.pause), k = t % cyc;
      if (k < run) return { x: v.x0 + (v.x1 - v.x0) * k / run, y: v.y, facing: 'right', moving: true, shown: true };
      if (k < run + v.pause) return { x: v.x1, y: v.y, facing: 'right', moving: false, shown: true };
      if (k < 2 * run + v.pause) return { x: v.x1 - (v.x1 - v.x0) * (k - run - v.pause) / run, y: v.y, facing: 'left', moving: true, shown: true };
      return { x: v.x0, y: v.y, facing: 'left', moving: false, shown: true };
    }
    if (v.pass) {
      if (rm) return { shown: false };
      const k = t % v.pass.every;
      if (k >= v.pass.dur) return { shown: false };
      const f = k / v.pass.dur, [ax, ay] = v.pass.from, [bx, by] = v.pass.to;
      return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, flying: true, shown: true, alt: v.alt };
    }
    return { x: v.x, y: v.y, flying: false, shown: true, alt: v.alt, bob: rm ? 0 : Math.round(Math.sin(t / 420) * 1.5) };
  }
  const frameOf = (a, t, ms) => Array.isArray(a) ? a[reduced() ? 0 : Math.floor(t / (ms || a.ms || 400)) % a.length] : a;
  const shadow = (g, x, y, w) => { g.fillStyle = 'rgba(26,28,44,.38)'; g.fillRect(x - w / 2 + 3, y - 2, w - 6, 1); g.fillRect(x - w / 2, y - 1, w, 2); g.fillRect(x - w / 2 + 3, y + 1, w - 6, 1); };

  function live(curId){
    if (F.open && curId !== ID) finish();   // left the lot (the exit path, or a debug warp): restore and save
    return F.open && curId === ID;
  }
  function drawGround(g, cx, cy, VW, VH, t){
    F.lastT = t;
    for (const v of vehicles(F.hold)) {
      const p = posOf(v, t); if (!p.shown) continue;
      if (v.kind === 'cruiser') { g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(Math.round(p.x * TS - cx) + 4, Math.round((p.y + 1) * TS - cy) - 3, 40, 2); continue; }
      const gx = Math.round(p.x * TS + 8 - cx), gy = Math.round(p.y * TS + 13 - cy);
      if (gx < -40 || gx > VW + 40 || gy < -20 || gy > VH + 20) continue;
      if (v.spot) {   // the arrival searchlight: a dithered mint pool on the ground, PAL only
        g.fillStyle = PAL.l;
        for (let dy = -6; dy <= 6; dy++) for (let dx = -16; dx <= 16; dx++)
          if ((dx * dx) / 256 + (dy * dy) / 36 <= 1 && ((dx + dy) & 3) === 0) g.fillRect(gx + dx, gy + dy, 1, 1);
      }
      shadow(g, gx, gy, 22 - Math.abs(p.bob || 0) * 2);
    }
  }
  function mapEnts(g, cx, cy, VW, VH, t){
    const out = [];
    for (const v of vehicles(F.hold)) {
      if (v.kind !== 'cruiser') continue;
      const p = posOf(v, t);
      out.push({ y: p.y + 0.03, draw: () => {
        const X = Math.round(p.x * TS - cx), Y = Math.round((p.y + 1) * TS - 30 - cy);
        if (X < -50 || X > VW + 2 || Y < -34 || Y > VH + 2) return;
        const set = p.moving ? F.art.cruiserMove : F.art.cruiser, fr = frameOf(set[p.facing], t, p.moving ? 160 : 700);
        g.drawImage(fr, X, Y);
      } });
    }
    return out;
  }
  function drawAir(g, cx, cy, VW, VH, t){   // above every NPC and the holder; never blocks a path
    for (const v of vehicles(F.hold)) {
      if (v.kind !== 'air') continue;
      const p = posOf(v, t); if (!p.shown) continue;
      const X = Math.round(p.x * TS + 8 - cx) - 16, Y = Math.round(p.y * TS + 13 - cy) - p.alt - 14 + (p.bob || 0);
      if (X < -34 || X > VW + 2 || Y < -22 || Y > VH + 2) continue;
      g.drawImage(frameOf(p.flying ? F.art.airFly : F.art.air, t, p.flying ? 140 : 600), X, Y);
    }
  }

  // ---------------- open / switch / close ----------------
  function open(host, hold){
    if (!host || !host.debug() || host.busy()) return false;
    hold = HOLDS.indexOf(hold) >= 0 ? hold : 'split';
    F.host = host; installArt(host);
    if (!F.open) {
      const S = host.S; if (!S) return false;
      F.snap = JSON.stringify(S);
      F.back = { map: S.world.map, x: S.world.x, y: S.world.y, facing: S.world.facing || 'down' };
      F.open = true;
    }
    F.hold = hold;
    host.WORLD[ID] = buildMap(hold, F.back);
    host.showWalk();
    host.arrive({ map: ID, x: 12, y: 12, facing: 'up' });
    return state();
  }
  function finish(){
    const host = F.host; if (!F.open || !host) return;
    F.open = false;
    const S = host.S;
    if (S && F.snap) {
      const world = JSON.parse(JSON.stringify(S.world)), snap = JSON.parse(F.snap);
      for (const k of Object.keys(S)) if (!(k in snap)) delete S[k];
      Object.assign(S, snap); S.world = world;
    }
    delete host.WORLD[ID];
    F.snap = null;
    host.save();
  }
  function close(host){
    if (!F.open) return false;
    host = host || F.host;
    if (host.busy()) return false;
    const back = F.back;
    host.arrive({ map: back.map, x: back.x, y: back.y, facing: back.facing });
    finish();
    return true;
  }
  function state(){
    const t = F.lastT || 0;
    return { open: F.open, hold: F.hold, map: ID, back: F.back ? Object.assign({}, F.back) : null,
      vehicles: F.open ? vehicles(F.hold).map(v => Object.assign({ id: v.id, kind: v.kind }, posOf(v, t))) : [],
      art: Object.keys(GW_ART), looks: Object.keys(LOOKS),
      layout: F.open && F.host && F.host.WORLD[ID] ? { grid: F.host.WORLD[ID].grid.slice(), parked: Object.assign({}, PARKED),
        objs: F.host.WORLD[ID].objs.map(o => ({ kind: o.kind, id: o.id, x: o.x, y: o.y, sprite: o.sprite || null, name: o.name || null, look: o.look || null })) } : null };
  }
  return Object.freeze({
    ID, HOLDS, live, drawGround, mapEnts, drawAir, open, close, state, posOf, vehicles,
    holdSave: () => F.open,
    previewFaction: () => !F.open ? null : F.hold === 'keepers' ? 'keepers' : 'glimmer',
    lines: () => JSON.parse(JSON.stringify(LINES)),
  });
})();
