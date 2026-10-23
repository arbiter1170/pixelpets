#!/usr/bin/env node
/* RTDB security rules for PLAY_TOGETHER_P1.
   Starts the database emulator (127.0.0.1:9000, project demo-walklings) and
   checks every must-deny case plus the allows. Never talks to walklings-4cc89.
   The /hidden parent is not listable: a holder can read one known blocker key,
   and cannot download the list of people who blocked them. */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const firebase = require('firebase/compat/app');
require('firebase/compat/database');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

const ROOT = path.join(__dirname, '..');
const RULES = fs.readFileSync(path.join(ROOT, 'database.rules.json'), 'utf8');
const TS = firebase.database.ServerValue.TIMESTAMP;
const LOOK = { sk: '3', hr: 'short', hc: 'p', of: 'coat', oc: 't', ac: 'r', ax: 'none' };
const PET = { sp: 'ember', st: 1, lv: 9 };
const CODE = 'AMB4RQ';

const sleep = ms => new Promise(r => setTimeout(r, ms));
function presence(extra) {
  const n = {
    pv: 1, x: 12, y: 8, f: 'l',
    look: Object.assign({}, LOOK), pet: Object.assign({}, PET),
    seals: 1, title: 5, vis: 'a', joined: TS, seen: TS, pt: TS,
  };
  return extra ? Object.assign(n, extra) : n;
}
const room = (uid, area, shard, code) => 'rooms/' + (code || CODE) + '/' + (area || 'hearthmoor') + '/' + (shard || 'r1') + '/' + uid;

function startEmulator() {
  const bin = path.join(ROOT, 'node_modules', '.bin', 'firebase');
  const logPath = path.join(ROOT, 'test-logs', 'rtdb-emulator.log');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const log = fs.openSync(logPath, 'w');
  const child = spawn(bin, ['emulators:start', '--only', 'database', '--project', 'demo-walklings'], {
    cwd: ROOT, detached: true, stdio: ['ignore', log, log], env: Object.assign({}, process.env, { CI: '1' }),
  });
  const kill = () => { try { process.kill(-child.pid, 'SIGTERM'); } catch (e) { try { child.kill('SIGTERM'); } catch (e2) {} } };
  return { child, kill, logPath };
}
function waitForPort(port, timeoutMs) {
  const net = require('net');
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const s = net.connect({ host: '127.0.0.1', port }, () => { s.end(); resolve(); });
      s.on('error', () => {
        if (Date.now() - t0 > timeoutMs) reject(new Error('database emulator did not open port ' + port));
        else setTimeout(tick, 250);
      });
    };
    tick();
  });
}

