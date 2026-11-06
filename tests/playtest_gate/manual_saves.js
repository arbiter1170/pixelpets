#!/usr/bin/env node
/* PLAYTEST_GATE v0.1 §7 (tests/playtest_gate/PACKET.md): prints a named stage fixture as save JSON for QA to load on a real
   iPhone (M1-M3): in the phone page's Web Inspector console, PixelPets.importSave(<that JSON as a string>). Not a spec; players
   never load this file. Every save is synthetic (starterSave() plus flags), stamped with today's daily flags.
   Usage: node tests/playtest_gate/manual_saves.js <id> */
const F = require('./gate_fixtures');
const { seedRaw } = require('./gate_lib');

const IDS = ['sf_km', 'km_in_town', 'km_stormed', 'km_curfew', 'km_morning'];

function manualSave(id) {
  if (!IDS.includes(id)) throw new Error('unknown manual save ' + id + ' (ids: ' + IDS.join(', ') + ')');
  return seedRaw(F.STAGE[id]());
}

if (require.main === module) {
  const id = process.argv[2];
  if (!IDS.includes(id)) {
    console.error('Usage: node tests/playtest_gate/manual_saves.js <id>\nIds: ' + IDS.join(', '));
    process.exit(2);
  }
  process.stdout.write(manualSave(id) + '\n');
}

module.exports = { IDS, manualSave };
