/* PixelPets - types, battle stats, levels and damage (design spec TYPES_STATS).
   Load after sprites.js and before save.js / game.js. No battles yet: these are the pieces the battle build plugs into.
   - Growth XP (p.xp: care + explore, daily-capped) still drives evolution. Battle XP (p.bx) drives the Level.
   - p.hpNow (optional): current HP; absent = full. 0 = Tired. Regenerates out of battle (regenHp).
   Everything here is pure except regenHp/restHp/carryHpOnEvolve/applyBattleCosts, which mutate the pet they're given. */
'use strict';

// Growth XP a pet needs to evolve from stage 0 / stage 1. Shared by game.js (evolution, HUD) and save.js (defaults).
const EVO_XP = Object.freeze([40, 120]);

const TYPES = ['EMBER', 'TIDE', 'BLOOM', 'STONE', 'VOLT', 'FROST', 'GUST', 'SHADE'];   // 'PLAIN' is move-only
const TYPE_CHART = {               // TYPE_CHART[attacker][defender]; missing entry = 1
  EMBER: { BLOOM: 2, FROST: 2, EMBER: 0.5, TIDE: 0.5 },
  TIDE:  { EMBER: 2, STONE: 2, TIDE: 0.5, BLOOM: 0.5 },
  BLOOM: { TIDE: 2, STONE: 2, BLOOM: 0.5, EMBER: 0.5 },
  STONE: { EMBER: 2, VOLT: 2, STONE: 0.5, SHADE: 0.5 },
  VOLT:  { TIDE: 2, GUST: 2, VOLT: 0.5, STONE: 0 },
  FROST: { BLOOM: 2, GUST: 2, FROST: 0.5, SHADE: 0.5 },
  GUST:  { FROST: 2, SHADE: 2, GUST: 0.5, VOLT: 0.5 },
  SHADE: { VOLT: 2, SHADE: 2, FROST: 0.5, GUST: 0.5 },
};
const typeMult = (atk, def) => (atk === 'PLAIN' || !TYPE_CHART[atk]) ? 1 : (TYPE_CHART[atk][def] ?? 1);
const BASE_STATS = {               // key = form id "<speciesId>/<stage>" (save v2)
  'ember/0': { hp: 42, atk: 57, def: 36, spd: 57 }, 'ember/1': { hp: 56, atk: 76, def: 48, spd: 76 }, 'ember/2': { hp: 70, atk: 95, def: 60, spd: 95 },
  'tide/0':  { hp: 57, atk: 45, def: 51, spd: 39 }, 'tide/1':  { hp: 76, atk: 60, def: 68, spd: 52 }, 'tide/2':  { hp: 95, atk: 75, def: 85, spd: 65 },
  'bloom/0': { hp: 51, atk: 48, def: 45, spd: 48 }, 'bloom/1': { hp: 68, atk: 64, def: 60, spd: 64 }, 'bloom/2': { hp: 85, atk: 80, def: 75, spd: 80 },
  'stone/0': { hp: 51, atk: 51, def: 66, spd: 24 }, 'stone/1': { hp: 68, atk: 68, def: 88, spd: 32 }, 'stone/2': { hp: 85, atk: 85, def: 110, spd: 40 },
  'volt/0':  { hp: 36, atk: 60, def: 30, spd: 66 }, 'volt/1':  { hp: 48, atk: 80, def: 40, spd: 88 }, 'volt/2':  { hp: 60, atk: 100, def: 50, spd: 110 },
  'frost/0': { hp: 63, atk: 42, def: 54, spd: 33 }, 'frost/1': { hp: 84, atk: 56, def: 72, spd: 44 }, 'frost/2': { hp: 105, atk: 70, def: 90, spd: 55 },
  'gust/0':  { hp: 45, atk: 45, def: 39, spd: 63 }, 'gust/1':  { hp: 60, atk: 60, def: 52, spd: 84 }, 'gust/2':  { hp: 75, atk: 75, def: 65, spd: 105 },
  'shade/0': { hp: 39, atk: 63, def: 42, spd: 48 }, 'shade/1': { hp: 52, atk: 84, def: 56, spd: 64 }, 'shade/2': { hp: 65, atk: 105, def: 70, spd: 80 },
};
const STAT_RULES = {
  LEVEL_CAP: 50, STARTER_LEVEL: 5, MIGRATED_LEVEL_MIN: 5, MIGRATED_LEVEL_MAX: 10,
  bxForLevel: L => 4 * (L - 1) ** 2,
  STAGE_MULT: [1, 1.25, 1.5], TRAINER_MULT: 1.5, LEVEL_DIFF: { per: 0.1, min: 0.25, max: 1.5 },
  SAME_TYPE: 1.25, CRIT: { chance: 1 / 16, spiritedChance: 1 / 10, mult: 1.5 }, RAND: [0.90, 1.00], DMG_DIV: 60, GLOW: 1.05,
  MOOD: { hungryAtk: 0.9, sulkySpd: 0.9, drowsyDef: 0.9, low: 25, spirited: 80, glowCare: 75, minBattleNrg: 10 },
  COST: { nrg: 3, food: 2, tiredNrg: 5, winJoy: 3 }, REGEN: { pctPer10Min: 10, restPct: 50 },
  WILD_LEVELS: { proto: [[2, 5], [6, 8]] },   // until spawn tables exist: stage 0 -> 2-5, stage 1+ -> 6-8
};
const BX_CAP = STAT_RULES.bxForLevel(STAT_RULES.LEVEL_CAP);
const statClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const formIdOf = p => p.species + '/' + p.stage;