async function main() {
  const emu = startEmulator();
  let env = null;
  const fails = [];
  const ok = m => process.stdout.write('ok   ' + m + '\n');
  const bad = (m, e) => { fails.push(m + ': ' + (e && e.message ? e.message : e)); process.stdout.write('FAIL ' + m + '\n'); };
  try {
    await waitForPort(9000, 90000);
    env = await initializeTestEnvironment({
      projectId: 'demo-walklings',
      database: { host: '127.0.0.1', port: 9000, rules: RULES },
    });
    const ctx = {};
    const user = uid => {
      const k = uid || '';
      if (!ctx[k]) ctx[k] = uid ? env.authenticatedContext(uid) : env.unauthenticatedContext();
      return ctx[k];
    };
    const refOf = (uid, p) => user(uid).database().ref(p);
    const read = async (uid, p) => (await refOf(uid, p).once('value')).val();
    async function adminSet(p, v) {
      await env.withSecurityRulesDisabled(async c => { await c.database().ref(p).set(v); });
    }
    async function seed() {
      await env.clearDatabase();
      await adminSet('roomCodes/' + CODE, { on: true, made: 1 });
      await adminSet('config/net', { on: true, sendMs: 400, roomMax: 20, roomHardMax: 24, staleMs: 60000, pv: 1 });
    }
    async function deny(label, p) {
      try { await assertFails(p); return true; }
      catch (e) { bad(label, e); return false; }
    }
    async function allow(label, p) {
      try { await assertSucceeds(p); return true; }
      catch (e) { bad(label, e); return false; }
    }
    async function seq(fns) {
      let pass = true;
      for (const fn of fns) if (!await fn()) pass = false;
      return pass;
    }
    const now = () => Date.now();
    function seededNode(extra) {
      const t = now();
      return Object.assign({
        pv: 1, x: 12, y: 8, f: 'l',
        look: Object.assign({}, LOOK), pet: Object.assign({}, PET),
        seals: 1, title: 5, vis: 'a',
        joined: t - 5000, seen: t, pt: t - 1000,
      }, extra || {});
    }

    await seed();

    // 1. any read or write without auth
    {
      await seed();
      const anon = null;
      const checks = [
        () => deny('1 read root', refOf(anon, '/').once('value')),
        () => deny('1 read room', refOf(anon, room('alice')).once('value')),
        () => deny('1 read code', refOf(anon, 'roomCodes/' + CODE).once('value')),
        () => deny('1 write room', refOf(anon, room('alice')).set(presence())),
        () => deny('1 write config', refOf(anon, 'config/net/on').set(false)),
        () => deny('1 read coop', refOf(anon, 'config/coop/on').once('value')),
        () => deny('1 write coop', refOf(anon, 'config/coop/on').set(true)),
        () => deny('1 write friends', refOf(anon, 'friends/alice/bob').set(true)),
      ];
      if (await seq(checks)) ok('deny 1: no auth');
    }

    // 2. listing root, rooms, a code, or roomCodes is denied; one known room code is readable
    {
      await seed();
      const a = 'alice';
      const checks = [
        () => deny('2 root', refOf(a, '/').once('value')),
        () => deny('2 /rooms', refOf(a, 'rooms').once('value')),
        () => deny('2 /rooms/code', refOf(a, 'rooms/' + CODE).once('value')),
        () => deny('2 /roomCodes', refOf(a, 'roomCodes').once('value')),
        () => allow('2 known room code', refOf(a, 'roomCodes/' + CODE).once('value')),
      ];
      if (await seq(checks)) ok('deny 2: no listing codes (known room code key allowed)');
    }

    // 3. writes to /config and /roomCodes
    {
      await seed();
      const a = 'alice';
      const checks = [
        () => deny('3 config', refOf(a, 'config/net').set({ on: false })),
        () => deny('3 config child', refOf(a, 'config/net/on').set(false)),
        () => deny('3 coop', refOf(a, 'config/coop').set({ on: true })),
        () => deny('3 coop child', refOf(a, 'config/coop/on').set(true)),
        () => deny('3 roomCodes', refOf(a, 'roomCodes/ZZZZZZ').set({ on: true })),
        () => deny('3 roomCodes child', refOf(a, 'roomCodes/' + CODE + '/on').set(false)),
        () => allow('3 read config', refOf(a, 'config/net').once('value')),
        () => allow('3 read coop', refOf(a, 'config/coop/on').once('value')),
      ];
      if (await seq(checks)) ok('deny 3: config and roomCodes are console-only');
    }

    // 4. room not on, or a code outside the 6-char alphabet
    {
      await seed();
      await adminSet('roomCodes/ZZZZZZ', { on: false });
      await adminSet('roomCodes/IIIIII', { on: true });
      const a = 'alice';
      const checks = [
        () => deny('4 off', refOf(a, room(a, 'hearthmoor', 'r1', 'ZZZZZZ')).set(presence())),
        () => deny('4 missing', refOf(a, room(a, 'hearthmoor', 'r1', 'ABCDEF')).set(presence())),
        () => deny('4 alphabet', refOf(a, room(a, 'hearthmoor', 'r1', 'IIIIII')).set(presence())),
        () => deny('4 short', refOf(a, room(a, 'hearthmoor', 'r1', 'ABCDE')).set(presence())),
      ];
      if (await seq(checks)) ok('deny 4: closed or illegal room code');
    }

    // 5. another holder's node
    {
      await seed();
      const checks = [
        () => deny('5 write other', refOf('alice', room('bob')).set(presence())),
        () => deny('5 delete other', refOf('alice', room('bob')).set(null)),
      ];
      if (await seq(checks)) ok('deny 5: another holder\'s node');
    }

    // 6. area and shard
    {
      await seed();
      const a = 'alice';
      const checks = [
        () => deny('6 interior', refOf(a, room(a, 'home', 'r1')).set(presence())),
        () => deny('6 town', refOf(a, room(a, 'fernbrook', 'r1')).set(presence())),
        () => deny('6 shard r0', refOf(a, room(a, 'hearthmoor', 'r0')).set(presence())),
        () => deny('6 shard r100', refOf(a, room(a, 'hearthmoor', 'r100')).set(presence())),
        () => deny('6 shard name', refOf(a, room(a, 'hearthmoor', 'room1')).set(presence())),
        () => allow('6 r99', refOf(a, room(a, 'hearthmoor', 'r99')).set(presence())),
        () => allow('6 route1', refOf(a, room(a, 'route1', 'r2')).set(presence())),
      ];
      if (await seq(checks)) ok('deny 6: area and shard');
    }

    // 7. map bounds, non-integers, strings
    {
      await seed();
      const a = 'alice';
      const checks = [
        () => deny('7 hm x', refOf(a, room(a)).set(presence({ x: 24 }))),
        () => deny('7 hm y', refOf(a, room(a)).set(presence({ y: 24 }))),
        () => deny('7 hm neg', refOf(a, room(a)).set(presence({ x: -1 }))),
        () => deny('7 r1 x', refOf(a, room(a, 'route1')).set(presence({ x: 48 }))),
        () => deny('7 r1 y', refOf(a, room(a, 'route1')).set(presence({ y: 20 }))),
        () => deny('7 float', refOf(a, room(a)).set(presence({ x: 1.5 }))),
        () => deny('7 string', refOf(a, room(a)).set(presence({ x: '12' }))),
        () => allow('7 hm edge', refOf(a, room(a)).set(presence({ x: 23, y: 23 }))),
        () => allow('7 r1 edge', refOf(a, room(a, 'route1')).set(presence({ x: 47, y: 19 }))),
      ];
      if (await seq(checks)) ok('deny 7: x/y bounds and types');
    }

    // 8. missing required field, or any unknown field
    {
      await seed();
      const a = 'alice';
      const missing = presence(); delete missing.seals;
      const checks = [
        () => deny('8 missing', refOf(a, room(a)).set(missing)),
        () => deny('8 msg', refOf(a, room(a)).set(presence({ msg: 'hello' }))),
        () => deny('8 name', refOf(a, room(a)).set(presence({ name: 'Mossy' }))),
        () => deny('8 look extra', refOf(a, room(a)).set(presence({ look: Object.assign({ zz: '1' }, LOOK) }))),
        () => deny('8 pet extra', refOf(a, room(a)).set(presence({ pet: Object.assign({ nick: 'Pom' }, PET) }))),
        () => deny('8 emote extra', refOf(a, room(a)).set(presence({ emote: { id: 'e_wave', t: TS, msg: 'hi' } }))),
        () => deny('8 mv', refOf(a, room(a)).set(presence({ mv: 2 }))),
        () => deny('8 busy', refOf(a, room(a)).set(presence({ busy: 3 }))),
        () => deny('8 vis', refOf(a, room(a)).set(presence({ vis: 'solo' }))),
        () => deny('8 facing', refOf(a, room(a)).set(presence({ f: 'left' }))),
      ];
      if (await seq(checks)) ok('deny 8: missing or unknown fields');
    }

    // 9. emote id outside the list
    {
      await seed();
      const a = 'alice';
      await refOf(a, room(a)).set(presence());
      const checks = [
        () => deny('9 hello', refOf(a, room(a)).update({ emote: { id: 'hello', t: TS }, lastEmoteAt: TS })),
        () => deny('9 sentence', refOf(a, room(a)).update({ emote: { id: 'Hi there friend', t: TS }, lastEmoteAt: TS })),
        () => allow('9 wave', refOf(a, room(a)).update({ emote: { id: 'e_wave', t: TS }, lastEmoteAt: TS })),
      ];
      if (await seq(checks)) ok('deny 9: emote id outside the list');
    }

    // 10. emote time must be server now, and 2 s apart
    {
      const a = 'alice';
      await seed();
      await refOf(a, room(a)).set(presence());
      const early = [
        () => deny('10 client time', refOf(a, room(a) + '/emote').set({ id: 'p_hi', t: now() - 3000 })),
        () => deny('10 future', refOf(a, room(a) + '/emote').set({ id: 'p_hi', t: now() + 60000 })),
      ];
      if (!await seq(early)) throw new Error('emote time precheck');
      if (!await allow('10 first', refOf(a, room(a)).update({ emote: { id: 'p_hi', t: TS }, lastEmoteAt: TS }))) throw new Error('first emote');
      if (!await deny('10 gap', refOf(a, room(a)).update({ emote: { id: 'e_heart', t: TS }, lastEmoteAt: TS }))) throw new Error('gap');
      if (!await allow('10 delete emote', refOf(a, room(a) + '/emote').set(null))) throw new Error('delete emote');
      if (!await deny('10 gap after delete', refOf(a, room(a)).update({ emote: { id: 'e_heart', t: TS }, lastEmoteAt: TS }))) throw new Error('gap after delete');
      await sleep(2100);
      if (!await allow('10 after gap', refOf(a, room(a)).update({ emote: { id: 'e_heart', t: TS }, lastEmoteAt: TS }))) throw new Error('after gap');
      ok('deny 10: emote server time and 2 s gap');
    }

    // 11. pt backwards or less than 350 ms
    {
      const a = 'alice';
      await seed();
      const base = seededNode();
      await adminSet(room(a), base);
      const checks = [
        () => deny('11 back', refOf(a, room(a) + '/pt').set(base.pt - 50)),
        () => deny('11 small', refOf(a, room(a) + '/pt').set(base.pt + 200)),
        () => allow('11 same', refOf(a, room(a) + '/pt').set(base.pt)),
        () => allow('11 step', refOf(a, room(a) + '/pt').set(base.pt + 400)),
      ];
      if (await seq(checks)) ok('deny 11: pt throttle');
    }

    // 12. species, stage, level, seals, title, look
    {
      await seed();
      const a = 'alice';
      const badLook = k => { const L = Object.assign({}, LOOK); L[k[0]] = k[1]; return presence({ look: L }); };
      const badPet = k => { const P = Object.assign({}, PET); P[k[0]] = k[1]; return presence({ pet: P }); };
      const goodAx = ax => { const L = Object.assign({}, LOOK); L.ax = ax; return presence({ look: L }); };
      const checks = [
        () => deny('12 species', refOf(a, room(a)).set(badPet(['sp', 'dragon']))),
        () => deny('12 stage', refOf(a, room(a)).set(badPet(['st', 3]))),
        () => deny('12 level 0', refOf(a, room(a)).set(badPet(['lv', 0]))),
        () => deny('12 level 101', refOf(a, room(a)).set(badPet(['lv', 101]))),
        () => deny('12 seals', refOf(a, room(a)).set(presence({ seals: 9 }))),
        () => deny('12 title', refOf(a, room(a)).set(presence({ title: 8 }))),
        () => deny('12 hair', refOf(a, room(a)).set(badLook(['hr', 'mohawk']))),
        () => deny('12 skin', refOf(a, room(a)).set(badLook(['sk', '9']))),
        () => deny('12 outfit', refOf(a, room(a)).set(badLook(['of', 'robe']))),
        () => deny('12 accessory', refOf(a, room(a)).set(badLook(['ax', 'hat']))),
        () => allow('12 lanyard', refOf('lanyard', room('lanyard')).set(goodAx('lanyard'))),
        () => deny('12 colour', refOf(a, room(a)).set(badLook(['hc', 'q']))),
      ];
      if (await seq(checks)) ok('deny 12: pet, seals, title, look');
      const goodPet = sp => { const P = Object.assign({}, PET); P.sp = sp; return presence({ pet: P }); };
      const allows = [
        () => allow('12 skink', refOf('skink', room('skink')).set(goodPet('skink'))),
        () => allow('12 otter', refOf('otter', room('otter')).set(goodPet('otter'))),
        () => allow('12 owl', refOf('owl', room('owl')).set(goodPet('owl'))),
        () => allow('12 snail', refOf('snail', room('snail')).set(goodPet('snail'))),
        () => allow('12 sash', refOf('sash', room('sash')).set(goodAx('sash'))),
        () => allow('12 satchel', refOf('satchel', room('satchel')).set(goodAx('satchel'))),
        () => allow('12 goggles', refOf('goggles', room('goggles')).set(goodAx('goggles'))),
        () => allow('12 beanie', refOf('beanie', room('beanie')).set(goodAx('beanie'))),
      ];
      if (!await seq(allows)) throw new Error('allow 12: hushwater species and wardrobe accessories');
    }

    // 13. joined is write-once; seen must be fresh server time
    {
      const a = 'alice';
      await seed();
      const base = seededNode();
      await adminSet(room(a), base);
      const checks = [
        () => deny('13 joined', refOf(a, room(a) + '/joined').set(base.joined + 1)),
        () => allow('13 joined same', refOf(a, room(a) + '/joined').set(base.joined)),
        () => deny('13 seen old', refOf(a, room(a) + '/seen').set(now() - 11000)),
        () => deny('13 seen future', refOf(a, room(a) + '/seen').set(now() + 60000)),
        () => allow('13 seen now', refOf(a, room(a) + '/seen').set(TS)),
      ];
      if (await seq(checks)) ok('deny 13: joined and seen');
    }

    // 14. friend codes
    {
      await seed();
      const good = 'WLK-ABCD-2345';
      const checks = [
        () => deny('14 code before owner', refOf('alice', 'codes/' + good).set('alice')),
        () => allow('14 owner', refOf('alice', 'codeOwner/alice').set(good)),
        () => allow('14 claim', refOf('alice', 'codes/' + good).set('alice')),
        () => deny('14 second code', refOf('alice', 'codeOwner/alice').set('WLK-WXYZ-6789')),
        () => deny('14 second claim', refOf('alice', 'codes/WLK-WXYZ-6789').set('alice')),
        () => deny('14 second', refOf('bob', 'codes/' + good).set('bob')),
        () => deny('14 value', refOf('alice', 'codes/WLK-WXYZ-6789').set('bob')),
        () => deny('14 pxp', refOf('alice', 'codes/PXP-ABCD-2345').set('alice')),
        () => deny('14 shape', refOf('alice', 'codes/WLK-ABCD2345').set('alice')),
        () => deny('14 letters', refOf('alice', 'codes/WLK-IIII-2222').set('alice')),
        () => deny('14 list', refOf('alice', 'codes').once('value')),
        () => allow('14 read known', refOf('bob', 'codes/' + good).once('value')),
        () => deny('14 anon read', refOf(null, 'codes/' + good).once('value')),
      ];
      if (await seq(checks)) ok('deny 14: friend codes');
    }

    // 15. friends: owner writes; nobody else reads the whole list
    {
      await seed();
      const checks = [
        () => allow('15 add', refOf('alice', 'friends/alice/bob').set(true)),
        () => deny('15 other write', refOf('bob', 'friends/alice/carol').set(true)),
        () => deny('15 self', refOf('alice', 'friends/alice/alice').set(true)),
        () => deny('15 false', refOf('alice', 'friends/alice/carol').set(false)),
        () => deny('15 list', refOf('bob', 'friends/alice').once('value')),
        () => allow('15 one key', refOf('bob', 'friends/alice/bob').once('value')),
        () => deny('15 other key', refOf('carol', 'friends/alice/bob').once('value')),
        () => allow('15 owner list', refOf('alice', 'friends/alice').once('value')),
        () => allow('15 remove', refOf('alice', 'friends/alice/bob').set(null)),
      ];
      if (await seq(checks)) ok('deny 15: friends owner-only');
    }

    // 16. friendInfo is readable only by holders the owner added
    {
      await seed();
      await refOf('alice', 'friendInfo/alice').set({ name: 'Amber', pet: 'Pomlet' });
      const checks = [
        () => deny('16 stranger', refOf('bob', 'friendInfo/alice').once('value')),
        () => deny('16 long', refOf('alice', 'friendInfo/alice/name').set('AmberOtterX')),
        () => deny('16 empty', refOf('alice', 'friendInfo/alice/name').set('')),
        () => deny('16 mark', refOf('alice', 'friendInfo/alice/name').set('A<b>')),
        () => deny('16 extra', refOf('alice', 'friendInfo/alice/code').set('WLK-ABCD-2345')),
        () => allow('16 own', refOf('alice', 'friendInfo/alice/name').set("O'Brien")),
        () => allow('16 pet', refOf('alice', 'friendInfo/alice/pet').set('Pip')),
      ];
      if (!await seq(checks)) throw new Error('friendInfo shape');
      await refOf('alice', 'friends/alice/bob').set(true);
      if (!await allow('16 friend read', refOf('bob', 'friendInfo/alice').once('value'))) throw new Error('friend read');
      if (!await deny('16 still stranger', refOf('carol', 'friendInfo/alice').once('value'))) throw new Error('stranger still');
      const info = await read('bob', 'friendInfo/alice');
      if (!info || info.name !== "O'Brien" || info.pet !== 'Pip') bad('16 value', 'friendInfo did not round-trip');
      else ok('deny 16: friendInfo friends-only, 1-10 safe characters');
    }

    // 17. blocks are owner-only; hidden is written by the blocker and read by the target
    {
      await seed();
      const t = now();
      const checks = [
        () => deny('17 blocks other', refOf('bob', 'blocks/alice/bob').set(t)),
        () => deny('17 blocks list', refOf('bob', 'blocks/alice').once('value')),
        () => deny('17 blocks self', refOf('alice', 'blocks/alice/alice').set(t)),
        () => allow('17 blocks own', refOf('alice', 'blocks/alice/bob').set(t)),
        () => deny('17 hidden writer wrong', refOf('bob', 'hidden/bob/alice').set(t)),
        () => allow('17 hidden write', refOf('alice', 'hidden/bob/alice').set(t)),
        () => deny('17 hidden other reader', refOf('carol', 'hidden/bob/alice').once('value')),
        () => deny('17 hidden blocker read', refOf('alice', 'hidden/bob/alice').once('value')),
        () => allow('17 hidden target key', refOf('bob', 'hidden/bob/alice').once('value')),
        // The list itself must not reveal every block. A known key is the only read.
        () => deny('17 hidden list', refOf('bob', 'hidden/bob').once('value')),
        () => deny('17 hidden root', refOf('bob', 'hidden').once('value')),
        () => allow('17 unblock', refOf('alice', 'hidden/bob/alice').set(null)),
        () => allow('17 unblock mirror', refOf('alice', 'blocks/alice/bob').set(null)),
      ];
      if (await seq(checks)) ok('deny 17: blocks and hidden (list stays closed)');
    }

    // 18. shape, caps, one code, position throttle, emote gap that survives a delete
    {
      await seed();
      const blob = 'x'.repeat(200000);
      const shape = [
        () => deny('18 friend string', refOf('alice', 'friends/alice').set(blob)),
        () => deny('18 info string', refOf('alice', 'friendInfo/alice').set(blob)),
        () => deny('18 block string', refOf('alice', 'blocks/alice').set(blob)),
        () => deny('18 info extra', refOf('alice', 'friendInfo/alice').set({ name: 'Amber', code: 'WLK-ABCD-2345' })),
        () => deny('18 root key', refOf('alice', 'nope').set(1)),
      ];
      if (!await seq(shape)) throw new Error('shape');
      // RTDB rules have no child count, so the 12-slot cap stays in the client.
      // Each key is the other holder's uid: 1-128 letters or digits. A string node and a wild key are refused.
      const t = now();
      const keys = [
        () => allow('18 friend key', refOf('alice', 'friends/alice/bob').set(true)),
        () => deny('18 friend long', refOf('alice', 'friends/alice/' + 'b'.repeat(129)).set(true)),
        () => deny('18 friend mark', refOf('alice', 'friends/alice/bob!').set(true)),
        () => allow('18 block key', refOf('alice', 'blocks/alice/bob').set(t)),
        () => deny('18 block long', refOf('alice', 'blocks/alice/' + 'b'.repeat(129)).set(t)),
        () => deny('18 block mark', refOf('alice', 'blocks/alice/bob!').set(t)),
      ];
      if (!await seq(keys)) throw new Error('keys');
      const a = 'alice';
      await refOf(a, room(a)).set(presence());
      let xDenied = 0;
      for (let i = 0; i < 20; i++) {
        if (await deny('18 x ' + i, refOf(a, room(a)).update({ x: i % 11 }))) xDenied++;
      }
      if (xDenied !== 20) throw new Error('x-only ' + xDenied + ' of 20');
      if (!await allow('18 wave', refOf(a, room(a)).update({ emote: { id: 'e_wave', t: TS }, lastEmoteAt: TS }))) throw new Error('wave');
      if (!await deny('18 drop timer', refOf(a, room(a) + '/lastEmoteAt').set(null))) throw new Error('drop timer');
      if (!await allow('18 clear emote', refOf(a, room(a) + '/emote').set(null))) throw new Error('clear emote');
      if (!await deny('18 emote after clear', refOf(a, room(a)).update({ emote: { id: 'e_heart', t: TS }, lastEmoteAt: TS }))) throw new Error('emote after clear');
      ok('deny 18: shape, caps, throttle, emote gap');
    }

    // Allows: own node create / update / delete, shard read, heartbeat, onDisconnect
    {
      await seed();
      const a = 'alice';
      if (!await allow('own create', refOf(a, room(a)).set(presence({ mv: 1, busy: 0 })))) throw new Error('create');
      const created = await read(a, room(a));
      if (!created || created.pv !== 1 || created.x !== 12) bad('own create value', JSON.stringify(created));
      if (!await allow('shard read', refOf(a, 'rooms/' + CODE + '/hearthmoor/r1').once('value'))) throw new Error('shard');
      if (!await allow('area read', refOf('bob', 'rooms/' + CODE + '/hearthmoor').once('value'))) throw new Error('area');
      if (!await deny('other area', refOf(a, 'rooms/' + CODE + '/fernbrook').once('value'))) throw new Error('other area');
      if (!await allow('heartbeat', refOf(a, room(a) + '/seen').set(TS))) throw new Error('heartbeat');
      const after = await read(a, room(a));
      if (!after || after.pt !== created.pt) bad('heartbeat touched pt', 'pt changed');
      await sleep(400);
      if (!await allow('move', refOf(a, room(a)).update({ x: 13, y: 8, f: 'r', mv: 1, pt: TS, seen: TS }))) throw new Error('move');
      await sleep(400);
      if (!await allow('move again', refOf(a, room(a)).update({ x: 14, pt: TS }))) throw new Error('move again');
      const off = refOf(a, room(a, 'hearthmoor', 'r3'));
      if (!await allow('onDisconnect arm', off.onDisconnect().remove())) throw new Error('arm');
      if (!await allow('onDisconnect write', off.set(presence()))) throw new Error('od write');
      user(a).database().goOffline();
      let gone = false;
      for (let i = 0; i < 20; i++) {
        await sleep(150);
        let v;
        await env.withSecurityRulesDisabled(async c => { v = (await c.database().ref(room(a, 'hearthmoor', 'r3')).once('value')).val(); });
        if (v == null) { gone = true; break; }
      }
      if (!gone) bad('onDisconnect remove', 'node still present after disconnect');
      else ok('allow: own node, shard read, heartbeat, onDisconnect remove');
      user(a).database().goOnline();
      await sleep(200);
      if (!await allow('delete own', refOf(a, room(a)).set(null))) throw new Error('delete');
      if (await read(a, room(a)) != null) bad('delete own', 'node remained');
    }

    // deny 19-24: parties (COOP_R2 §4.4). Creates and updates need config/coop/on. Deletes stay open.
    {
      const before = fails.length;
      const PCODE = 'AMB4RQ', PID = 'pK7QX2M', P = 'parties/' + PCODE + '/' + PID;
      const PPET = { form: 'gust/0', level: 6, hp: 21, mv: 'bump,gust_puff', mood: 9, chip: 1 };
      const member = extra => Object.assign({ joined: TS, seen: TS, away: 0, ready: 1, pet: Object.assign({}, PPET) }, extra || {});
      const party = () => ({ cv: 1, host: 'A', made: TS, area: 'route1', members: { A: member() } });
      const battle = (id, turn) => ({ id, seed: 2918334, kind: 'wild', foes: { 0: { form: 'ember/0', level: 5 } }, turn, deadline: Date.now() + 30000 });
      await env.withSecurityRulesDisabled(async c => {
        await c.database().ref().set({
          config: { coop: { on: true }, net: { pv: 1 } },
          roomCodes: { AMB4RQ: { on: true }, ZZZZZZ: { on: false } },
          friends: { A: { B: true, C: true, D: true, E: true }, B: { A: true }, D: { A: true }, E: { A: true } },
          blocks: { D: { A: Date.now() - 1000 } },
        });
      });
      const R = (uid, p) => refOf(uid, p);

      // deny 19 party node
      await deny('deny 19: B makes a party with host A', R('B', P).set(party()));
      await deny('deny 19: bad party id', R('A', 'parties/' + PCODE + '/pBAD1').set(party()));
      await deny('deny 19: room code that is off', R('A', 'parties/ZZZZZZ/' + PID).set(party()));
      await deny('deny 19: host member missing', R('A', P).set({ cv: 1, host: 'A', made: TS, area: 'route1', members: { B: member() } }));
      await deny('deny 19: cv 2', R('A', P).set(Object.assign(party(), { cv: 2 })));
      await deny('deny 19: area outside rung 2', R('A', P).set(Object.assign(party(), { area: 'fernbrook' })));
      const forgedPath = 'parties/' + PCODE + '/pK7QX2N';
      const forged = () => ({ cv: 1, host: 'A', made: TS, area: 'route1', guest: 'E', members: { A: member(), E: member() } });
      await deny('deny 19: forged single-write party with an uninvited guest', R('A', forgedPath).set(forged()));
      const seated = forged();
      seated.invites = { E: TS };
      await allow('deny 19 allow: host create seats a guest who is invited in the same write', R('A', forgedPath).set(seated));
      await allow('deny 19 allow: host deletes that party', R('A', forgedPath).remove());
      await allow('deny 19 allow: A makes the party', R('A', P).set(party()));
      await deny('deny 19: signed-out read', R(null, P).once('value'));
      await deny('deny 19: B reads before an invite', R('B', P).once('value'));
      await deny('deny 19: nobody lists parties in a code', R('A', 'parties/' + PCODE).once('value'));
      await deny('deny 19: A changes host', R('A', P + '/host').set('B'));
      await deny('deny 19: scene in rung 2', R('A', P + '/scene').set({ id: 'x' }));
      await deny('deny 19: unknown key', R('A', P + '/chat').set('hi'));

      // deny 20 invites and inbox
      await deny('deny 20: invite a one-way friend (C)', R('A', P + '/invites/C').set(TS));
      await deny('deny 20: invite a holder who blocked you (D)', R('A', P + '/invites/D').set(TS));
      await deny('deny 20: guest invites', R('B', P + '/invites/E').set(TS));
      await allow('deny 20 allow: A invites mutual friend B', R('A', P + '/invites/B').set(TS));
      await allow('deny 20 allow: A invites mutual friend E', R('A', P + '/invites/E').set(TS));
      await deny('deny 20: inbox note forged by C', R('C', 'parties/' + PCODE + '/inbox/B/A').set({ pid: PID, at: TS }));
      await deny('deny 20: inbox note for an uninvited holder', R('A', 'parties/' + PCODE + '/inbox/C/A').set({ pid: PID, at: TS }));
      await allow('deny 20 allow: A leaves B an inbox note', R('A', 'parties/' + PCODE + '/inbox/B/A').set({ pid: PID, at: TS }));
      await allow('deny 20 allow: B reads own inbox', R('B', 'parties/' + PCODE + '/inbox/B').once('value'));
      await deny('deny 20: C reads B inbox', R('C', 'parties/' + PCODE + '/inbox/B').once('value'));
      await allow('deny 20 allow: B (invited) reads the party', R('B', P).once('value'));
      await deny('deny 20: C (not invited) reads the party', R('C', P).once('value'));

      // deny 21 join and seat
      await deny('deny 21: B joins without taking the seat', R('B', P + '/members/B').set(member()));
      await deny('deny 21: C takes the seat uninvited', R('C', P + '/guest').set('C'));
      await allow('deny 21 allow: B joins (seat + member in one update)', R('B', P).update({ guest: 'B', 'members/B': member() }));
      await deny('deny 21: E takes a full seat', R('E', P).update({ guest: 'E', 'members/E': member() }));
      await deny('deny 21: E writes a member node', R('E', P + '/members/E').set(member()));
      await deny('deny 21: B writes A member node', R('B', P + '/members/A/away').set(1));
      await allow('deny 21 allow: B marks away', R('B', P + '/members/B').update({ away: 1, awayAt: TS }));
      await allow('deny 21 allow: B back', R('B', P + '/members/B').update({ away: 0, seen: TS }));
      await deny('deny 21: bad move list in pet', R('B', P + '/members/B/pet/mv').set('bump,<b>'));
      await deny('deny 21: level 99', R('B', P + '/members/B/pet/level').set(99));
      await allow('deny 21 allow: E clears own invite (NOT NOW)', R('E', P + '/invites/E').remove());

      // deny 22 battle
      await deny('deny 22: guest writes battle', R('B', P + '/battle').set(battle(1, 1)));
      await allow('deny 22 allow: host opens battle turn 1', R('A', P + '/battle').set(battle(1, 1)));
      await deny('deny 22: deadline 2 min out', R('A', P + '/battle/deadline').set(Date.now() + 120000));
      await allow('deny 22 allow: B acts on turn 1', R('B', P + '/battle/act/1/B').set({ k: 'move', id: 'bump', aim: 0 }));
      await deny('deny 22: B acts twice on turn 1', R('B', P + '/battle/act/1/B').set({ k: 'move', id: 'gust_puff', aim: 0 }));
      await deny('deny 22: B acts on turn 2 early', R('B', P + '/battle/act/2/B').set({ k: 'move', id: 'bump', aim: 0 }));
      await deny('deny 22: B acts for A', R('B', P + '/battle/act/1/A').set({ k: 'move', id: 'bump', aim: 0 }));
      await deny('deny 22: B writes the log', R('B', P + '/battle/log/1').set('[]'));
      await deny('deny 22: act kind befriend', R('A', P + '/battle/act/1/A').set({ k: 'befriend' }));
      await allow('deny 22 allow: host logs turn 1', R('A', P + '/battle/log/1').set('[["s","Wild Ember tries Bump!"]]'));
      await deny('deny 22: log over 2000 chars', R('A', P + '/battle/log/1').set('x'.repeat(2001)));
      await allow('deny 22 allow: host turn 1 to 2', R('A', P + '/battle/turn').set(2));
      await deny('deny 22: host turn 2 to 1 (same battle)', R('A', P + '/battle/turn').set(1));
      await allow('deny 22 allow: B acts on turn 2', R('B', P + '/battle/act/2/B').set({ k: 'swap', id: 'pet3', aim: 0 }));
      await allow('deny 22 allow: host ends', R('A', P + '/battle/end').set({ how: 'win', at: TS }));
      await allow('deny 22 allow: new battle id resets turn to 1', R('A', P + '/battle').set(battle(2, 1)));

      // deny 23 kill switch
      await deny('deny 23: holder flips the kill switch', R('A', 'config/coop/on').set(true));
      await allow('deny 23 allow: holder reads the kill switch', R('B', 'config/coop/on').once('value'));
      await env.withSecurityRulesDisabled(c => c.database().ref('config/coop/on').set(false));
      await deny('deny 23: off, new party', R('A', 'parties/' + PCODE + '/pAAAAAA').set(party()));
      await deny('deny 23: off, member update', R('B', P + '/members/B/seen').set(TS));
      await deny('deny 23: off, act', R('B', P + '/battle/act/1/B').set({ k: 'move', id: 'bump', aim: 0 }));
      await deny('deny 23: off, host battle write', R('A', P + '/battle/turn').set(2));

      // deny 24 deletes stay open when off
      await allow('deny 24 allow: host clears battle', R('A', P + '/battle').remove());
      await allow('deny 24 allow: B leaves (member + seat)', R('B', P).update({ guest: null, 'members/B': null }));
      await allow('deny 24 allow: A clears inbox note', R('A', 'parties/' + PCODE + '/inbox/B/A').remove());
      await deny('deny 24: guest deletes party', R('B', P).remove());
      await allow('deny 24 allow: host deletes party', R('A', P).remove());

      if (fails.length === before) ok('deny 19-24: parties');
    }


    if (fails.length) {
      process.stdout.write('\nRTDB_RULES RESULT: FAIL (' + fails.length + ')\n');
      fails.forEach(f => process.stdout.write('  ' + f + '\n'));
      process.exitCode = 1;
    } else {
      process.stdout.write('\nRTDB_RULES RESULT: PASS\n');
    }
  } catch (e) {
    const tail = (() => { try { return fs.readFileSync(emu.logPath, 'utf8').split('\n').slice(-20).join('\n'); } catch (e2) { return ''; } })();
    process.stdout.write('RTDB_RULES RESULT: FAIL ' + (e && e.stack ? e.stack : e) + '\n');
    if (tail) process.stdout.write(tail + '\n');
    process.exitCode = 1;
  } finally {
    if (env) { try { await env.cleanup(); } catch (e) {} }
    emu.kill();
    await sleep(400);
  }
  process.exit(process.exitCode || 0);
}

main();
