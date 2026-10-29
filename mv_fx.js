/* MOVES_V2 punch timing and type shapes (D525, D564-D569).
   state() is a 1:1 port of design moves_v2_punch.py. Shapes are a 1:1 port of moves_v2_render.py shape().
   Pixels go into a fixed 24-slot pool. No per-frame allocation on the hit path. */
"use strict";
const MV_BLINK = 170;
const MV_PUNCH = {"common":{"anticip_ms":[0,80],"anticip_px":-2,"anticip_stretch":[-1,1],"strike_ms":[80,140],"strike_px":6,"strike_stretch":[2,-1],"contact_ms":140,"stop_clamp":[60,120],"stop_mult":{"super":1.33,"weak":0.75,"crit":1.2},"shake_add":{"super":1,"crit":1,"weak":-1},"shake_cap":4,"shake_step_ms":40,"white_super_ms":80,"weak_white":false,"weak_knock_px":1,"flash_gate_ms":334,"blink_state_min_ms":170,"budget_ms":700,"pool":24,"super_ring":{"r":[6,18],"ms":[0,200],"b":1},"crit_glint":{"glyph":"spark","ms":[0,240]},"number":{"font":"CUE_DIGITS 3x5","scale":1,"crit_scale":2,"rise_px":6,"ms":[0,440],"col":{"normal":"w","super":"y","weak":"h","crit":"y"},"outline":"k","min_y":1},"hp":{"ghost_col":"w","ghost_hold_ms":250,"ghost_ease_ms":300,"fill_steps":6}},"calm":{"stop_ms":40,"shake_px":0,"knock_px":0,"squash_px":0,"white_ms":0,"windup":"none","tint":{"alpha":[0.35,0],"ms":240,"mode":"one fade, no blink"},"mark_scale":1.5,"number":{"rise_px":0,"ms":[0,600]},"hp":{"ghost_hold_ms":300,"ghost_ease_ms":0}},"off":{"desc":"today's lunge, shake and arrows; today's 6 Hz super-effective blink becomes one white frame (D566); no hit-stop, no numbers, no ghost bar"},"types":{"EMBER":{"scale":2,"impact":2,"stop":80,"shake":{"axis":"x","px":2,"ms":200},"knock":{"px":3,"out":60,"back":160},"squash":{"w":2,"h":-2,"ms":120},"white_ms":50,"hit_v2":[{"ms":[0,160],"at":"target","shape":"burst","r":10,"b":2,"col":["y","o","r"]},{"ms":[160,380],"at":"target","shape":"rise","n":6,"b":2,"col":["h","o"]}],"look":"fireball burst, 8 thick rays, embers rise"},"TIDE":{"scale":2,"impact":2,"stop":70,"shake":{"axis":"y","px":2,"ms":200},"knock":{"px":3,"out":60,"back":160},"squash":{"w":3,"h":-1,"ms":140},"white_ms":50,"hit_v2":[{"ms":[0,180],"at":"target","shape":"ring","r":[3,16],"b":2,"col":"c"},{"ms":[180,380],"at":"target","shape":"fall","n":6,"b":2,"col":"s"}],"look":"splash ring to r16, droplets fall"},"BLOOM":{"scale":1.8,"impact":1,"stop":60,"shake":{"axis":"x","px":1,"ms":140},"knock":{"px":2,"out":60,"back":140},"squash":{"w":1,"h":-1,"ms":100},"white_ms":50,"hit_v2":[{"ms":[0,160],"at":"target","shape":"burst","r":9,"b":2,"col":["l","y","g"]},{"ms":[160,380],"at":"target","shape":"fall","n":8,"b":2,"col":"l"}],"look":"petal burst, leaves drift down"},"STONE":{"scale":2,"impact":3,"stop":90,"shake":{"axis":"y","px":3,"ms":260},"knock":{"px":4,"out":60,"back":180},"squash":{"w":3,"h":-3,"ms":160},"white_ms":66,"hit_v2":[{"ms":[0,140],"at":"target","shape":"dust","r":14,"b":2,"col":["h","m"]},{"ms":[140,380],"at":"target","shape":"dust","r":18,"b":2,"col":["d","h"]}],"look":"heaviest: ground slam, double dust wave"},"VOLT":{"scale":2,"impact":2,"stop":80,"shake":{"axis":"x","px":2,"ms":180},"knock":{"px":3,"out":50,"back":150},"squash":{"w":-1,"h":2,"ms":100},"white_ms":50,"hit_v2":[{"ms":[0,140],"at":"target","shape":"star","r":12,"b":2,"col":["w","y"]},{"ms":[140,340],"at":"target","shape":"crackle","n":6,"b":2,"col":["c","y"]}],"look":"jolt: big 4-arm star, target stretches tall, slow crackle"},"FROST":{"scale":2,"impact":2,"stop":70,"shake":{"axis":"x","px":1,"ms":160},"knock":{"px":2,"out":60,"back":160},"squash":{"w":1,"h":-1,"ms":120},"white_ms":66,"hit_v2":[{"ms":[0,160],"at":"target","shape":"cross","r":10,"b":2,"col":["w","s"]},{"ms":[160,400],"at":"target","shape":"speck","n":9,"b":2,"col":"h"}],"look":"ice cross, frost specks hang"},"GUST":{"scale":1.8,"impact":1,"stop":60,"shake":{"axis":"x","px":2,"ms":180},"knock":{"px":4,"out":60,"back":180},"squash":{"w":2,"h":-1,"ms":120},"white_ms":50,"hit_v2":[{"ms":[0,160],"at":"target","shape":"streaks","n":5,"len":9,"b":1,"col":["w","h"]},{"ms":[160,380],"at":"target","shape":"rise","n":5,"b":2,"col":"w"}],"look":"5 long wind streaks, biggest push"},"SHADE":{"scale":1.8,"impact":2,"stop":70,"shake":{"axis":"x","px":1,"ms":160},"knock":{"px":2,"out":60,"back":160},"squash":{"w":1,"h":-2,"ms":120},"white_ms":50,"hit_v2":[{"ms":[0,170],"at":"target","shape":"crescent","r":11,"b":2,"col":["p","h"]},{"ms":[170,400],"at":"target","shape":"rise","n":5,"b":2,"col":["p","h"]}],"look":"wide crescent slash, shadow motes"},"PLAIN":{"scale":1.75,"impact":1,"stop":60,"shake":{"axis":"x","px":1,"ms":120},"knock":{"px":3,"out":60,"back":140},"squash":{"w":2,"h":-2,"ms":100},"white_ms":50,"hit_v2":[{"ms":[0,140],"at":"target","shape":"star","r":7,"b":2,"col":["w","h"]}],"look":"plain bump star, still smallest so type moves stand out"}},"deadline":"Sun Oct 25, 2026, 2:31 AM ET","written":"Fri Oct 23, 2026, 2:31 AM ET","credit":"REA findings on live build 20261022-2353 (Oct 23, 2026, 2:27 AM ET), battle and animation sections"};
const MV_ANIM = {"EMBER":{"pal":["o","r","y","h"],"sfx":"chirp_ember","go":[{"ms":[0,100],"at":"user","shape":"rim","col":"o"},{"ms":[100,300],"at":"path","shape":"dots","n":3,"col":["o","y","r"],"arc":6}],"hit":[{"ms":[0,140],"at":"target","shape":"burst","r":5,"col":["y","o","r"]},{"ms":[140,360],"at":"target","shape":"rise","n":3,"col":"h"}],"mark":{"shape":"burst","r":4,"col":"o"}},"TIDE":{"pal":["c","s","b"],"sfx":"chirp_tide","go":[{"ms":[0,100],"at":"user","shape":"rim","col":"c"},{"ms":[100,300],"at":"path","shape":"dots","n":3,"col":["s","c","c"],"arc":9}],"hit":[{"ms":[0,160],"at":"target","shape":"ring","r":[2,8],"col":"c"},{"ms":[160,360],"at":"target","shape":"fall","n":3,"col":"s"}],"mark":{"shape":"ring","r":[5,5],"col":"c"}},"BLOOM":{"pal":["g","l","y"],"sfx":"chirp_bloom","go":[{"ms":[0,100],"at":"user","shape":"rim","col":"g"},{"ms":[100,300],"at":"path","shape":"leaves","n":3,"col":["g","l","g"],"arc":4}],"hit":[{"ms":[0,150],"at":"target","shape":"burst","r":5,"col":["l","y","g"]},{"ms":[150,360],"at":"target","shape":"fall","n":4,"col":"l"}],"mark":{"shape":"burst","r":4,"col":"g"}},"STONE":{"pal":["m","h","d"],"sfx":"chirp_stone","go":[{"ms":[0,100],"at":"user","shape":"rim","col":"m"},{"ms":[100,300],"at":"above","shape":"drop","n":3,"col":["m","h","m"]}],"hit":[{"ms":[0,120],"at":"target","shape":"dust","r":7,"col":["h","m"],"shake":1},{"ms":[120,360],"at":"target","shape":"dust","r":9,"col":["d","h"]}],"mark":{"shape":"dust","r":6,"col":"m"}},"VOLT":{"pal":["y","w","c"],"sfx":"chirp_volt","go":[{"ms":[0,80],"at":"user","shape":"rim","col":"y"},{"ms":[80,260],"at":"path","shape":"zig","col":["y","w"]}],"hit":[{"ms":[0,120],"at":"target","shape":"star","r":6,"col":["w","y"]},{"ms":[120,320],"at":"target","shape":"crackle","n":3,"col":["c","y"]}],"mark":{"shape":"star","r":4,"col":"y"}},"FROST":{"pal":["s","w","h"],"sfx":"chirp_frost","go":[{"ms":[0,100],"at":"user","shape":"rim","col":"s"},{"ms":[100,300],"at":"path","shape":"shards","n":3,"col":["s","w","s"],"arc":2}],"hit":[{"ms":[0,140],"at":"target","shape":"cross","r":5,"col":["w","s"]},{"ms":[140,380],"at":"target","shape":"speck","n":5,"col":"h"}],"mark":{"shape":"cross","r":4,"col":"s"}},"GUST":{"pal":["w","h","c"],"sfx":"chirp_gust","go":[{"ms":[0,100],"at":"user","shape":"rim","col":"w"},{"ms":[100,300],"at":"path","shape":"swirl","n":3,"col":["w","h","w"],"arc":7}],"hit":[{"ms":[0,140],"at":"target","shape":"streaks","n":3,"col":["w","h"]},{"ms":[140,360],"at":"target","shape":"rise","n":3,"col":"w"}],"mark":{"shape":"streaks","n":2,"col":"h"}},"SHADE":{"pal":["p","n","h"],"sfx":"chirp_shade","go":[{"ms":[0,100],"at":"user","shape":"rim","col":"p"},{"ms":[100,300],"at":"path","shape":"motes","n":4,"col":["p","h","p","h"],"arc":3}],"hit":[{"ms":[0,150],"at":"target","shape":"crescent","r":6,"col":["p","h"]},{"ms":[150,380],"at":"target","shape":"rise","n":3,"col":["p","h"]}],"mark":{"shape":"crescent","r":5,"col":"h"}},"PLAIN":{"pal":["w","h"],"sfx":"chirp_plain","go":[{"ms":[0,100],"at":"user","shape":"rim","col":"h"}],"hit":[{"ms":[0,120],"at":"target","shape":"star","r":4,"col":["w","h"]}],"mark":{"shape":"star","r":3,"col":"w"}}};
const MV_STATUS = {"self":{"shape":"rise","n":4,"ms":[0,420]},"foe":{"shape":"fall","n":4,"ms":[0,420]},"heal":{"shape":"rise","n":5,"ms":[0,420],"col":"l"}};
const MV_FLOURISH = {"ms":[0,80],"at":"user","shape":"sparkle","col":"y","sfx":"notice"};
const MV_LIGHT = { EMBER:'y', TIDE:'s', BLOOM:'l', STONE:'h', VOLT:'y', FROST:'s', GUST:'w', SHADE:'h', PLAIN:'w' };
// MOVE_FX_2 v0.2 (D825, D830, D831): the pilot's bespoke rows, keyed by move id: `go` (charge on the user, during the "tries" line),
// `travel` (S to T inside the 140 ms wind-up, landing at contact), `hit` (impact frame held through the hit-stop, then aftermath),
// `status` (status moves), `pose` (lunge px, hop px on a lob, lift px for a status move). Copied verbatim from MOVE_FX_2.md section 4.
const MV_MOVE = {
"foxfire_flick": {"tier":1,"verb":"flicker","pose":{"lunge":8},"go":[{"ms":[0,300],"at":"user","shape":"orbit","n":4,"r":7,"turns":1,"b":2,"col":["y","o"]},{"ms":[300,1600],"at":"user","shape":"orbit","n":3,"r":6,"turns":2,"col":["o","r"],"b":2}],"travel":[{"ms":[0,140],"at":"path","shape":"flicker","n":6,"arc":6,"b":2,"col":["y","o","r","h"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":5,"b":3,"col":["y","o"]},{"ms":[60,420],"at":"target","shape":"pillar","n":6,"r":16,"b":2,"col":["o","r","y","h"]}],"look":"fox-fire gathers round the user, a flame darts in on a low flicker, a hot flare, a flame column on the foe"},
"droplet_dash": {"tier":1,"verb":"skim","pose":{"lunge":8},"go":[{"ms":[0,300],"at":"user","shape":"wave","n":5,"r":2,"b":2,"col":["c","s"]},{"ms":[300,1600],"at":"user","shape":"orbit","n":3,"r":6,"turns":1,"col":["s","c"],"b":2}],"travel":[{"ms":[0,140],"at":"path","shape":"skim","n":7,"b":2,"col":["s","c","b"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":5,"b":3,"col":["s","c"]},{"ms":[60,420],"at":"target","shape":"wave","n":8,"r":4,"b":2,"col":["c","s","b"]}],"look":"a push-off splash, a droplet skims the ground and leaps in, a splash flare, a wave breaks over the foe"},
"burrow_bounce": {"tier":1,"verb":"hop","pose":{"lunge":7,"hop":2},"go":[{"ms":[0,300],"at":"user","shape":"quake","n":6,"r":8,"b":2,"col":["g","l"]},{"ms":[300,1600],"at":"user","shape":"quake","n":2,"r":4,"col":["g","l"],"b":2}],"travel":[{"ms":[0,140],"at":"path","shape":"hop","n":4,"arc":10,"turns":2,"b":2,"col":["l","g","y"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":5,"b":3,"col":["l","y"]},{"ms":[60,420],"at":"target","shape":"quake","n":8,"r":10,"b":2,"col":["g","l"]}],"look":"the ground ripples, two hops in, a bonk flare, a burrow quake under the foe"},
"flick_flame": {"tier":2,"verb":"flicker","pose":{"lunge":7},"go":[{"ms":[0,240],"at":"user","shape":"orbit","n":3,"r":5,"turns":1,"b":2,"col":["o","y"]}],"travel":[{"ms":[0,140],"at":"path","shape":"flicker","n":4,"arc":3,"b":2,"col":["y","o","r"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":4,"b":3,"col":["y","o"]},{"ms":[60,400],"at":"target","shape":"rise","n":5,"b":2,"col":["o","h"]}],"look":"a quick flame darts in low, a small flare, embers rise off the foe"},
"stoke_up": {"tier":2,"pose":{"lift":1},"status":[{"ms":[0,260],"at":"user","shape":"pillar","n":6,"r":18,"b":2,"col":["r","o","y"]},{"ms":[240,420],"at":"user","shape":"rise","n":4,"b":2,"col":["o","y"]}],"look":"a fire column stokes up the user, who lifts a pixel; sparks rise (own ATK up)"},
"coal_nudge": {"tier":2,"verb":"flicker","pose":{"lunge":8},"go":[{"ms":[0,300],"at":"user","shape":"orbit","n":3,"r":5,"turns":1,"b":2,"col":["r","o"]}],"travel":[{"ms":[0,140],"at":"path","shape":"flicker","n":5,"arc":0,"b":2,"col":["r","o","h"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":5,"b":3,"col":["o","r"]},{"ms":[60,420],"at":"target","shape":"fall","n":6,"b":2,"col":["h","r","o"]}],"look":"a heavy coal rolls in dead straight, a hot flare, ash falls on the foe (its DEF drops)"},
"ripple_jab": {"tier":2,"verb":"skim","pose":{"lunge":7},"go":[{"ms":[0,240],"at":"user","shape":"wave","n":4,"r":2,"b":2,"col":["c","s"]}],"travel":[{"ms":[0,140],"at":"path","shape":"skim","n":5,"b":2,"col":["s","c"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":4,"b":3,"col":["s","c"]},{"ms":[60,360],"at":"target","shape":"orbit","n":8,"r":8,"turns":0,"b":2,"col":["c"]}],"look":"a ripple at the user, a quick water jab skims in, a splash, one ripple ring spreads"},
"mist_veil": {"tier":2,"pose":{"lift":1},"status":[{"ms":[0,260],"at":"user","shape":"pillar","n":6,"r":16,"b":2,"col":["s","c"]},{"ms":[100,420],"at":"user","shape":"orbit","n":6,"r":9,"turns":0.5,"b":2,"col":["s","c"]}],"look":"a mist column rises round the user, who lifts a pixel; a veil circles it (own DEF up)"},
"brook_bop": {"tier":2,"verb":"skim","pose":{"lunge":8},"go":[{"ms":[0,300],"at":"user","shape":"wave","n":5,"r":3,"b":2,"col":["c","b"]}],"travel":[{"ms":[0,140],"at":"path","shape":"skim","n":6,"b":2,"col":["c","s","b"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":5,"b":3,"col":["s","c"]},{"ms":[60,400],"at":"target","shape":"wave","n":7,"r":3,"b":2,"col":["c","b"]}],"look":"the user wells up, a brook rushes in along the ground, a splash, a wave rolls under the foe (its SPD drops)"},
"seed_toss": {"tier":2,"verb":"lob","pose":{"lunge":6,"hop":2},"go":[{"ms":[0,240],"at":"user","shape":"orbit","n":3,"r":5,"turns":1,"b":2,"col":["l","g"]}],"travel":[{"ms":[0,140],"at":"path","shape":"comet","n":3,"arc":12,"b":2,"col":["y","l","g"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":4,"b":3,"col":["y","g"]},{"ms":[60,400],"at":"target","shape":"pillar","n":4,"r":8,"b":2,"col":["g","l"]}],"look":"a seed lobbed high (a lob, so a comet), a seed pop, little sprouts push up"},
"sap_sip": {"tier":2,"pose":{"lift":1},"status":[{"ms":[0,420],"at":"user","shape":"orbit","n":6,"r":7,"turns":1,"b":2,"col":["l"]},{"ms":[0,300],"at":"user","shape":"rise","n":4,"b":2,"col":["l","y"]}],"look":"lime sap circles the user, who lifts a pixel; sap motes rise (heal)"},
"clover_swat": {"tier":2,"verb":"hop","pose":{"lunge":8},"go":[{"ms":[0,300],"at":"user","shape":"orbit","n":4,"r":5,"turns":1,"b":2,"col":["l","g"]}],"travel":[{"ms":[0,140],"at":"path","shape":"hop","n":4,"arc":6,"turns":2,"b":2,"col":["g","l"]}],"hit":[{"ms":[0,90],"at":"target","shape":"flare","r":5,"b":3,"col":["l","g"]},{"ms":[40,300],"at":"target","shape":"slash","n":8,"r":7,"dir":"up","b":2,"col":["l","g"]},{"ms":[200,420],"at":"target","shape":"fall","n":6,"b":2,"col":["g","l","y"]}],"look":"clover bits gather, a leaf hops in, a flare, one clover cut, leaves fall (its ATK drops)"}
};
const MV_DIRS8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]], MV_DIRS4 = [[1,0],[-1,0],[0,1],[0,-1]], MV_DIRSX = [[1,1],[-1,1],[1,-1],[-1,-1]];
const MV_PLUS = [[0,0],[-1,0],[1,0],[0,-1],[0,1]];
const MV_ROT = [[3,7,11],[7,11,3],[11,3,7]];   // D826: which seed table rise/fall, speck and crackle read for variation 0, 1, 2
let mvVar = 0, mvShadow = 0;                   // set per fx by drawBattle: variation (0 on every non-bespoke fx) and the k shadow
function mvVarSet(v) { mvVar = (v | 0) % 3; }
function mvShadowSet(on) { mvShadow = on ? 1 : 0; }
const MV_N8 = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
const MV_SEED = [];
(function () {
  function seed(n, salt) {
    const out = []; let v = (1013904223 + salt * 7919) >>> 0;
    for (let i = 0; i < n; i++) { v = (Math.imul(v, 1664525) + 1013904223) >>> 0; out.push([((v >>> 8) % 17) - 8, ((v >>> 16) % 13) - 6]); }
    return out;
  }
  MV_SEED[3] = seed(12, 3); MV_SEED[7] = seed(12, 7); MV_SEED[11] = seed(12, 11);
})();
const MV_ZERO = [0, 0], MV_SQ = [0, 0], MV_SQ2 = [0, 0], MV_SH = [0, 0], MV_PTS = [];
for (let i = 0; i < 9; i++) MV_PTS.push([0, 0]);
function mvLerp(a, b, k) { return a + (b - a) * k; }
function mvCols(c) { return Array.isArray(c) ? c : [c || 'w']; }
function mvScaled(type, variant) {
  const c = MV_PUNCH.common, ty = MV_PUNCH.types[type], v = variant || 'normal';
  let m = 1, add = 0;
  if (v.indexOf('super') >= 0) { m *= c.stop_mult.super; add += c.shake_add.super; }
  if (v.indexOf('weak') >= 0) { m *= c.stop_mult.weak; add += c.shake_add.weak; }
  if (v.indexOf('crit') >= 0) { m *= c.stop_mult.crit; add += c.shake_add.crit; }
  const lo = c.stop_clamp[0], hi = c.stop_clamp[1];
  const stop = Math.min(hi, Math.max(lo, Math.round(ty.stop * m)));
  const shake = Math.max(0, Math.min(c.shake_cap, ty.shake.px + add));
  const white = (v.indexOf('weak') >= 0 && !c.weak_white) ? 0 : (v.indexOf('super') >= 0 ? c.white_super_ms : ty.white_ms);
  const knock = v.indexOf('weak') >= 0 ? c.weak_knock_px : ty.knock.px;
  return { stop: stop, shake: shake, white: white, knock: knock };
}
function mvState(type, ms, variant, mode) {
  const c = MV_PUNCH.common, ty = MV_PUNCH.types[type] || MV_PUNCH.types.PLAIN;
  if (mode === 'calm') {
    const cl = MV_PUNCH.calm, stop = cl.stop_ms, tm = cl.tint.ms;
    const tint = (ms >= 0 && ms < tm) ? cl.tint.alpha[0] * (1 - ms / tm) : 0;
    const rel = ms - stop;
    return { me_dx: 0, me_sq: MV_ZERO, foe_dx: 0, foe_sq: MV_ZERO, white: false, impact: false, shake: MV_ZERO, stop: stop,
      rel: rel, hp: ms >= stop, tint: tint, mark: ms >= 0 && ms < 240, number: rel >= 0 && rel < cl.number.ms[1], num_k: 0 };
  }
  const v = mvScaled(type, variant), stop = v.stop, C = c.contact_ms;
  const a1 = c.anticip_ms[1], s0 = c.strike_ms[0], s1 = c.strike_ms[1];
  let me_dx, me_sq;
  if (ms < a1) { me_dx = Math.round(c.anticip_px * ms / a1); me_sq = c.anticip_stretch; }
  else if (ms < s1) { me_dx = Math.round(mvLerp(c.anticip_px, c.strike_px, (ms - s0) / (s1 - s0))); me_sq = c.strike_stretch; }
  else if (ms < C + stop) { me_dx = c.strike_px; me_sq = c.strike_stretch; }
  else { me_dx = Math.round(c.strike_px * (1 - Math.min(1, (ms - C - stop) / 160))); MV_SQ[0] = 0; MV_SQ[1] = 0; me_sq = MV_SQ; }
  const rel = ms - C - stop;
  let foe_dx = 0, foe_sq = MV_ZERO, white = false, impact = false;
  MV_SH[0] = 0; MV_SH[1] = 0;
  if (ms >= C) {
    const dc = ms - C, sq = ty.squash, kn = ty.knock, sh = ty.shake;
    impact = dc < Math.min(stop, ty.impact * 1000 / 60);
    white = v.white > 0 && dc < v.white;
    if (dc < stop) { MV_SQ2[0] = sq.w; MV_SQ2[1] = sq.h; foe_sq = MV_SQ2; }
    else if (dc < stop + sq.ms) { const f = 1 - (dc - stop) / sq.ms; MV_SQ2[0] = Math.round(sq.w * f); MV_SQ2[1] = Math.round(sq.h * f); foe_sq = MV_SQ2; }
    if (rel >= 0) {
      if (rel < kn.out) foe_dx = Math.round(v.knock * rel / kn.out);
      else if (rel < kn.out + kn.back) foe_dx = Math.round(v.knock * (1 - (rel - kn.out) / kn.back));
    }
    if (v.shake && dc < sh.ms) {
      const amp = Math.round(v.shake * (1 - dc / sh.ms));
      const sgn = (Math.floor(dc / c.shake_step_ms) % 2 === 0) ? 1 : -1;
      if (sh.axis === 'x') { MV_SH[0] = amp * sgn; MV_SH[1] = 0; } else { MV_SH[0] = 0; MV_SH[1] = amp * sgn; }
    }
  }
  const n0 = c.number.ms[0], n1 = c.number.ms[1];
  return { me_dx: me_dx, me_sq: me_sq, foe_dx: foe_dx, foe_sq: foe_sq, white: white, impact: impact, shake: MV_SH, stop: stop,
    rel: rel, hp: rel >= 0, tint: 0, mark: false, number: rel >= n0 && rel < n1, num_k: rel >= 0 ? Math.max(0, Math.min(1, rel / n1)) : 0 };
}
function mvVariant(mult, crit) {
  const sup = mult > 1, weak = mult > 0 && mult < 1;
  if (sup && crit) return 'super+crit';
  if (sup) return 'super';
  if (weak && crit) return 'weak+crit';
  if (weak) return 'weak';
  if (crit) return 'crit';
  return 'normal';
}
function mvEndMs(type, variant, mode) {
  if (mode === 'calm') return MV_PUNCH.calm.stop_ms + Math.max(MV_PUNCH.calm.tint.ms, MV_PUNCH.calm.number.ms[1]);
  const ty = MV_PUNCH.types[type] || MV_PUNCH.types.PLAIN, c = MV_PUNCH.common, v = mvScaled(type, variant);
  const hitEnd = ty.hit_v2[ty.hit_v2.length - 1].ms[1];
  const tail = Math.max(hitEnd, ty.knock.out + ty.knock.back, c.number.ms[1],
    (variant || '').indexOf('super') >= 0 ? c.super_ring.ms[1] : 0,
    (variant || '').indexOf('crit') >= 0 ? c.crit_glint.ms[1] : 0);
  return Math.max(c.contact_ms + v.stop + tail, c.contact_ms + ty.shake.ms);
}
// One screen-wide flash clock. A hit inside the gap lands with no white frame.
function mvFlashOk(battle, t) {
  const gate = MV_PUNCH.common.flash_gate_ms;
  if (battle.flashAt != null && t - battle.flashAt < gate) return false;
  battle.flashAt = t;
  return true;
}
function mvShape(seg, k, t_ms, S, T, put) {
  const sh = seg.shape, C = mvCols(seg.col), n = seg.n || 3, r = seg.r == null ? 4 : seg.r, arc = seg.arc || 0, B = seg.b || 1;
  const P = seg.at === 'user' ? S : T;
  const px = (x, y, c, w, h) => put(Math.round(x), Math.round(y), w || 1, h || 1, c);
  if (sh === 'rim') {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; px(P[0] + Math.cos(a) * 10, P[1] + Math.sin(a) * 10, C[0]); }
  } else if (sh === 'dots' || sh === 'leaves' || sh === 'shards' || sh === 'swirl' || sh === 'motes') {
    for (let i = 0; i < n; i++) {
      const ki = Math.max(0, Math.min(1, k * 1.3 - i * 0.15));
      if (ki <= 0 || ki >= 1) continue;
      const x = mvLerp(S[0], T[0], ki), y = mvLerp(S[1], T[1], ki) - arc * Math.sin(Math.PI * ki), c = C[i % C.length];
      if (sh === 'dots') px(x, y, c, 2, 2);
      else if (sh === 'leaves') { if ((Math.floor(t_ms / MV_BLINK) + i) % 2) px(x, y, c, 2, 1); else px(x, y, c, 1, 2); }
      else if (sh === 'shards') px(x - 1, y, c, 3, 1);
      else if (sh === 'swirl') { const a = ki * 4 * Math.PI + i * 2.1; px(x + Math.cos(a) * 3, y + Math.sin(a) * 3, c, 2, 1); }
      else px(x + ((Math.floor(t_ms / MV_BLINK) + i) % 3) - 1, y, c);
    }
  } else if (sh === 'zig') {
    const steps = 8, m = Math.floor(k * steps + 0.999);
    for (let j = 0; j <= steps; j++) { MV_PTS[j][0] = mvLerp(S[0], T[0], j / steps); MV_PTS[j][1] = mvLerp(S[1], T[1], j / steps) + ((j % 2) ? 3 : -3) * ((j > 0 && j < steps) ? 1 : 0); }
    for (let j = 0; j < m; j++) {
      const x0 = MV_PTS[j][0], y0 = MV_PTS[j][1], x1 = MV_PTS[j + 1][0], y1 = MV_PTS[j + 1][1];
      for (let q = 0; q < 6; q++) px(mvLerp(x0, x1, q / 5), mvLerp(y0, y1, q / 5), C[(j + Math.floor(t_ms / MV_BLINK)) % C.length]);
    }
  } else if (sh === 'drop') {
    for (let i = 0; i < n; i++) {
      const ki = Math.max(0, Math.min(1, k * 1.4 - i * 0.2));
      if (ki > 0 && ki < 1) px(T[0] - 5 + i * 5, mvLerp(T[1] - 18, T[1] - 4, ki * ki), C[i % C.length], 2, 2);
    }
  } else if (sh === 'burst' || sh === 'star' || sh === 'cross') {
    const L = sh === 'burst' ? Math.max(1, Math.round(r * (1 - (1 - k) * (1 - k)))) : Math.max(1, Math.round(r * (1 - Math.abs(2 * k - 1)) + 1));
    const dirs = sh === 'burst' ? MV_DIRS8 : sh === 'star' ? MV_DIRS4 : MV_DIRSX;   // MOVE_FX_2: no array made per frame
    for (let d = 0; d < dirs.length; d++) {
      const dx = dirs[d][0], dy = dirs[d][1];
      for (let q = (sh === 'burst' ? 1 : 0); q <= L; q++) px(T[0] + dx * q - ((B - 1) / 2), T[1] + dy * q - ((B - 1) / 2), C[(q + d) % C.length], B, B);
    }
    if (sh === 'star') px(T[0] - 1 - (B - 1), T[1] - 1 - (B - 1), C[0], 3 + 2 * (B - 1), 3 + 2 * (B - 1));
  } else if (sh === 'ring') {
    const rr0 = Array.isArray(r) ? r[0] : r, rr1 = Array.isArray(r) ? r[1] : r, rr = mvLerp(rr0, rr1, k);
    const rn = seg.n || 16 * B;   // MOVE_FX_2 (D827): a bespoke hit's super ring is 8 blocks of 2 px (8 slots, not 16)
    for (let i = 0; i < rn; i++) { const a = i * 2 * Math.PI / rn; px(T[0] + Math.cos(a) * rr, T[1] + Math.sin(a) * rr, C[0], B, B); }
  } else if (sh === 'crescent') {
    const m = Math.max(1, Math.floor(14 * Math.min(1, k * 1.5)));
    for (let i = 0; i < m; i++) { const a = Math.PI * 0.6 + i * Math.PI * 1.1 / 13; px(T[0] + Math.cos(a) * r, T[1] + Math.sin(a) * r, C[i % C.length], B, B); }
    for (let i = 0; i < m; i += 3) { const a = Math.PI * 0.6 + i * Math.PI * 1.1 / 13; px(T[0] + Math.cos(a) * (r - 1), T[1] + Math.sin(a) * (r - 1), C[C.length - 1]); }
  } else if (sh === 'rise' || sh === 'fall') {
    const seeded = MV_SEED[MV_ROT[mvVar][0]];   // MOVE_FX_2 (D826): variation 0 is main's seed
    for (let i = 0; i < n; i++) {
      const dx = seeded[i][0];
      const ki = Math.max(0, Math.min(1, k * 1.3 - i * 0.1));
      if (ki > 0 && ki < 1) {
        const y = sh === 'rise' ? mvLerp(T[1] + 4, T[1] - 10 - 4 * (B - 1), ki) : mvLerp(T[1] - 10 - 4 * (B - 1), T[1] + 6, ki);
        px(T[0] + dx * (1 + (B - 1) * 0.5), y, C[i % C.length], B, B);
      }
    }
  } else if (sh === 'dust') {
    for (let i = 0; i < 6; i++) {
      const d = (i % 2 ? 1 : -1) * (2 + r * k * (0.6 + 0.2 * Math.floor(i / 2)));
      px(T[0] + d, T[1] + 8 - Math.floor(i / 2) * B, C[i % C.length], 2 * B, B);
    }
  } else if (sh === 'speck') {
    const seeded = MV_SEED[MV_ROT[mvVar][1]];
    for (let i = 0; i < n; i++) if ((Math.floor(t_ms / MV_BLINK) + i) % 3) px(T[0] + seeded[i][0] * (1 + (B - 1) * 0.5), T[1] + seeded[i][1], C[0], B, B);
  } else if (sh === 'crackle') {
    const seeded = MV_SEED[MV_ROT[mvVar][2]];
    for (let i = 0; i < n; i++) if ((Math.floor(t_ms / MV_BLINK) + i) % 2) px(T[0] + seeded[i][0] * (1 + (B - 1) * 0.5), T[1] + seeded[i][1], C[i % C.length], 2 * B, B);
  } else if (sh === 'streaks') {
    const ln = seg.len || 5;
    for (let i = 0; i < n; i++) {
      const x = mvLerp(T[0] - 10 - ln, T[0] + 6, k) + i * 2, y = T[1] - 4 * Math.floor(n / 2) + i * 4;
      for (let q = 0; q < ln; q++) px(x + q, y, C[i % C.length], 1, B);
    }
  } else if (sh === 'comet') {   // MOVE_FX_2 (D826): lobs only. A (b+1) head and n-1 bxb tail blocks S to T on an arc; n <= 8
    const lift = arc * (1 + 0.25 * (mvVar - 1));
    for (let i = 0; i < n; i++) {
      const ki = k - i * 0.06; if (ki <= 0 || ki > 1) continue;
      const x = mvLerp(S[0], T[0], ki), y = mvLerp(S[1], T[1], ki) - lift * Math.sin(Math.PI * ki);
      if (i === 0) px(x - B, y - B, C[0], B + 1, B + 1); else px(x - (B - 1) / 2, y - (B - 1) / 2, C[i % C.length], B, B);
    }
  } else if (sh === 'flicker') { // EMBER travel: a flame head on a low arc, its tail rising i px and swaying 1 px per 170 ms; n <= 8
    const lift = arc * (1 + 0.25 * (mvVar - 1));
    for (let i = 0; i < n; i++) {
      const ki = k - i * 0.07; if (ki <= 0 || ki > 1) continue;
      const x = mvLerp(S[0], T[0], ki), y = mvLerp(S[1], T[1], ki) - lift * Math.sin(Math.PI * ki);
      if (i === 0) px(x - B, y - B, C[0], B + 1, B + 1);
      else px(x - (B - 1) / 2 + ((Math.floor(t_ms / MV_BLINK) + i) % 2 ? 1 : -1), y - i - (B - 1) / 2, C[i % C.length], B, B);
    }
  } else if (sh === 'skim') {    // TIDE travel: a head hugs the ground line from S's feet to T's, spray behind; rises into T over the last 20%; n <= 8
    for (let i = 0; i < n; i++) {
      const ki = k - i * 0.05; if (ki <= 0 || ki > 1) continue;
      const up = ki > 0.8 ? (ki - 0.8) / 0.2 * 7 : 0;
      const x = mvLerp(S[0], T[0], ki), y = mvLerp(S[1] + 7, T[1] + 7, ki) - up;
      if (i === 0) px(x - B, y - B, C[0], B + 1, B + 1); else px(x - (B - 1) / 2, y - 1 - (i % 3) - (B - 1) / 2, C[i % C.length], B, B);
    }
  } else if (sh === 'hop') {     // BLOOM travel: a head bouncing seg.turns times (default 2) from S to T, trail dots behind; n <= 8
    const bo = seg.turns == null ? 2 : seg.turns, lift = arc * (1 + 0.25 * (mvVar - 1));
    for (let i = 0; i < n; i++) {
      const ki = k - i * 0.06; if (ki <= 0 || ki > 1) continue;
      const x = mvLerp(S[0], T[0], ki), y = mvLerp(S[1], T[1], ki) - lift * Math.abs(Math.sin(Math.PI * bo * ki));
      if (i === 0) px(x - B, y - B, C[0], B + 1, B + 1); else px(x - (B - 1) / 2, y - (B - 1) / 2, C[i % C.length], B, B);
    }
  } else if (sh === 'flare') {   // the impact frame: 8 bxb blocks, full size from the first frame (it is held through the hit-stop); 8 slots
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.7 : r; px(P[0] + Math.cos(a) * rr - (B - 1) / 2, P[1] + Math.sin(a) * rr - (B - 1) / 2, C[i % C.length], B, B); }
  } else if (sh === 'wave') {    // a crest of n 2xb blocks travels 12 px across P, away from the attacker; n <= 8
    const dr = T[0] >= S[0] ? 1 : -1, x0 = P[0] - dr * 6 + dr * 12 * k;
    for (let i = 0; i < n; i++) px(x0 + dr * (2 * i - (n - 1)) - 1, P[1] + 8 - Math.round(r * Math.sin(Math.PI * (i + 1) / (n + 1))) - B + 1, C[i % C.length], 2, B);
  } else if (sh === 'pillar') {  // n blocks (2b x b) stack up from the ground under P to r px, ease-out; n <= 8
    const L = Math.max(1, Math.round(r * (1 - (1 - k) * (1 - k))));
    for (let i = 0; i < n; i++) px(P[0] - B, P[1] + 8 - Math.round(L * i / Math.max(1, n - 1)) - B + 1, C[i % C.length], 2 * B, B);
  } else if (sh === 'orbit') {   // n bxb dots on an r by r/2 ellipse round P, turning seg.turns times (default 1), mirrored by side; n <= 8
    const tu = seg.turns == null ? 1 : seg.turns, dr = T[0] >= S[0] ? 1 : -1;
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * (dr * tu * k + i / n + mvVar / (3 * n)); px(P[0] + Math.cos(a) * r - (B - 1) / 2, P[1] - 2 + Math.sin(a) * r * 0.5 - (B - 1) / 2, C[i % C.length], B, B); }
  } else if (sh === 'slash') {   // a corner-to-corner cut over P, mirrored by side: drawn in over the first 60%, wiped over the last 40%; n <= 8
    const d = (seg.dir === 'down' ? 1 : -1) * (T[0] >= S[0] ? 1 : -1);
    for (let i = 0; i < n; i++) {
      const f = n > 1 ? i / (n - 1) : 0;
      if (f > k / 0.6 || f < (k - 0.6) / 0.4) continue;
      px(P[0] - r + 2 * r * f - (B - 1) / 2, P[1] + d * (-r + 2 * r * f) - (B - 1) / 2, C[i % C.length], B, B);
    }
  } else if (sh === 'quake') {   // n 2xb cracks on the ground row, spreading r px each way; rows swap once per 170 ms (flash budget); n <= 8
    const sp = Math.min(1, k * 2), j = Math.floor((t_ms - seg.ms[0]) / MV_BLINK), half = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) { const d = (i % 2 ? 1 : -1) * (1 + r * sp * (Math.floor(i / 2) + 1) / half); px(P[0] + d - 1, P[1] + 9 - ((j + i) % 2) * B, C[i % C.length], 2, B); }
  } else if (sh === 'sparkle') { // b 1 is main's 5-pixel plus; the D829 signature beat draws it in 2 px blocks
    const x = S[0], y = S[1] - 13;
    for (let q = 0; q < 5; q++) px(x + MV_PLUS[q][0] * B - (B - 1) / 2, y + MV_PLUS[q][1] * B - (B - 1) / 2, C[0], B, B);
  }
}
function mvSegK(seg, t) {
  const a = seg.ms[0], b = seg.ms[1];
  if (t < a || t >= b) return -1;
  return (t - a) / (b - a);
}
const MV_POOL = [];
for (let i = 0; i < 24; i++) MV_POOL.push({ on: 0, x: 0, y: 0, w: 1, h: 1, col: 'w' });
let mvPoolN = 0;
function mvPoolReset() { mvPoolN = 0; for (let i = 0; i < 24; i++) MV_POOL[i].on = 0; }
function mvPoolPut(x, y, w, h, col) {
  if (mvPoolN >= 24) return;
  const p = MV_POOL[mvPoolN++];
  p.on = 1; p.x = x; p.y = y; p.w = w; p.h = h; p.col = col; p.sh = mvShadow;
}
function mvPoolDraw(g) {
  g.fillStyle = PAL.k;                                   // MOVE_FX_2 (D826): a 1 px k shadow under each bespoke rect (no extra slot)
  for (let i = 0; i < mvPoolN; i++) { const p = MV_POOL[i]; if (p.on && p.sh) g.fillRect(p.x + 1, p.y + 1, p.w, p.h); }
  for (let i = 0; i < mvPoolN; i++) {
    const p = MV_POOL[i]; if (!p.on) continue;
    g.fillStyle = PAL[p.col] || PAL.w;
    g.fillRect(p.x, p.y, p.w, p.h);
  }
}
const MV_NUM = [{ on: 0 }, { on: 0 }];
let MV_LAST_NUM = [];
function mvNumBoxes() { return MV_LAST_NUM; }
function mvNumTake(who, n, look, t0) {
  let s = MV_NUM[0].on ? MV_NUM[1] : MV_NUM[0];
  if (s.on && MV_NUM[0].who === who) s = MV_NUM[0];
  else if (s.on && MV_NUM[1].who === who) s = MV_NUM[1];
  s.on = 1; s.who = who; s.n = n; s.look = look; s.t0 = t0;
}
function mvNumClear() { MV_NUM[0].on = 0; MV_NUM[1].on = 0; }
function mvNumDraw(g, W, H, vis, centres, t) {
  MV_LAST_NUM = [];
  for (let i = 0; i < 2; i++) {
    const s = MV_NUM[i]; if (!s.on) continue;
    const age = t - s.t0;
    const calm = s.look === 'calm';
    const dur = calm ? 600 : 440;
    if (age < 0) continue; if (age >= dur) { s.on = 0; continue; }
    const sc = (!calm && (s.look === 'crit' || s.look === 'lucky')) ? 2 : 1;
    const rise = calm ? 0 : Math.round(6 * (age / 440));
    const col = s.look === 'super' || s.look === 'lucky' || s.look === 'crit' ? 'y' : (s.look === 'weak' ? 'h' : 'w');
    const alpha = age > dur - 80 ? (dur - age) / 80 : 1;
    const c = centres[s.who] || centres.foe;
    const text = String(s.n);
    const tw = text.length * 4 * sc;
    let x = Math.round(c[0] - tw / 2), y = Math.round(c[1] - 16 - rise);
    const top = Math.max(1, (vis ? vis[1] : 0) + 1);
    const bot = vis ? vis[3] - 5 * sc : H - 1;
    if (y < top) y = top;
    if (y > bot) y = bot;
    g.globalAlpha = alpha;
    mvDigits(g, x, y, text, col, sc);
    g.globalAlpha = 1;
    MV_LAST_NUM.push({ x: x, y: y, text: text, col: col, sc: sc });
  }
}
function mvPoolCount() { return mvPoolN; }
function mvPunchType(type) { return MV_PUNCH.types[type] || MV_PUNCH.types.PLAIN; }
// MOVE_FX_2 (D831): a bespoke row wins over the type row. The merged row is made once per id and kept (no per-frame allocation).
function mvMoveRow(mid) { return (mid && Object.prototype.hasOwnProperty.call(MV_MOVE, mid)) ? MV_MOVE[mid] : null; }
function mvAnim(type, mid) {
  const base = MV_ANIM[type] || MV_ANIM.PLAIN, row = mvMoveRow(mid);
  if (!row) return base;
  if (!row.anim) row.anim = Object.assign({}, base, row.go ? { go: row.go } : {});
  return row.anim;
}
function mvHitRows(type, mid) { const row = mvMoveRow(mid); return (row && row.hit) || mvPunchType(type).hit_v2 || []; }
// D831: the pose, clamped to the MOVES_V2 caps: lunge 6-8 px (main 6), a hop of at most 2 px, a status lift of at most 1 px.
function mvPose(mid) {
  const p = (mvMoveRow(mid) || {}).pose || {};
  return { lunge: Math.max(6, Math.min(8, p.lunge || 6)), hop: Math.max(0, Math.min(2, p.hop || 0)), lift: Math.max(0, Math.min(1, p.lift || 0)) };
}
// D827: one move draws at a time. A new GO or wind-up ends every GO, travel and HIT still drawing, so moves never stack in the pool.
function mvYield(fx) { for (let i = 0; i < fx.length; i++) { const e = fx[i]; if (e.kind === 'mvGo' || e.kind === 'mvHit' || e.kind === 'mvTravel') e.dur = 0; } }
function mvLight(type) { return MV_LIGHT[type] || 'w'; }
function mvStatusRow(effect) {
  const e = effect || {};
  if (e.heal) return MV_STATUS.heal;
  if (e.target === 'foe') return MV_STATUS.foe;
  return MV_STATUS.self;
}
function mvDigits(g, x, y, text, col, sc) {
  const bits = typeof CUE_DIGITS !== 'undefined' ? CUE_DIGITS : [];
  g.fillStyle = PAL.k;
  for (let ci = 0; ci < text.length; ci++) {
    const ch = bits[text.charCodeAt(ci) - 48]; if (!ch) continue;
    for (let b = 0; b < 15; b++) if (ch[b] === '1') {
      const px = x + ci * 4 * sc + (b % 3) * sc, py = y + Math.floor(b / 3) * sc;
      for (let n = 0; n < 8; n++) g.fillRect(px + MV_N8[n][0] * sc, py + MV_N8[n][1] * sc, sc, sc);
    }
  }
  g.fillStyle = PAL[col] || PAL.w;
  for (let ci = 0; ci < text.length; ci++) {
    const ch = bits[text.charCodeAt(ci) - 48]; if (!ch) continue;
    for (let b = 0; b < 15; b++) if (ch[b] === '1') {
      g.fillRect(x + ci * 4 * sc + (b % 3) * sc, y + Math.floor(b / 3) * sc, sc, sc);
    }
  }
}