// §4. Stats of a form at level L (integer, clamped to 1..LEVEL_CAP). null for an unknown form.
function statsAt(formId, L){
  const B = BASE_STATS[formId]; if (!B) return null;
  L = statClamp(Math.floor(L) || 1, 1, STAT_RULES.LEVEL_CAP);
  const s = x => Math.floor(x * (L + 5) / 30) + 5;
  return { hp: Math.floor(B.hp * (L + 5) / 25) + L + 10, atk: s(B.atk), def: s(B.def), spd: s(B.spd) };
}
// §5. Highest level whose threshold is <= bx, computed exactly with integers (no float sqrt).
function levelOf(p){
  const bx = p && Number.isFinite(p.bx) ? p.bx : 0;
  let L = 1; while (L < STAT_RULES.LEVEL_CAP && STAT_RULES.bxForLevel(L + 1) <= bx) L++;
  return L;
}
// Level a pet from an old save starts at (when it has no bx yet): its old display level, kept within 5..10.
const migratedLevel = xp => statClamp(1 + Math.floor((Number.isFinite(xp) && xp > 0 ? xp : 0) / 10), STAT_RULES.MIGRATED_LEVEL_MIN, STAT_RULES.MIGRATED_LEVEL_MAX);
// Proto-map wild level for a form stage (rng injectable).
function wildLevel(stage, rng = Math.random, map = 'proto'){
  const t = STAT_RULES.WILD_LEVELS[map] || STAT_RULES.WILD_LEVELS.proto, [a, b] = t[Math.min(stage, t.length - 1)];
  return a + Math.floor(rng() * (b - a + 1));
}
// §5. Battle XP for one defeated (or befriended) foe, for one participant.
function battleXpAward({ Lf, Lown, foeStage = 0, trainer = false }){
  const R = STAT_RULES, d = R.LEVEL_DIFF;
  return Math.round((4 + 2.5 * Lf) * R.STAGE_MULT[foeStage] * (trainer ? R.TRAINER_MULT : 1) * statClamp(1 + d.per * (Lf - Lown), d.min, d.max));
}

// §7. Mood from care stats (read at the start of each battle turn).
function moodOf(p){
  const M = STAT_RULES.MOOD, care = Math.round((p.hunger + p.happy + p.energy) / 3);   // same as game.js care()
  return { hungry: p.hunger < M.low, sulky: p.happy < M.low, drowsy: p.energy < M.low, spirited: p.happy >= M.spirited, glowing: care >= M.glowCare };
}
const MOOD_STAT = { atk: ['hungry', 'hungryAtk'], def: ['drowsy', 'drowsyDef'], spd: ['sulky', 'sulkySpd'] };
// Effective stat of a battler: mood modifier (and a stat-stage multiplier later), floored, min 1.
function effStat(b, k, stageMult = 1){
  const m = MOOD_STAT[k], mod = m && b.mood && b.mood[m[0]] ? STAT_RULES.MOOD[m[1]] : 1;
  return Math.max(1, Math.floor(b[k] * mod * stageMult));
}
const maxHpOf = p => { const s = statsAt(formIdOf(p), levelOf(p)); return s ? s.hp : 1; };
const hpOf = p => Number.isFinite(p.hpNow) ? Math.min(p.hpNow, maxHpOf(p)) : maxHpOf(p);
const isTired = p => Number.isFinite(p.hpNow) && p.hpNow <= 0;
// §7. Can be sent out: has HP and NRG >= 10.
const canBattle = p => !!p && !isTired(p) && p.energy >= STAT_RULES.MOOD.minBattleNrg;
// A battle-ready snapshot of a pet: {form, species, stage, type, level, maxHp, hp, atk, def, spd, mood}.
function battlerOf(p){
  const form = formIdOf(p), level = levelOf(p), s = statsAt(form, level) || { hp: 1, atk: 1, def: 1, spd: 1 };
  const sp = SPECIES.find(x => x.id === p.species);
  return { form, species: p.species, stage: p.stage, type: sp ? sp.type : 'PLAIN', level, maxHp: s.hp, hp: hpOf(p), atk: s.atk, def: s.def, spd: s.spd, mood: moodOf(p) };
}
// §6. att/def are battlers (battlerOf, or any {type, level, atk, def, mood}). rng is called twice: crit roll, then random roll.
function damage({ power, moveType, att, def, rng = Math.random }){
  const R = STAT_RULES, mult = typeMult(moveType, def.type);
  if (mult === 0) return { dmg: 0, mult: 0, crit: false };
  const A = effStat(att, 'atk'), D = effStat(def, 'def');
  const base = power * (A / D) * (att.level + 10) / R.DMG_DIV;
  const same = moveType !== 'PLAIN' && moveType === att.type ? R.SAME_TYPE : 1;
  const crit = rng() < (att.mood && att.mood.spirited ? R.CRIT.spiritedChance : R.CRIT.chance);
  const rand = R.RAND[0] + (R.RAND[1] - R.RAND[0]) * rng();
  const glow = att.mood && att.mood.glowing ? R.GLOW : 1;
  return { dmg: Math.max(1, Math.floor(base * mult * same * (crit ? R.CRIT.mult : 1) * glow * rand)), mult, crit };
}

// §7. HP comes back at 10% of max per 10 real minutes out of battle (full in 100 min). Separate from care decay.
function regenHp(p, sec){
  if (!Number.isFinite(p.hpNow) || !(sec > 0)) return;
  const max = maxHpOf(p), hp = Math.min(max, p.hpNow + max * STAT_RULES.REGEN.pctPer10Min / 100 * sec / 600);
  if (hp >= max - 1e-9) delete p.hpNow; else p.hpNow = hp;
}
// REST: +50% of max HP, clears Tired. Returns true if it healed anything.
function restHp(p){
  if (!Number.isFinite(p.hpNow)) return false;
  const max = maxHpOf(p), hp = p.hpNow + max * STAT_RULES.REGEN.restPct / 100;
  if (hp >= max) delete p.hpNow; else p.hpNow = hp;
  return true;
}
// Evolution: call with the max HP from before the stage change; keeps the same % of the new max, rounded up.
function carryHpOnEvolve(p, oldMax){
  if (!Number.isFinite(p.hpNow)) return;
  const max = maxHpOf(p), hp = Math.ceil(p.hpNow / oldMax * max);
  if (hp >= max) delete p.hpNow; else p.hpNow = hp;
}
// §7 battle costs, applied once when a battle ends (for the battle build). Never touches xp/cx/ex.
function applyBattleCosts(p, { tired = false, won = false } = {}){
  const C = STAT_RULES.COST, c = v => statClamp(v, 0, 100);
  p.energy = c(p.energy - C.nrg - (tired ? C.tiredNrg : 0)); p.hunger = c(p.hunger - C.food);
  if (won) p.happy = c(p.happy + C.winJoy);
}
// Dev check: every SPECIES form needs base stats.
function statsDevCheck(){
  const missing = [];
  SPECIES.forEach(sp => sp.stages.forEach((st, k) => { if (!BASE_STATS[sp.id + '/' + k]) missing.push(sp.id + '/' + k); }));
  if (missing.length) console.error('PixelPets: BASE_STATS has no entry for', missing.join(', '));
  return missing;
}
