/* Walklings Play together, Phase 1 (PLAY_TOGETHER_P1). See other holders in Hearthmoor and on Route 1.
   OFF unless PPCloud is on. No firebase-database.js import and no socket until a room code is set.
   Room nodes never carry a name, a place, or any free text. Device key pixelpets.net stays out of the save. */
'use strict';
const PPNet = (() => {
  const off = Object.freeze({
    enabled: false,
    start() {},
    overlayOpen() { return false; },
    tapTile() { return false; },
    mapEnts() { return []; },
    drawFx() {},
    renderFriends() {},
    coopOn() { return false; },
    coop: null,
    debug() { return null; },
  });
  // PPCloud is a script binding, not a window property. enabled is false unless a config or ?cloud=emu is on.
  if (typeof PPCloud === 'undefined' || !PPCloud.enabled) { window.PPNet = off; return off; }

  /* D208 tech defaults. Yellow calls D200–D207 sit on these flags (settled on the packet defaults). */
  const NET_CFG = {
    pv: 1, sendMs: 400, heartbeatMs: 20000, staleMs: 60000,
    roomMax: 20, roomHardMax: 24, emoteGapMs: 2000, bubbleMs: 4000, balloonMs: 3000,
    interiorOfflineMs: 30000, hiddenOfflineMs: 60000, retryMs: [30000, 120000, 600000],
    friendNick: true, needCode: true, friendSlots: 12, shareName: true, cardFaction: false, report: false,
    hiddenPollMs: 30000, socialPollMs: 60000,
  };
  // Client half of the co-op switch (COOP_R2 §2.2). Defaults on for everyone.
  // ?coop=0 is an off override and wins, including on the local emulator.
  // COOP_CFG.on stays that computed flag.
  const COOP_CFG = {
    cv: 1,
    on: (() => {
      try { if (new URLSearchParams(location.search).get('coop') === '0') return false; } catch (e) {}
      // On for everyone. The local emulator stays on the same way, unless ?coop=0 already won.
      return true;
    })(),
    graceMs: 60000, joinTiles: 6, joinBubbleMs: 8000, inviteMs: 30000, replaySlackMs: 3000,
    areas: ['hearthmoor', 'route1'],
  };
  Object.freeze(COOP_CFG.areas);
  Object.freeze(COOP_CFG);
  // D326–D333 settled by Vincent on Oct 20, 2026, 12:55 PM ET, on the defaults ("Turn on for everyone"). D332 is rung 3 and is not in this object.
  const COOP_VOTE = {
    label: 'GROUP',
    maxMembers: 2,
    invite: { mutual: true, sameCode: true, notSolo: true, notNowMute: 3, blockEnds: true },
    wild: '2v1', holder: '2v1-in-order', tag: false,
    turnMs: 30000, autoPick: 'last-then-first',
    reward: { guestXp: true, guestCosts: true, befriend: 'host', cheerWidth: 0.05, acorns: 'host', trainerFlag: 'host' },
    rejoin: true, idleMs: 300000,
  };
  Object.freeze(COOP_VOTE.invite);
  Object.freeze(COOP_VOTE.reward);
  Object.freeze(COOP_VOTE);
  const COOP_TEXT = {
    walk: 'WALK TOGETHER', join: 'JOIN', notNow: 'NOT NOW', leave: 'LEAVE GROUP', rejoin: 'REJOIN',
    ask: holder => 'Walk with ' + holder + '?',
    together: "You're walking together!",
    joined: holder => holder + ' joined the group.',
    home: holder => holder + ' headed home.',
    away: holder => holder + ' is away.',
  };
  const NET_TEXT = {
    card_title: 'HOLDER', friend_tag: 'FRIEND', btn_wave: 'WAVE', btn_mute: 'MUTE', btn_unmute: 'UNMUTE',
    btn_block: 'BLOCK', btn_close: 'CLOSE', toast_blocked: 'Blocked. UNDO', toast_muted: 'Muted.',
    code_bad: "That code isn't open.", code_ok: 'Joined. Say hi!', solo_status: 'Solo for now',
    friend_added: 'Added. Waiting for them.', friend_mutual: 'You are friends now!',
    friend_none: 'No holder with that code.', friend_full: 'Friend list is full.',
    wheel_emotes: 'EMOTES', wheel_phrases: 'PHRASES', fr_label: 'HOLDER', fr_code: 'YOUR HOLDER CODE',
    fr_add: 'ADD A FRIEND', fr_btn: 'ADD', fr_list: 'FRIEND LIST', fr_wait: 'waiting', fr_remove: 'REMOVE',
    fr_near: 'Nearby', set_section: 'PLAY TOGETHER', set_show: 'Show other holders', set_code: 'Room code',
    set_blocked: 'Blocked holders', set_unblock: 'UNBLOCK', set_enter: 'ENTER', set_join: 'JOIN', set_leave: 'LEAVE',
    val_on: 'ON', val_friends: 'FRIENDS', val_solo: 'SOLO', say_btn: 'SAY', say_title: 'SAY SOMETHING', show_off: 'Show off',
    card_hint: "Names stay hidden until you're friends.",
    card_footer: 'Block hides you both, for good. Undo in Settings.',
    set_hint: 'Only your spot in the Amberwild is shared. Never your real place.',
    fr_note: 'Friends see your name. Others see a made-up one.',
    tap_switch: 'Tap to switch:',
  };
  const ADJ = ['Mossy','Amber','Sunny','Misty','Quiet','Brave','Cozy','Dewy','Ferny','Pebbly','Breezy','Starry','Rosy','Hazy','Mellow','Nimble','Plucky','Gentle','Cheery','Rustly','Twinkly','Snug','Merry','Clover','Maple','Hazel','Thistle','Puddly','Leafy','Drowsy','Bouncy','Woolly'];
  const NOUN = ['Rambler','Wanderer','Strider','Hiker','Rover','Roamer','Trekker','Stroller','Forager','Drifter','Pathfinder','Tracker','Ambler','Voyager','Sprout','Pinecone','Acorn','Sparrow','Otter','Badger','Wren','Finch','Hedgehog','Moth','Toadstool','Puffin','Squirrel','Robin','Beetle','Lark','Newt','Fawn'];
  const TITLES = ['New Holder','Path Finder','Kind Hand','Wild Friend','Page Turner','Seal Holder','Amberwild Regular','Trail Veteran'];
  const EMOTES = [
    { id: 'e_clap', label: 'Clap', glyph: 'emote_clap' }, { id: 'e_wave', label: 'Wave', glyph: 'emote_wave' }, { id: 'e_heart', label: 'Heart', glyph: 'emote_heart' },
    { id: 'e_zz', label: 'Zz', glyph: 'emote_sleep' }, { id: 'e_trick', label: 'Show off', glyph: '' }, { id: 'e_bang', label: '!', glyph: 'emote_bang' },
    { id: 'e_dots', label: '...', glyph: 'emote_dots' }, { id: 'e_laugh', label: 'Ha!', glyph: 'emote_laugh' }, { id: 'e_ask', label: '?', glyph: 'emote_ask' },
  ];
  const PHRASES = [
    { id: 'p_hi', text: 'Hi there!' }, { id: 'p_nice', text: 'Nice Walkling!' }, { id: 'p_follow', text: 'Follow me!' }, { id: 'p_over', text: 'Over here!' },
    { id: 'p_thanks', text: 'Thank you!' }, { id: 'p_luck', text: 'Good luck out there!' }, { id: 'p_brb', text: 'Back soon!' }, { id: 'p_bye', text: 'See you around!' },
    { id: 'p_snack', text: 'Snack break!' }, { id: 'p_glow', text: 'Look at that glow!' }, { id: 'p_seal', text: 'I got a Seal!' }, { id: 'p_wild', text: 'Wilds are busy today.' },
    { id: 'p_lantern', text: 'Meet at the lanterns!' }, { id: 'p_route', text: 'Off to Route 1!' }, { id: 'p_cozy', text: 'So cozy here.' }, { id: 'p_walk', text: 'What a walk!' },
  ];
  const AREAS = { hearthmoor: { w: 24, h: 34 }, route1: { w: 48, h: 20 } };
  const FACE = { up: 'u', down: 'd', left: 'l', right: 'r' };
  const FACE_BACK = { u: 'up', d: 'down', l: 'left', r: 'right' };
  const BEHIND = { u: [0, 1], d: [0, -1], l: [1, 0], r: [-1, 0] };
  const ALPHA = /^[A-HJ-NP-Z2-9]{6}$/;
  const BAD = /ass|butt|poo|pee|fart|damn|hell|kill|dead|die|sex|drug|gun|fat|ugly|stupid|dumb|idiot|hate|nazi|slave/i;
  const NET_KEY = 'pixelpets.net';
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  let H = null, rtdb = null, db = null, me = null, ready = false, link = 'down';
  let cfg = Object.assign({ on: true }, NET_CFG);
  let writes = 0, reads = 0, coolUntil = 0, localEmote = null, infoOnce = false, retries = 0, giveUp = false, nextRetryMs = 0;
  let retryTimer = 0, offTimer = 0, repairAt = 0, pumping = false, pumpAgain = false;
  let cfgUnsub = null, coopFlag = false, pollAt = 0, socialAt = 0;
  let mineList = {};
  const coop = { cfg: COOP_CFG, vote: COOP_VOTE, unsub: null };
  const party = {
    code: null, pid: null, host: null, at: 0, role: null, data: null, ref: null,
    unsub: null, inboxUnsub: null, inboxPath: '', offsetUnsub: null, offset: 0, offsetSet: false,
    ask: null, askTimer: 0, notNow: {}, muted: {}, known: {}, wasAway: {}, knownNote: {},
    leaving: false, solo: false, dropping: {}, saw: false, recentDrop: 0,
  };
  let page = 0, wheelOn = false, cardOn = false, codeOn = false, blockOn = false;
  let undoTimer = 0, undoUid = null, undoFriend = false, hiTimer = 0, hiPending = false;
  let writeQ = Promise.resolve();
  const others = new Map();
  let mutual = {}, names = {}, blocks = {}, hidden = {};
  let unsubs = [];
  const placed = { ref: null, path: '', area: null, shard: null, pinned: false, joined: 0, code: null };
  let wiredLook = '';
  const sent = { x: null, y: null, f: null, mv: null, at: 0 };
  let dev = readDev();

  function dev0(){ return { code: null, mutes: {}, blocks: {}, lastRoom: {}, status: 'off', later: { contacts: null, mail: null, phoneBadge: null } }; }
  function readDev(){
    let o = null; try { o = JSON.parse(localStorage.getItem(NET_KEY)); } catch (e) {}
    const d = Object.assign(dev0(), o && typeof o === 'object' ? o : {});
    d.mutes = d.mutes && typeof d.mutes === 'object' ? d.mutes : {};
    d.blocks = d.blocks && typeof d.blocks === 'object' ? d.blocks : {};
    d.lastRoom = d.lastRoom && typeof d.lastRoom === 'object' ? d.lastRoom : {};
    d.later = Object.assign({ contacts: null, mail: null, phoneBadge: null }, d.later || {});
    d.party = partyOk(d.party) ? { code: d.party.code, pid: d.party.pid, host: d.party.host, at: d.party.at } : null;
    return d;
  }
  function partyOk(p){
    return !!(p && typeof p === 'object' && ALPHA.test(p.code) && /^p[A-HJ-NP-Z2-9]{6}$/.test(p.pid) && /^[A-Za-z0-9]{1,128}$/.test(String(p.host || '')) && typeof p.at === 'number');
  }
  function writeDev(){ try { localStorage.setItem(NET_KEY, JSON.stringify(dev)); } catch (e) {} }
  function setStatus(s){ dev.status = s; writeDev(); paintStatus(); }
  function fnv1a32(s){
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function nameFor(uid){
    const h = fnv1a32(String(uid || ''));
    return ADJ[h % 32] + ' ' + NOUN[(h >>> 8) % 32];
  }
  function safeText(s){
    if (!NET_CFG.shareName || typeof s !== 'string') return '';
    const t = Array.from(s.trim()).slice(0, 10).join('');
    if (!/^[A-Za-z0-9][A-Za-z0-9 '.-]{0,9}$/.test(t)) return '';
    if (BAD.test(t)) return '';
    return t;
  }
  function myTitle(){
    const seen = H.seenCount(), bond = H.bond(), n = H.befriended(), seals = H.seals();
    let id = 0;
    if (seen >= 5) id = 1;
    if (bond >= 3) id = Math.max(id, 2);
    if (n >= 5) id = Math.max(id, 3);
    if (seen >= 20) id = Math.max(id, 4);
    if (seals >= 1) id = Math.max(id, 5);
    if (n >= 15) id = Math.max(id, 6);
    if (seals >= 2) id = 7;
    return id;
  }
  function mode(){ const m = H.showOthers(); return m === 'friends' || m === 'solo' ? m : 'on'; }
  function showCode(code){ return code ? code.slice(0, 3) + '-' + code.slice(3) : ''; }
  function normRoom(raw){
    const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return ALPHA.test(s) ? s : '';
  }
  function normFriend(raw){
    let s = String(raw || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (s.startsWith('PXP-')) s = 'WLK-' + s.slice(4);
    return /^WLK-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(s) ? s : '';
  }
  function clampLook(look){
    const L = Object.assign({}, KEEPER_LOOKS.defaults, look || {});
    const map = [['skin','sk'],['hair','hr'],['hairCol','hc'],['outfit','of'],['outfitCol','oc'],['accent','ac'],['accessory','ax']];
    const out = {};
    for (const [src, dst] of map) out[dst] = KEEPER_LOOKS[src].includes(L[src]) ? L[src] : KEEPER_LOOKS.defaults[src];
    return out;
  }
  function lookBack(node){
    const L = (node && node.look) || {};
    const wire = clampLook({ skin: L.sk, hair: L.hr, hairCol: L.hc, outfit: L.of, outfitCol: L.oc, accent: L.ac, accessory: L.ax });
    return { skin: wire.sk, hair: wire.hr, hairCol: wire.hc, outfit: wire.of, outfitCol: wire.oc, accent: wire.ac, accessory: wire.ax };
  }
  function fresh(seen){ return typeof seen === 'number' && Date.now() - seen <= cfg.staleMs; }
  function inRoom(){ return !!(placed.ref && placed.shard); }
  function noteInfo(){
    if (infoOnce) return;
    infoOnce = true;
    console.info('Walklings: playing solo. The shared walk is not reachable.');
  }

  function start(hooks){
    H = hooks;
    dev = readDev();
    buildSettings();
    buildSay();
    buildSheets();
    wireFriends();
    const note = document.querySelector('#frNote');
    if (note) note.textContent = NET_TEXT.fr_note;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) markAwayNow();
      else { markBack(); onForeground(); }
      pump();
    });
    window.addEventListener('pageshow', () => { if (!document.hidden) { markBack(); onForeground(); } pump(); });
    window.addEventListener('pagehide', () => {
      markAwayNow();
      if (placed.ref && rtdb) { try { rtdb.remove(placed.ref); } catch (e) {} }
    });
    wireAsk();
    // Read a saved party. B1 does not rejoin; Build 3 owns REJOIN.
    PPCloud.onReady(user => { me = user && user.uid; ready = !!me; pump(); });
    setInterval(tick, 100);
    paintChrome();
  }

  async function connect(){
    if (!rtdb) {
      rtdb = await import(PPCloud.CDN + 'firebase-database.js');
      db = rtdb.getDatabase(PPCloud.app());
    }
    rtdb.goOnline(db);
    link = 'up';
    armCfg();
    armCoop();
    armOffset();
    if (inParty()) { watchParty(); syncInbox(); }
  }
  function offline(){
    disarmCfg();
    disarmCoop();
    disarmInbox();
    unwatchParty();
    disarmOffset();
    if (db && rtdb) { try { rtdb.goOffline(db); } catch (e) {} }
    link = 'down';
  }
  function TS(){ return rtdb.serverTimestamp(); }
  function ref(path){ return rtdb.ref(db, path); }
  function dbGet(node){ reads++; return rtdb.get(node); }

  function clearOff(){ if (offTimer) { clearTimeout(offTimer); offTimer = 0; } }
  function armOff(ms){
    clearOff();
    offTimer = setTimeout(() => { offTimer = 0; offline(); }, ms);
  }
  async function unlisten(){
    unsubs.forEach(fn => { try { fn(); } catch (e) {} });
    unsubs = [];
  }
  async function dropNode(){
    await unlisten();
    const node = placed.ref;
    wiredLook = '';
    placed.ref = null; placed.path = ''; placed.area = null; placed.shard = null; placed.pinned = false;
    others.clear();
    if (node && rtdb) {
      try { await rtdb.onDisconnect(node).cancel(); } catch (e) {}
      try { await rtdb.remove(node); } catch (e) {}
    }
    paintChrome();
  }

  function body(extra){
    const p = H.pos();
    const pet = H.partner();
    const face = FACE[p.facing] || 'd';
    const node = {
      pv: cfg.pv, x: p.x | 0, y: p.y | 0, f: face, mv: H.walking() ? 1 : 0,
      look: clampLook(H.look()),
      pet: { sp: pet.species, st: pet.stage | 0, lv: Math.max(1, Math.min(100, pet.level | 0)) },
      seals: Math.max(0, Math.min(8, H.seals() | 0)),
      title: myTitle(),
      vis: mode() === 'friends' ? 'f' : 'a',
      seen: TS(), pt: TS(),
    };
    return Object.assign(node, extra || {});
  }
  function tileOk(area, x, y){
    const a = AREAS[area];
    return a && x >= 0 && y >= 0 && x < a.w && y < a.h;
  }

  function applyCfg(v){
    cfg = Object.assign({ on: true }, NET_CFG);
    if (v && typeof v === 'object') {
      cfg.on = v.on !== false;
      ['sendMs', 'roomMax', 'roomHardMax', 'staleMs', 'pv', 'hiddenPollMs', 'socialPollMs'].forEach(k => { if (typeof v[k] === 'number' && v[k] > 0) cfg[k] = v[k]; });
    }
    return cfg.on;
  }
  async function loadCfg(){
    const snap = await dbGet(ref('config/net'));
    return applyCfg(snap.val());
  }
  function armCfg(){
    if (cfgUnsub || !db) return;
    cfgUnsub = rtdb.onValue(ref('config/net'), snap => {
      try {
        if (!applyCfg(snap.val()) && inRoom()) fail();
      } catch (e) {}
    }, () => { if (inRoom()) fail(); });
  }
  function disarmCfg(){
    if (cfgUnsub) { try { cfgUnsub(); } catch (e) {} cfgUnsub = null; }
  }
  function armCoop(){
    if (coop.unsub || !db) return;
    // seen stays on this subscription. disarmCoop (tab foreground) must not look like the kill switch.
    let seen = false;
    coop.unsub = rtdb.onValue(ref('config/coop/on'), snap => {
      try {
        const next = snap.val() === true;
        if (seen && coopFlag && !next && (inParty() || party.ask)) onSwitchOff();
        coopFlag = next;
        seen = true;
        if (next) flushHeld();
        renderStrip();
      } catch (e) { coopFlag = false; }
    }, () => { coopFlag = false; });
  }
  function disarmCoop(){
    if (coop.unsub) { try { coop.unsub(); } catch (e) {} coop.unsub = null; }
    coopFlag = false;
  }
  // Both halves: the client half (on unless ?coop=0) and /config/coop/on === true.
  function coopOn(){ return COOP_CFG.on === true && coopFlag === true; }
  function onForeground(){
    if (!db || !rtdb || document.hidden || !me) return;
    const bounce = !placed.ref && link === 'up';
    disarmCfg();
    disarmCoop();
    if (bounce) {
      try { rtdb.goOffline(db); } catch (e) {}
      try { rtdb.goOnline(db); } catch (e) {}
    }
    if (link !== 'up') return;
    armCfg();
    armCoop();
    refreshSocial().catch(() => {});
  }
  function enqueue(fn){
    const run = writeQ.then(fn, fn);
    writeQ = run.then(() => {}, () => {});
    return run;
  }
  function emotePatch(id){
    return { emote: { id, t: TS() }, lastEmoteAt: TS(), seen: TS() };
  }
  async function ensureIdentity(){
    const code = H.friendCode();
    const owner = ref('codeOwner/' + me);
    const owned = await dbGet(owner);
    if (!owned.exists()) {
      try { await rtdb.set(owner, code); } catch (e) {}
    }
    const use = (await dbGet(owner)).val();
    if (use === code) {
      const cur = await dbGet(ref('codes/' + code));
      if (!cur.exists()) {
        try { await rtdb.set(ref('codes/' + code), me); } catch (e) {}
      }
    }
    if (!NET_CFG.shareName) return;
    const info = {};
    const name = safeText(H.playerName());
    const nick = safeText(H.partner() && H.partner().nick);
    if (name) info.name = name;
    if (nick) info.pet = nick;
    if (name || nick) await rtdb.update(ref('friendInfo/' + me), info);
  }
  async function refreshSocial(){
    socialAt = Date.now();
    const mine = (await dbGet(ref('friends/' + me))).val() || {};
    const listed = {}, next = {}, info = {};
    Object.keys(mine).forEach(uid => { if (mine[uid] === true) listed[uid] = true; });
    await Promise.all(Object.keys(listed).map(async uid => {
      const back = await dbGet(ref('friends/' + uid + '/' + me));
      if (back.val() !== true) return;
      next[uid] = true;
      if (NET_CFG.shareName) {
        const snap = await dbGet(ref('friendInfo/' + uid));
        if (snap.exists() && snap.val()) info[uid] = snap.val();
      }
    }));
    mineList = listed;
    mutual = next;
    names = info;
    const blk = (await dbGet(ref('blocks/' + me))).val() || {};
    blocks = blk && typeof blk === 'object' ? blk : {};
    dev.blocks = Object.assign({}, blocks);
    writeDev();
    const fr = document.querySelector('#phoneFriends');
    if (fr && !fr.hidden) paintFriendRows(Object.keys(mineList));
  }
  function pollSocial(){
    if (link !== 'up' || !me || Date.now() - socialAt < cfg.socialPollMs) return;
    return refreshSocial().catch(() => {});
  }
  async function advancePolls(){
    socialAt = Date.now() - cfg.socialPollMs;
    pollAt = Date.now() - cfg.hiddenPollMs;
    await pollHidden();
    await pollSocial();
  }
  async function pollHidden(){
    if (link !== 'up' || !me || !inRoom() || Date.now() - pollAt < cfg.hiddenPollMs) return;
    pollAt = Date.now();
    const ids = [];
    others.forEach((_, uid) => ids.push(uid));
    const hid = await probeHidden(ids);
    ids.forEach(uid => { if (hid[uid]) hidden[uid] = true; else delete hidden[uid]; });
  }

  function countLive(tree, skip){
    const by = {};
    const nowIds = [];
    Object.keys(tree || {}).forEach(shard => {
      if (!/^r[1-9][0-9]?$/.test(shard)) return;
      by[shard] = [];
      Object.keys(tree[shard] || {}).forEach(uid => {
        const n = tree[shard][uid];
        if (!n || n.pv !== cfg.pv || !fresh(n.seen) || n.busy) return;
        if (skip[uid] || blocks[uid] || hidden[uid]) return;
        by[shard].push({ uid, joined: n.joined || 0, n });
        nowIds.push(uid);
      });
    });
    return { by, nowIds };
  }
  function pickShard(by, opt){
    const shards = Object.keys(by).filter(s => s !== (opt && opt.exclude)).sort((a, b) => (+a.slice(1)) - (+b.slice(1)));
    if (!(opt && opt.noPin)) {
      for (const s of shards) {
        const bucket = by[s] || [];
        if (bucket.length >= cfg.roomHardMax) continue;
        if (bucket.some(row => mutual[row.uid])) return { shard: s, pinned: true };
      }
    }
    for (const s of shards) if ((by[s] || []).length < cfg.roomMax) return { shard: s, pinned: false };
    let n = 1;
    const used = new Set(Object.keys(by).concat(opt && opt.exclude ? [opt.exclude] : []));
    while (used.has('r' + n) && n < 99) n++;
    return { shard: 'r' + n, pinned: false };
  }

  async function place(area, choice){
    const code = dev.code;
    const path = 'rooms/' + code + '/' + area + '/' + choice.shard + '/' + me;
    const node = ref(path);
    const p = H.pos();
    if (!tileOk(area, p.x | 0, p.y | 0) || !H.partner()) return;
    await rtdb.onDisconnect(node).remove();
    await rtdb.set(node, body({ joined: TS() }));
    writes++;
    const got = await dbGet(node);
    const val = got.val() || {};
    placed.ref = node; placed.path = path; placed.area = area; placed.shard = choice.shard;
    wiredLook = JSON.stringify(clampLook(H.look()));
    placed.pinned = !!choice.pinned; placed.joined = val.joined || Date.now(); placed.code = code;
    placed.vis = mode() === 'friends' ? 'f' : 'a'; placed.busy = 0;
    sent.x = p.x | 0; sent.y = p.y | 0; sent.f = FACE[p.facing] || 'd'; sent.mv = H.walking() ? 1 : 0; sent.at = Date.now();
    dev.lastRoom[area] = choice.shard; setStatus('on');
    await unlisten();
    const parent = ref('rooms/' + code + '/' + area + '/' + choice.shard);
    unsubs.push(rtdb.onChildAdded(parent, snap => upsert(snap.key, snap.val())));
    unsubs.push(rtdb.onChildChanged(parent, snap => upsert(snap.key, snap.val())));
    unsubs.push(rtdb.onChildRemoved(parent, snap => { others.delete(snap.key); }));
    paintChrome();
    syncInbox();
    // "Joined" shows once the holder is placed; paintChrome() hides it while not in a room.
    if (hiPending) { hiPending = false; showHi(); }
  }

  async function join(area){
    const code = dev.code;
    await connect();
    const open = await dbGet(ref('roomCodes/' + code + '/on'));
    if (open.val() !== true) { await dropNode(); offline(); setStatus('solo'); return; }
    const on = await loadCfg();
    if (!on) { await fail('kill'); return; }
    await ensureIdentity();
    await refreshSocial();
    const tree = (await dbGet(ref('rooms/' + code + '/' + area))).val() || {};
    const counted = countLive(tree, {});
    const hid = await probeHidden(counted.nowIds);
    pollAt = Date.now();
    Object.assign(hidden, hid);
    const again = countLive(tree, hidden);
    const choice = pickShard(again.by);
    if (placed.ref && placed.area === area && placed.shard === choice.shard && placed.code === code) {
      placed.pinned = choice.pinned; setStatus('on'); return;
    }
    await dropNode();
    await place(area, choice);
    retries = 0; giveUp = false; nextRetryMs = 0;
  }

  async function probeHidden(uids){
    const out = {};
    await Promise.all(uids.filter(uid => uid !== me).map(async uid => {
      try {
        const snap = await dbGet(ref('hidden/' + me + '/' + uid));
        if (snap.exists()) out[uid] = true;
      } catch (e) {}
    }));
    return out;
  }

  function upsert(uid, val){
    if (!uid || uid === me) return;
    if (!val || val.pv !== cfg.pv) { others.delete(uid); return; }
    // Keep blocked and friends-only holders in memory so an undo or a new friendship can show them
    // without waiting for another position write. shown() is what hides them.
    let o = others.get(uid);
    const isNew = !o;
    if (!o) { o = { uid, fx: val.x, fy: val.y, tx: val.x, ty: val.y, gx: val.x, gy: val.y }; others.set(uid, o); }
    const dist = Math.abs((val.x | 0) - o.fx) + Math.abs((val.y | 0) - o.fy);
    o.tx = val.x | 0; o.ty = val.y | 0;
    if (dist > 3 || H.reduced()) { o.fx = o.tx; o.fy = o.ty; o.gx = o.tx; o.gy = o.ty; }
    else if (o.gx !== o.tx || o.gy !== o.ty) { o.gx = o.tx; o.gy = o.ty; o.glideAt = performance.now() + 150; }
    o.f = val.f; o.mv = val.mv ? 1 : 0; o.look = val.look; o.pet = val.pet; o.vis = val.vis; o.pv = val.pv;
    o.busy = val.busy ? 1 : 0; o.emote = val.emote || null; o.seen = val.seen; o.joined = val.joined || 0;
    o.seals = val.seals | 0; o.title = val.title | 0;
    if (!fresh(o.seen) || o.busy) o.list = false;
    if (isNew) probeOne(uid);
  }
  async function probeOne(uid){
    if (!db || link !== 'up' || !uid || uid === me) return;
    try {
      const snap = await dbGet(ref('hidden/' + me + '/' + uid));
      if (snap.exists()) hidden[uid] = true;
      else delete hidden[uid];
    } catch (e) {}
  }

  async function fail(){
    if (failing) return;
    failing = true;
    noteInfo();
    await dropNode();
    offline();
    setStatus('fail');
    if (giveUp) { failing = false; return; }
    const waits = cfg.retryMs || NET_CFG.retryMs;
    if (retries >= waits.length) { giveUp = true; nextRetryMs = 0; failing = false; return; }
    const wait = waits[retries++];
    nextRetryMs = wait;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => { retryTimer = 0; failing = false; if (!giveUp) pump(); }, wait);
  }

  function placeState(){
    if (!ready || !dev.code || !NET_CFG.needCode) return 'off';
    if (mode() === 'solo') return 'solo';
    if (giveUp) return 'fail';
    if (document.hidden) return 'hidden';
    if (H.interior()) return 'interior';
    if (!AREAS[H.mapId()]) return 'away';
    if (H.busy()) return 'busy';
    return 'in';
  }

  async function pump(){
    if (pumping) { pumpAgain = true; return; }
    pumping = true;
    try {
      dev = readDev();
      const st = placeState();
      if (st === 'in' || st === 'busy') {
        clearOff();
        if (link !== 'up') { try { await connect(); } catch (e) { await fail(); return; } }
        try {
          if (placed.area !== H.mapId() || placed.code !== dev.code || !placed.ref) await join(H.mapId());
          else {
            const vis = mode() === 'friends' ? 'f' : 'a';
            if (placed.vis !== vis && placed.ref) {
              placed.vis = vis;
              await rtdb.update(placed.ref, { vis, seen: TS() });
              writes++; sent.at = Date.now();
            }
            setStatus('on');
          }
        } catch (e) { await fail(); }
      } else if (st === 'hidden' || st === 'interior') {
        const shared = !!(H.coopBattle && H.coopBattle());
        if (st === 'hidden' && inParty()) markAwayNow();
        if (st === 'hidden' && inParty() && shared) {
          if (!offTimer) armOff(COOP_CFG.graceMs);
        } else {
          if (placed.ref) await dropNode();
          if (st === 'interior' && inParty()) clearOff();
          else if (!offTimer) armOff(st === 'hidden' ? cfg.hiddenOfflineMs : cfg.interiorOfflineMs);
        }
        if (inParty()) syncInbox();
        setStatus('solo');
      } else {
        if (placed.ref) await dropNode();
        clearOff(); offline();
        setStatus(st === 'fail' ? 'fail' : st === 'solo' ? 'solo' : 'off');
      }
    } finally {
      pumping = false;
      paintChrome();
      if (pumpAgain) { pumpAgain = false; pump(); }
    }
  }

  async function flushPos(){
    if (!placed.ref || H.busy() || link !== 'up') return;
    const p = H.pos();
    if (!p || !tileOk(placed.area, p.x | 0, p.y | 0)) return;
    const f = FACE[p.facing] || 'd', mv = H.walking() ? 1 : 0;
    if (p.x === sent.x && p.y === sent.y && f === sent.f && mv === sent.mv) return;
    if (Date.now() - sent.at < cfg.sendMs) return;
    try {
      await rtdb.update(placed.ref, { x: p.x | 0, y: p.y | 0, f, mv, pt: TS(), seen: TS() });
      writes++;
      sent.x = p.x | 0; sent.y = p.y | 0; sent.f = f; sent.mv = mv; sent.at = Date.now();
    } catch (e) { /* the rules throttle is the backstop; the next tick tries again */ }
  }
  let failing = false;
  async function heartbeat(){
    if (!placed.ref || link !== 'up') return;
    if (Date.now() - sent.at < cfg.heartbeatMs) return;
    try {
      await rtdb.update(placed.ref, { seen: TS() });
      writes++; sent.at = Date.now();
    } catch (e) {}
  }
  async function applyBusy(){
    if (!placed.ref || link !== 'up') return;
    const want = H.busy() ? 1 : 0;
    if (placed.busy === want) return;
    placed.busy = want;
    try {
      await rtdb.update(placed.ref, want ? { busy: 1, seen: TS() } : { busy: null, seen: TS() });
      writes++; sent.at = Date.now();
    } catch (e) { placed.busy = undefined; }
  }
  async function repair(){
    if (!placed.ref || placed.pinned || link !== 'up' || !placed.joined) return;
    const rows = [];
    others.forEach(o => { if (o.pv === cfg.pv && fresh(o.seen) && !o.busy && !blocks[o.uid] && !hidden[o.uid]) rows.push({ uid: o.uid, joined: o.joined || 0 }); });
    rows.push({ uid: me, joined: placed.joined });
    if (rows.length <= cfg.roomMax) return;
    rows.sort((a, b) => (a.joined - b.joined) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
    if (!rows.slice(cfg.roomMax).some(r => r.uid === me)) return;
    const area = placed.area, shard = placed.shard;
    const tree = (await dbGet(ref('rooms/' + dev.code + '/' + area))).val() || {};
    const counted = countLive(tree, hidden);
    const choice = pickShard(counted.by, { exclude: shard, noPin: true });
    if (!choice.shard || choice.shard === shard) return;
    await dropNode();
    await place(area, { shard: choice.shard, pinned: false });
  }

  let busyTick = 0, beatTick = 0;
  function tick(){
    if (!H || !ready) return;
    const t = Date.now();
    if (t - busyTick > 400) { busyTick = t; applyBusy(); }
    // Position writes stay on this tick. config and the co-op switch are listeners. Hidden and friends poll.
    if (t - beatTick > 1000) { beatTick = t; heartbeat(); pollHidden(); pollSocial(); graceCheck(); renderStrip(); if (t - repairAt > 1000) { repairAt = t; repair(); } }
    flushPos();
    const sig = [dev.code || '', mode(), H.mapId(), H.interior() ? 1 : 0, document.hidden ? 1 : 0, H.busy() ? 1 : 0].join('|');
    if (sig !== tick.sig) {
      const prevMap = tick.map;
      tick.sig = sig; tick.map = H.mapId();
      if (giveUp && prevMap && prevMap !== H.mapId()) { giveUp = false; failing = false; retries = 0; clearTimeout(retryTimer); }
      pump();
    }
    sweep();
    paintChrome();
  }
  function sweep(){
    others.forEach((o, uid) => {
      if (!fresh(o.seen) || o.pv !== cfg.pv) others.delete(uid);
    });
  }

  function stepGlide(o, now){
    if (o.gx == null) return;
    if (H.reduced()) { o.fx = o.gx; o.fy = o.gy; return; }
    if (o.glideAt && now < o.glideAt) return;
    const dx = o.gx - o.fx, dy = o.gy - o.fy;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.04 || dist > 3) { o.fx = o.gx; o.fy = o.gy; return; }
    const prev = o.movedAt || now;
    const step = Math.min(dist, (now - prev) / (H.stepMs() || 170));
    o.movedAt = now;
    o.fx += dx / dist * step; o.fy += dy / dist * step;
  }
  function shown(o){
    if (!o || !inRoom() || H.busy() || H.interior()) return false;
    if (!fresh(o.seen) || o.busy || o.pv !== cfg.pv) return false;
    if (blocks[o.uid] || hidden[o.uid]) return false;
    if (mode() === 'friends' && !mutual[o.uid]) return false;
    if (o.vis === 'f' && !mutual[o.uid]) return false;
    return true;
  }
  function displayName(uid, joined){
    if (uid === me) return H.playerName();
    if (mutual[uid] && names[uid] && names[uid].name) return names[uid].name;
    const base = nameFor(uid);
    const same = [];
    others.forEach(o => { if (shown(o) && !mutual[o.uid] && nameFor(o.uid) === base) same.push(o); });
    same.sort((a, b) => (a.joined - b.joined) || (a.uid < b.uid ? -1 : 1));
    const idx = same.findIndex(o => o.uid === uid);
    return idx > 0 ? base + ' ' + (idx + 1) : base;
  }
  function emoteLive(em, ms){
    if (!em || typeof em.t !== 'number') return false;
    const age = Date.now() - em.t;
    return age >= -2000 && age <= ms;
  }

  function mapEnts(g, cx, cy){
    paintOther.g = g; paintOther.cx = cx; paintOther.cy = cy;
    const now = performance.now();
    const ents = [];
    others.forEach(o => {
      o.list = shown(o);
      o.drawn = false;
      if (!o.list) return;
      stepGlide(o, now);
      o.drawn = true;
      const y = o.fy + (mutual[o.uid] ? 0.02 : 0);
      ents.push({ y, draw: () => paintOther(o, now) });
    });
    return ents;
  }
  function paintOther(o, now){
    const g = paintOther.g, cx = paintOther.cx, cy = paintOther.cy;
    if (!g) return;
    const frame = o.mv ? Math.floor(now / (H.stepMs() || 170)) % 2 : 0;
    const still = !o.mv && o.stillAt && now - o.stillAt > 30000;
    if (o.mv || o._sx !== o.tx || o._sy !== o.ty) { o.stillAt = now; o._sx = o.tx; o._sy = o.ty; }
    else if (!o.stillAt) o.stillAt = now;
    const fade = !o.mv && o.stillAt && performance.now() - o.stillAt > 30000;
    if (fade) g.globalAlpha = 0.6;
    const sx = Math.round(o.fx * 16 - cx) - 1, sy = Math.round(o.fy * 16 - cy) - 2;
    g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(sx + 3, Math.round(o.fy * 16 - cy) + 14, 12, 2);
    const face = FACE_BACK[o.f] || 'down';
    const fr = H.keeper(lookBack(o), face, frame);
    if (fr) g.drawImage(fr, sx, sy, 18, 18);
    const back = BEHIND[o.f] || [0, 1];
    const px = o.fx + back[0], py = o.fy + back[1];
    const hop = emoteLive(o.emote, cfg.balloonMs) && o.emote.id === 'e_trick' ? Math.floor(now / 180) % 2 : 0;
    const pet = o.pet && H.spr(o.pet.sp, o.pet.st, hop);
    if (pet) {
      const fx = Math.round(px * 16 - cx) - 1, fy = Math.round(py * 16 - cy) - 2 - hop;
      g.drawImage(pet, fx, fy);
      if (hop) { const sp = (n, dx, dy) => H.glyph(g, 'spark', fx + dx, fy + dy); sp(0, 2, -2); sp(0, 14, -1); sp(0, 4, 12); sp(0, 12, 10); }
    }
    if (fade) g.globalAlpha = 1;
    const tag = friendTag(o) || strangerTag(o);
    if (tag) {
      g.font = '10px "Jersey 15", monospace';
      const w = Math.ceil(g.measureText(tag).width) + 2;
      const slot = plateSlot(o);
      let x = Math.round(o.fx * 16 - cx + 8 - w / 2), y = Math.round(o.fy * 16 - cy) - 8 - slot * 11;
      const c = document.querySelector('#mapCanvas');
      if (c) { x = Math.max(0, Math.min(c.width - w, x)); y = Math.max(8 + slot * 11, y); }
      g.fillStyle = 'rgba(26,28,44,.8)'; g.fillRect(x - 1, y - 8, w + 2, 10);
      g.fillStyle = '#ffcd75'; g.fillText(tag, x, y);
    }
  }
  function plateSlot(o){
    const tx = Math.round(o.fx), ty = Math.round(o.fy), here = [];
    others.forEach(p => {
      if (!p.drawn) return;
      if (Math.round(p.fx) === tx && Math.round(p.fy) === ty) here.push(p);
    });
    const pos = H.pos();
    if (pos && (pos.x | 0) === tx && (pos.y | 0) === ty) here.push({ uid: me, joined: placed.joined || 0 });
    here.sort((a, b) => (a.joined - b.joined) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
    const i = here.findIndex(p => p.uid === o.uid);
    return i < 0 ? 0 : i;
  }
  function friendTag(o){ return mutual[o.uid] ? displayName(o.uid) : ''; }
  function strangerTag(o){
    if (mutual[o.uid]) return '';
    const near = H.pos() && Math.abs(H.pos().x - o.tx) + Math.abs(H.pos().y - o.ty) <= 3;
    const emo = emoteLive(o.emote, Math.max(cfg.balloonMs, cfg.bubbleMs));
    return near || emo ? displayName(o.uid) : '';
  }
  function drawFx(g, cx, cy){
    paintOther.g = g; paintOther.cx = cx; paintOther.cy = cy;
    const meE = localEmote && Date.now() - localEmote.at <= (localEmote.id.charAt(0) === 'p' ? cfg.bubbleMs : cfg.balloonMs) ? { id: localEmote.id, t: localEmote.at } : null;
    if (meE && inRoom() && !H.busy()) drawBalloon(g, cx, cy, H.pos(), meE, true);
    others.forEach(o => { if (o.drawn && o.emote && !dev.mutes[o.uid]) drawBalloon(g, cx, cy, { x: o.fx, y: o.fy }, o.emote, false); });
    placeBubble();
  }
  function drawBalloon(g, cx, cy, pos, em, self){
    if (!pos || !em) return;
    const phrase = em.id && em.id.charAt(0) === 'p';
    const ms = phrase ? cfg.bubbleMs : cfg.balloonMs;
    const age = self ? Date.now() - em.t : Date.now() - em.t;
    if (age < -2000 || age > ms) return;
    if (phrase) return;
    const meta = EMOTES.find(e => e.id === em.id);
    if (!meta || !meta.glyph || typeof drawGlyph !== 'function') return;
    drawGlyph(g, meta.glyph, Math.round(pos.x * 16 - cx) + 4, Math.round(pos.y * 16 - cy) - 15);
  }
  function placeBubble(){
    let elB = document.querySelector('#netBubble');
    if (!elB) return;
    let best = null;
    const consider = (pos, em, self) => {
      if (!pos || !em || !em.id || em.id.charAt(0) !== 'p') return;
      const age = Date.now() - em.t;
      if (age < -2000 || age > cfg.bubbleMs) return;
      if (!best || em.t > best.em.t) best = { pos, em };
    };
    if (localEmote) consider(H.fx(), { id: localEmote.id, t: localEmote.at }, true);
    others.forEach(o => { if (o.drawn && !dev.mutes[o.uid]) consider({ x: o.fx, y: o.fy }, o.emote, false); });
    if (!best) { elB.hidden = true; return; }
    const text = (PHRASES.find(p => p.id === best.em.id) || {}).text || '';
    if (!text) { elB.hidden = true; return; }
    elB.textContent = text; elB.hidden = false;
    const c = document.querySelector('#mapCanvas'), wr = document.querySelector('#mapWrap');
    if (!c || !wr) return;
    const r = c.getBoundingClientRect(), box = wr.getBoundingClientRect(), k = r.width / c.width;
    const cam = H.cam();
    let left = r.left - box.left + (best.pos.x * 16 - cam.x + 8) * k;
    let top = r.top - box.top + (best.pos.y * 16 - cam.y - 2) * k;
    left = Math.max(8, Math.min(box.width - 8, left));
    top = Math.max(18, Math.min(box.height - 8, top));
    elB.style.left = Math.round(left) + 'px';
    elB.style.top = Math.round(top) + 'px';
  }

  function tapTile(tx, ty){
    if (!inRoom() || H.busy()) return false;
    let hit = null;
    others.forEach(o => {
      if (!shown(o)) return;
      const back = BEHIND[o.f] || [0, 1];
      if ((Math.round(o.fx) === tx && Math.round(o.fy) === ty) || (Math.round(o.fx + back[0]) === tx && Math.round(o.fy + back[1]) === ty)) hit = o;
    });
    if (hit) { openCard(hit); return true; }
    const p = H.pos(), fol = H.follower();
    if (p && p.x === tx && p.y === ty) { openCard(null); return true; }
    if (fol && Math.round(fol.x) === tx && Math.round(fol.y) === ty) { openCard(null); return true; }
    return false;
  }

  function overlayOpen(){ return wheelOn || cardOn || codeOn || blockOn || askOpen(); }

  function buildSay(){
    const wrap = document.querySelector('#mapWrap');
    if (!wrap || document.querySelector('#sayBtn')) return;
    const b = el('button', 'say-btn', NET_TEXT.say_btn);
    b.id = 'sayBtn'; b.type = 'button'; b.hidden = true; b.setAttribute('aria-label', NET_TEXT.say_title);
    let timer = 0, held = false;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); held = false;
      timer = setTimeout(() => { held = true; send('e_wave'); }, 450);
    });
    const up = e => { clearTimeout(timer); if (e) { e.preventDefault(); e.stopPropagation(); } if (!held) openWheel(); };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', () => clearTimeout(timer));
    wrap.appendChild(b);
    const bub = el('div', 'chat-bubble net-bubble');
    bub.id = 'netBubble'; bub.hidden = true;
    wrap.appendChild(bub);
  }
  function buildSheets(){
    wheelEl(); cardEl();
  }
  function wheelEl(){
    if (document.querySelector('#sayWheel')) return;
    const ov = el('div', 'overlay sheet net-sheet'); ov.id = 'sayWheel'; ov.hidden = true;
    const inner = el('div', 'ov-inner net-wheel');
    inner.setAttribute('role', 'dialog'); inner.setAttribute('aria-modal', 'true');
    const head = el('div', 'net-head');
    head.append(el('div', 'ov-title', NET_TEXT.say_title));
    const x = el('button', 'net-x', 'X'); x.type = 'button'; x.id = 'sayClose'; x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', closeWheel); head.append(x); inner.append(head);
    inner.append(el('div', 'net-lab', NET_TEXT.wheel_emotes));
    const ring = el('div', 'net-emotes'); ring.id = 'sayEmotes'; inner.append(ring);
    const lab = el('div', 'net-lab net-phrase-lab');
    lab.append(el('span', '', NET_TEXT.wheel_phrases));
    const pg = el('button', 'net-page', 'page 1/2 ›'); pg.type = 'button'; pg.id = 'sayPage';
    pg.addEventListener('click', () => { page = page ? 0 : 1; paintWheel(); });
    lab.append(pg); inner.append(lab);
    const grid = el('div', 'net-phrases'); grid.id = 'sayPhrases'; inner.append(grid);
    ov.append(inner); document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) closeWheel(); });
  }
  function cardEl(){
    if (document.querySelector('#holderCard')) return;
    const ov = el('div', 'overlay net-card-ov'); ov.id = 'holderCard'; ov.hidden = true;
    const inner = el('div', 'ov-inner net-card'); inner.id = 'holderCardBody';
    inner.setAttribute('role', 'dialog'); inner.setAttribute('aria-modal', 'true');
    ov.append(inner); document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) closeCard(); });
  }
  function paintWheel(){
    const ring = document.querySelector('#sayEmotes'), grid = document.querySelector('#sayPhrases'), pg = document.querySelector('#sayPage');
    if (!ring) return;
    const cool = Date.now() < coolUntil;
    ring.textContent = '';
    EMOTES.forEach(em => {
      const b = el('button', 'net-em' + (em.id === 'e_trick' ? ' net-centre' : ''), em.id === 'e_trick' ? NET_TEXT.show_off : em.label);
      b.type = 'button'; b.disabled = cool; b.style.minHeight = '44px';
      b.addEventListener('click', () => send(em.id));
      ring.appendChild(b);
    });
    if (pg) pg.textContent = 'page ' + (page + 1) + '/2 ›';
    grid.textContent = '';
    PHRASES.slice(page * 8, page * 8 + 8).forEach(ph => {
      const b = el('button', 'net-ph', ph.text); b.type = 'button'; b.disabled = cool;
      b.addEventListener('click', () => send(ph.id));
      grid.appendChild(b);
    });
  }
  function openWheel(){ if (!inRoom()) return; wheelOn = true; const ov = document.querySelector('#sayWheel'); if (ov) ov.hidden = false; paintWheel(); }
  function closeWheel(){ wheelOn = false; const ov = document.querySelector('#sayWheel'); if (ov) ov.hidden = true; }
  async function send(id){
    if (Date.now() < coolUntil || !placed.ref) return;
    coolUntil = Date.now() + cfg.emoteGapMs;
    localEmote = { id, at: Date.now() };
    closeWheel(); paintWheel();
    const node = placed.ref;
    try {
      await enqueue(() => rtdb.update(node, emotePatch(id)));
      writes++; sent.at = Date.now();
    } catch (e) { /* the wheel already shows the gap; the rules are the backstop */ }
  }

  function openCard(o){
    cardOn = true;
    if (link === 'up' && me) refreshSocial().catch(() => {});
    const ov = document.querySelector('#holderCard'), body = document.querySelector('#holderCardBody');
    if (!ov || !body) return;
    ov.hidden = false; body.textContent = '';
    const self = !o;
    const uid = self ? me : o.uid;
    const friend = !self && !!mutual[uid];
    const top = el('div', 'net-top');
    const art = el('canvas', 'net-look'); art.width = art.height = 16;
    const look = self ? (H.look() || null) : lookBack(o);
    const fr = H.keeper(look, 'down', 0);
    if (fr) art.getContext('2d').drawImage(fr, -1, -1);
    top.append(art);
    const mid = el('div', 'net-mid');
    mid.append(el('div', 'net-name', self ? H.playerName() : displayName(uid)));
    const title = TITLES[self ? myTitle() : (o.title | 0)] || TITLES[0];
    mid.append(el('div', 'net-title', title));
    if (!self && !friend) mid.append(el('p', 'net-hint', NET_TEXT.card_hint));
    top.append(mid);
    const chip = el('span', 'net-chip' + (friend ? ' friend' : ''), friend ? NET_TEXT.friend_tag : NET_TEXT.card_title);
    top.append(chip); body.append(top);
    const pet = self ? H.partner() : o.pet;
    const row = el('div', 'net-partner');
    const pc = el('canvas', 'net-pet'); pc.width = pc.height = 18;
    if (pet) { const spr = H.spr(pet.species || pet.sp, pet.stage != null ? pet.stage : pet.st, 0); if (spr) pc.getContext('2d').drawImage(spr, 0, 0); }
    row.append(pc);
    const pn = el('div', 'net-pn');
    const form = pet ? H.formName(pet.species || pet.sp, pet.stage != null ? pet.stage : pet.st) : '';
    const nick = friend && NET_CFG.friendNick && names[uid] && names[uid].pet ? names[uid].pet : '';
    pn.append(el('div', 'net-form', nick ? nick + ' · ' + form : form));
    const lv = pet ? (pet.level || pet.lv || 1) : 1;
    row.append(pn); row.append(el('div', 'net-lv', 'Lv ' + lv)); body.append(row);
    const seals = self ? H.seals() : (o.seals | 0);
    const sealRow = el('div', 'net-seals');
    sealRow.append(el('span', 'net-seal-lab', 'SEALS'));
    const pips = el('span', 'net-pips');
    for (let i = 0; i < 8; i++) pips.append(el('i', 'pip' + (i < seals ? ' on' : '')));
    sealRow.append(pips); sealRow.append(el('span', 'net-seal-n', seals + '/8')); body.append(sealRow);
    if (self) {
      body.append(el('div', 'net-code-lab', NET_TEXT.fr_code));
      body.append(el('div', 'net-code', H.friendCode()));
      if (inParty() && COOP_CFG.on) {
        const acts = el('div', 'net-acts');
        const leave = el('button', 'btn net-act', COOP_TEXT.leave); leave.type = 'button';
        leave.addEventListener('click', () => { closeCard(); leaveGroup(); });
        acts.append(leave); body.append(acts);
      }
    } else {
      const acts = el('div', 'net-acts');
      const wave = el('button', 'btn net-act', NET_TEXT.btn_wave); wave.type = 'button';
      wave.addEventListener('click', () => send('e_wave'));
      acts.append(wave);
      if (canInvite(uid)) {
        const walk = el('button', 'btn net-act net-walk', COOP_TEXT.walk); walk.type = 'button';
        walk.addEventListener('click', () => invite(uid));
        acts.append(walk);
      }
      const mute = el('button', 'btn net-act', dev.mutes[uid] ? NET_TEXT.btn_unmute : NET_TEXT.btn_mute); mute.type = 'button';
      mute.addEventListener('click', () => {
        if (dev.mutes[uid]) delete dev.mutes[uid]; else { dev.mutes[uid] = Date.now(); H.toast(NET_TEXT.toast_muted); }
        writeDev(); openCard(o);
      });
      const block = el('button', 'btn net-act net-block', NET_TEXT.btn_block); block.type = 'button';
      block.addEventListener('click', () => doBlock(uid));
      acts.append(mute, block); body.append(acts);
      body.append(el('p', 'net-foot', NET_TEXT.card_footer));
    }
    const close = el('button', 'btn btn-play net-close', NET_TEXT.btn_close); close.type = 'button';
    close.addEventListener('click', closeCard); body.append(close);
  }
  function closeCard(){ cardOn = false; const ov = document.querySelector('#holderCard'); if (ov) ov.hidden = true; }

  async function doBlock(uid){
    if (!db) return;
    if (COOP_VOTE.invite.blockEnds && inParty()) { try { await leaveGroup(); } catch (e) {} }
    undoFriend = !!mutual[uid]; undoUid = uid;
    try {
      await connect();
      await rtdb.set(ref('blocks/' + me + '/' + uid), TS());
      await rtdb.set(ref('hidden/' + uid + '/' + me), TS());
      await rtdb.remove(ref('friends/' + me + '/' + uid));
    } catch (e) { return; }
    blocks[uid] = Date.now(); dev.blocks[uid] = Date.now(); delete mutual[uid]; writeDev();
    closeCard(); showUndo(uid);
    paintChrome(); renderFriends();
  }
  function showUndo(uid){
    let bar = document.querySelector('#netUndo');
    if (!bar) { bar = el('div', 'net-undo'); bar.id = 'netUndo'; document.body.appendChild(bar); }
    bar.textContent = '';
    bar.append(document.createTextNode('Blocked. '));
    const b = el('button', 'net-undo-btn', 'UNDO'); b.type = 'button';
    b.addEventListener('click', () => undoBlock(uid));
    bar.append(b); bar.hidden = false;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => { bar.hidden = true; undoUid = null; }, 5000);
  }
  async function undoBlock(uid){
    clearTimeout(undoTimer);
    const bar = document.querySelector('#netUndo'); if (bar) bar.hidden = true;
    try {
      await connect();
      await rtdb.remove(ref('blocks/' + me + '/' + uid));
      await rtdb.remove(ref('hidden/' + uid + '/' + me));
      if (undoFriend) await rtdb.set(ref('friends/' + me + '/' + uid), true);
    } catch (e) {}
    delete blocks[uid]; delete dev.blocks[uid]; delete hidden[uid]; writeDev();
    undoUid = null; undoFriend = false;
    if (link === 'up') { try { await refreshSocial(); } catch (e) {} }
    pump(); renderFriends();
  }
  async function unblock(uid){
    try {
      await connect();
      await rtdb.remove(ref('blocks/' + me + '/' + uid));
      await rtdb.remove(ref('hidden/' + uid + '/' + me));
    } catch (e) {}
    delete blocks[uid]; delete dev.blocks[uid]; delete hidden[uid]; writeDev();
    paintBlocked(); paintChrome(); pump();
  }

  function buildSettings(){
    const look = document.querySelector('#setLook');
    if (!look || document.querySelector('#playTogether')) return;
    const box = el('div', 'play-together'); box.id = 'playTogether';
    box.append(el('div', 'net-sec', NET_TEXT.set_section));
    const show = el('div', 'net-lab'); show.id = 'setShowOthers'; show.textContent = NET_TEXT.set_show;
    const code = el('button', 'set-row'); code.id = 'setRoomCode'; code.type = 'button';
    code.append(el('span', 'set-lab', NET_TEXT.set_code), el('span', 'set-val', NET_TEXT.set_enter + ' ›'));
    code.addEventListener('click', openCode);
    const blk = el('button', 'set-row'); blk.id = 'setBlocked'; blk.type = 'button';
    blk.append(el('span', 'set-lab', NET_TEXT.set_blocked), el('span', 'set-val', '0 ›'));
    blk.addEventListener('click', openBlocked);
    box.append(code, blk);
    box.append(el('p', 'set-hint', NET_TEXT.set_hint));
    // The label sits with its switch, not above the Room code and Blocked rows.
    box.append(show);
    box.append(el('p', 'set-hint', NET_TEXT.tap_switch));
    const pills = el('div', 'net-pills'); pills.setAttribute('role', 'group'); pills.setAttribute('aria-labelledby', 'setShowOthers');
    [['on', NET_TEXT.val_on], ['friends', NET_TEXT.val_friends], ['solo', NET_TEXT.val_solo]].forEach(([id, label]) => {
      const b = el('button', 'net-pill', label); b.type = 'button'; b.dataset.mode = id;
      b.addEventListener('click', () => { H.setShow(id); paintChrome(); pump(); });
      pills.append(b);
    });
    box.append(pills);
    box.append(el('p', 'net-status', NET_TEXT.solo_status));
    look.insertAdjacentElement('afterend', box);
    if (!document.querySelector('#roomCodeOv')) {
      const ov = el('div', 'overlay'); ov.id = 'roomCodeOv'; ov.hidden = true;
      const inner = el('div', 'ov-inner'); inner.setAttribute('role', 'dialog');
      inner.append(el('div', 'ov-title', NET_TEXT.set_code));
      const input = el('input', 'net-input'); input.id = 'roomCodeInput'; input.maxLength = 7; input.placeholder = 'XXX-XXX'; input.setAttribute('aria-label', NET_TEXT.set_code);
      input.autocapitalize = 'characters';
      inner.append(input);
      const row = el('div', 'net-acts');
      const join = el('button', 'btn btn-play', NET_TEXT.set_join); join.type = 'button'; join.id = 'roomJoin';
      join.addEventListener('click', () => submitCode(input.value));
      const leave = el('button', 'btn', NET_TEXT.set_leave); leave.type = 'button'; leave.id = 'roomLeave';
      leave.addEventListener('click', leaveCode);
      const close = el('button', 'btn', NET_TEXT.btn_close); close.type = 'button';
      close.addEventListener('click', () => { codeOn = false; ov.hidden = true; });
      row.append(join, leave); inner.append(row, close); ov.append(inner); document.body.appendChild(ov);
    }
    if (!document.querySelector('#blockedOv')) {
      const ov = el('div', 'overlay'); ov.id = 'blockedOv'; ov.hidden = true;
      const inner = el('div', 'ov-inner'); inner.setAttribute('role', 'dialog');
      inner.append(el('div', 'ov-title', NET_TEXT.set_blocked));
      const list = el('div', 'net-blocked'); list.id = 'blockedList'; inner.append(list);
      const close = el('button', 'btn btn-play', NET_TEXT.btn_close); close.type = 'button';
      close.addEventListener('click', () => { blockOn = false; ov.hidden = true; });
      inner.append(close); ov.append(inner); document.body.appendChild(ov);
    }
  }
  function openCode(){ codeOn = true; const ov = document.querySelector('#roomCodeOv'); if (!ov) return; ov.hidden = false; const input = document.querySelector('#roomCodeInput'); if (input) input.value = dev.code ? showCode(dev.code) : ''; }
  function hideHi(){
    clearTimeout(hiTimer); hiTimer = 0;
    const n = document.querySelector('#netHi');
    if (!n) return;
    n.classList.remove('show');
    n.hidden = true;
  }
  function showHi(){
    if (mode() === 'solo') return;
    let n = document.querySelector('#netHi');
    if (!n) {
      n = el('div', 'net-hi'); n.id = 'netHi'; n.setAttribute('role', 'status');
      document.body.appendChild(n);
    }
    n.textContent = NET_TEXT.code_ok;
    n.hidden = false;
    n.classList.add('show');
    clearTimeout(hiTimer);
    hiTimer = setTimeout(hideHi, 1600);
  }
  async function submitCode(raw){
    const code = normRoom(raw);
    if (!code) { H.toast(NET_TEXT.code_bad); return; }
    try {
      await connect();
      const on = await dbGet(ref('roomCodes/' + code + '/on'));
      if (on.val() !== true) {
        H.toast(NET_TEXT.code_bad);
        if (!dev.code) offline();
        return;
      }
    } catch (e) { noteInfo(); setStatus('fail'); H.toast ? null : null; return; }
    dev.code = code; writeDev();
    codeOn = false; const ov = document.querySelector('#roomCodeOv'); if (ov) ov.hidden = true;
    hiPending = true;
    giveUp = false; retries = 0;
    paintChrome(); pump();
  }
  async function leaveCode(){
    hiPending = false;
    dev.code = null; writeDev();
    codeOn = false; const ov = document.querySelector('#roomCodeOv'); if (ov) ov.hidden = true;
    await dropNode(); offline(); setStatus('off'); paintChrome();
  }
  function openBlocked(){ blockOn = true; const ov = document.querySelector('#blockedOv'); if (ov) ov.hidden = false; paintBlocked(); }
  function paintBlocked(){
    const list = document.querySelector('#blockedList'); if (!list) return;
    list.textContent = '';
    const ids = Object.keys(dev.blocks || {});
    if (!ids.length) { list.append(el('p', 'set-hint', '0')); return; }
    ids.forEach(uid => {
      const row = el('div', 'net-brow');
      row.append(el('span', 'net-bname', nameFor(uid)));
      const b = el('button', 'btn', NET_TEXT.set_unblock); b.type = 'button';
      b.addEventListener('click', () => unblock(uid));
      row.append(b); list.append(row);
    });
  }
  function paintStatus(){
    const box = document.querySelector('#playTogether'); if (!box) return;
    if (mode() === 'solo' || !inRoom()) hideHi();
    box.querySelectorAll('.net-pill').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode())));
    const code = box.querySelector('#setRoomCode .set-val');
    if (code) code.textContent = dev.code ? showCode(dev.code) + ' ›' : NET_TEXT.set_enter + ' ›';
    const blk = box.querySelector('#setBlocked .set-val');
    if (blk) blk.textContent = Object.keys(dev.blocks || {}).length + ' ›';
    const st = box.querySelector('.net-status');
    if (!st) return;
    if (inRoom() && mode() !== 'solo' && dev.status !== 'fail') {
      let n = 1; others.forEach(o => { if (o.drawn || shown(o)) n++; });
      st.textContent = 'Room ' + placed.shard.slice(1) + ' · ' + n + ' here';
    } else st.textContent = NET_TEXT.solo_status;
  }
  function paintChrome(){
    const say = document.querySelector('#sayBtn');
    if (say) say.hidden = !inRoom();
    const add = document.querySelector('#friendAdd'), input = document.querySelector('#friendInput');
    const on = !!(dev.code && ready);
    if (add) add.disabled = !on;
    if (input) input.disabled = !on;
    paintStatus();
    if (wheelOn) paintWheel();
  }

  function wireFriends(){
    const btn = document.querySelector('#friendAdd'), input = document.querySelector('#friendInput');
    if (btn && !btn.dataset.net) {
      btn.dataset.net = '1';
      btn.addEventListener('click', () => addFriend(input ? input.value : ''));
    }
    renderFriends();
  }
  function paintFriendRows(rows){
    const list = document.querySelector('#friendList'); if (!list) return;
    list.textContent = '';
    for (let i = 0; i < NET_CFG.friendSlots; i++) {
      const uid = rows[i];
      const li = el('li');
      if (!uid) { li.append(el('span', 'lock', '?'), document.createTextNode(' ??? '), el('em', '', 'empty slot')); }
      else {
        const cv = el('canvas'); cv.width = cv.height = 16;
        const info = names[uid];
        if (info && info.pet) { /* partner icon is the form when we only stored a nickname */ }
        li.append(cv);
        const who = (mutual[uid] && info && info.name) ? info.name : nameFor(uid);
        li.append(el('span', 'net-fname', who));
        const near = [...others.keys()].includes(uid) && shown(others.get(uid));
        li.append(el('em', '', mutual[uid] ? (near ? NET_TEXT.fr_near : '') : NET_TEXT.fr_wait));
        const rm = el('button', 'btn net-remove', NET_TEXT.fr_remove); rm.type = 'button';
        rm.addEventListener('click', () => removeFriend(uid));
        li.append(rm);
      }
      list.append(li);
    }
  }
  async function renderFriends(){
    const list = document.querySelector('#friendList'); if (!list || !H) return;
    paintFriendRows([]);
    if (ready && dev.code && link === 'up') {
      try { await refreshSocial(); } catch (e) {}
    }
    paintFriendRows(Object.keys(mineList));
    paintChrome();
  }
  async function addFriend(raw){
    const code = normFriend(raw);
    if (!code || !me) { H.toast(NET_TEXT.friend_none); return; }
    try {
      await connect();
      const snap = await dbGet(ref('codes/' + code));
      const uid = snap.val();
      if (!uid || uid === me) { H.toast(NET_TEXT.friend_none); if (mode() === 'solo' || !inRoom()) offline(); return; }
      const mine = (await dbGet(ref('friends/' + me))).val() || {};
      const have = Object.keys(mine).filter(k => mine[k] === true);
      if (have.includes(uid)) { H.toast(mine && mutual[uid] ? NET_TEXT.friend_mutual : NET_TEXT.friend_added); return; }
      if (have.length >= NET_CFG.friendSlots) { H.toast(NET_TEXT.friend_full); return; }
      await rtdb.set(ref('friends/' + me + '/' + uid), true);
      const back = await dbGet(ref('friends/' + uid + '/' + me));
      H.toast(back.val() === true ? NET_TEXT.friend_mutual : NET_TEXT.friend_added);
      await refreshSocial();
    } catch (e) { noteInfo(); }
    if (placeState() !== 'in' && placeState() !== 'busy') offline();
    renderFriends();
  }
  async function removeFriend(uid){
    try {
      await connect();
      await rtdb.remove(ref('friends/' + me + '/' + uid));
      await refreshSocial();
    } catch (e) {}
    delete mutual[uid];
    delete mineList[uid];
    if (placeState() !== 'in' && placeState() !== 'busy') offline();
    renderFriends();
  }

  async function syncLook(){
    if (!placed.ref || link !== 'up' || !rtdb) return;
    const next = clampLook(H.look());
    const sig = JSON.stringify(next);
    if (sig === wiredLook) return;
    await rtdb.update(placed.ref, { look: next, seen: TS() });
    writes++;
    wiredLook = sig;
  }

  function hereCount(){
    let n = inRoom() ? 1 : 0;
    others.forEach(o => { if (shown(o)) n++; });
    return n;
  }
  function debug(){
    if (!H || !H.debug()) return null;
    const list = [];
    others.forEach(o => {
      if (!shown(o) && !o.drawn) return;
      list.push({
        uid: o.uid, x: o.tx, y: o.ty, fx: o.fx, fy: o.fy, f: o.f, look: o.look, pet: o.pet,
        vis: o.vis, pv: o.pv, busy: o.busy || 0, emote: o.emote, name: displayName(o.uid), drawn: !!o.drawn,
      });
    });
    return {
      others: list, room: placed.shard, area: placed.area, reads, stats: { writes, reads }, nameFor, status: dev.status, uid: me,
      connected: link === 'up', nextRetryMs, retryMs: NET_CFG.retryMs.slice(), here: hereCount(),
      cam: H.cam(), pos: H.pos(), code: dev.code, advancePolls,
      rawWrite: async id => {
        if (!placed.ref) return 'no-room';
        const node = placed.ref;
        try {
          await enqueue(() => rtdb.update(node, emotePatch(id)));
          writes++;
          return 'ok';
        } catch (e) { return String((e && (e.code || e.message)) || 'denied'); }
      },
    };
  }

  /* --- co-op (COOP_R2 Build 1) --- */
  const PID_SAFE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function inParty(){ return !!(party.code && party.pid && party.host); }
  function newPid(){
    let s = 'p';
    for (let i = 0; i < 6; i++) s += PID_SAFE[Math.floor(Math.random() * PID_SAFE.length)];
    return s;
  }
  function clampName(s){ return Array.from(String(s || '')).slice(0, 18).join(''); }
  function holderName(uid){
    if (!uid) return '';
    if (uid === me && H) return H.playerName();
    if (mutual[uid] && names[uid] && names[uid].name) return names[uid].name;
    const o = others.get(uid);
    if (o && H) return displayName(uid, o.joined);
    return nameFor(uid);
  }
  function memberCount(){
    const members = (party.data && party.data.members) || {};
    return Object.keys(members).length;
  }
  function groupFull(){ return inParty() && memberCount() >= COOP_VOTE.maxMembers; }
  function canInvite(uid){
    if (!coopOn() || !H || !uid || uid === me) return false;
    if (COOP_VOTE.invite.notSolo && mode() === 'solo') return false;
    if (COOP_VOTE.invite.mutual && !mutual[uid]) return false;
    if (COOP_VOTE.invite.sameCode && !inRoom()) return false;
    if (blocks[uid] || hidden[uid]) return false;
    if (party.muted[uid]) return false;
    if (groupFull()) return false;
    if (inParty() && party.host !== me) return false;
    return true;
  }
  function petPayload(){
    let pet = null;
    try { pet = H && H.coopPet && H.coopPet(); } catch (e) { pet = null; }
    if (!pet || typeof pet.form !== 'string') pet = { form: 'ember/0', level: 1, hp: 1, mv: 'wobble', mood: 0, chip: 0 };
    return {
      form: pet.form, level: pet.level | 0, hp: pet.hp | 0, mv: pet.mv || 'wobble',
      mood: pet.mood | 0, chip: pet.chip | 0,
    };
  }
  function memberBody(){
    return { joined: TS(), seen: TS(), away: 0, ready: 1, pet: petPayload() };
  }
  function partyPath(){ return 'parties/' + party.code + '/' + party.pid; }
  function rememberParty(){
    dev.party = { code: party.code, pid: party.pid, host: party.host, at: party.at || Date.now() };
    writeDev();
  }
  function unwatchParty(){
    if (party.unsub) { try { party.unsub(); } catch (e) {} party.unsub = null; }
  }
  function clearPartyLocal(keepSolo){
    unwatchParty();
    party.code = null; party.pid = null; party.host = null; party.at = 0; party.role = null;
    party.data = null; party.ref = null; party.known = {}; party.wasAway = {}; party.dropping = {}; party.leaving = false;
    party.solo = !!keepSolo; party.saw = false; party.recentDrop = 0;
    if (dev.party) { dev.party = null; writeDev(); }
  }
  function armMemberDisc(node){
    if (!node || !rtdb) return;
    try { rtdb.onDisconnect(node).update({ away: 1, awayAt: TS() }); } catch (e) {}
  }
  function watchParty(){
    if (!db || !rtdb || !inParty()) return;
    if (party.unsub) return;
    party.unsub = rtdb.onValue(ref(partyPath()), snap => { onParty(snap); }, () => {
      // A deleted party is no longer readable, so the listener errors instead of delivering null.
      noteRemoteEnd();
    });
  }
  function noteRemoteEnd(){
    if (!inParty()) return;
    const hostLeft = !party.leaving && party.host && party.host !== me;
    if (hostLeft && H) {
      if (coopFlag) H.toast(COOP_TEXT.home(clampName(holderName(party.host))));
      else { party.solo = true; H.toast(NET_TEXT.solo_status); }
    }
    clearPartyLocal(party.solo || (hostLeft && !coopFlag));
    // The host delete can land before this phone sees the switch go false. Remember it briefly.
    if (hostLeft && coopFlag) party.recentDrop = Date.now();
    renderStrip();
  }
  function onParty(snap){
    const val = snap.val();
    if (!val || !val.members || !val.members[me]) {
      if (!party.saw && !party.leaving) return;
      noteRemoteEnd();
      return;
    }
    const prev = party.data;
    party.saw = true;
    party.data = val;
    if (val.host) party.host = val.host;
    noteJoins(prev, val);
    Object.keys(val.members || {}).forEach(uid => {
      const m = val.members[uid];
      if (!m || uid === me) return;
      if (m.away === 1 && !party.wasAway[uid]) { party.wasAway[uid] = true; if (H) H.toast(COOP_TEXT.away(clampName(holderName(uid)))); }
      else if (m.away !== 1) delete party.wasAway[uid];
    });
    graceCheck();
    renderStrip();
  }
  function noteJoins(prev, val){
    const members = (val && val.members) || {};
    const first = !prev;
    Object.keys(members).forEach(uid => {
      if (uid === me) { party.known[uid] = true; return; }
      if (!party.known[uid] && !first && party.role === 'host') H.toast(COOP_TEXT.joined(clampName(holderName(uid))));
      party.known[uid] = true;
    });
    Object.keys(party.known).forEach(uid => {
      if (members[uid] || uid === me) return;
      if (!party.leaving && !party.dropping[uid]) H.toast(COOP_TEXT.home(clampName(holderName(uid))));
      delete party.known[uid];
    });
  }
  function serverNow(){ return Date.now() + (party.offset || 0); }
  function awayLeft(m){
    if (!m || m.away !== 1 || typeof m.awayAt !== 'number') return 0;
    return Math.max(0, Math.ceil((COOP_CFG.graceMs - (serverNow() - m.awayAt)) / 1000));
  }
  function graceCheck(){
    if (!inParty() || !party.data || !coopOn() || !rtdb || party.leaving) return;
    const members = party.data.members || {};
    const now = serverNow();
    Object.keys(members).forEach(uid => {
      const m = members[uid];
      if (!m || m.away !== 1 || typeof m.awayAt !== 'number') return;
      if (now - m.awayAt <= COOP_CFG.graceMs) return;
      if (uid === me) return;
      if (party.role === 'host' || party.host === me) {
        if (party.dropping[uid]) return;
        party.dropping[uid] = true;
        const patch = {};
        patch['members/' + uid] = null;
        if (party.data.guest === uid) patch.guest = null;
        rtdb.update(ref(partyPath()), patch).catch(() => { delete party.dropping[uid]; });
      } else if (uid === party.host) {
        H.toast(COOP_TEXT.home(clampName(holderName(uid))));
        clearPartyLocal();
        renderStrip();
      }
    });
  }
  function markAwayNow(){
    if (!inParty() || !party.ref || !rtdb) return;
    try { rtdb.update(party.ref, { away: 1, awayAt: TS() }); } catch (e) {}
  }
  function markBack(){
    if (!inParty() || !party.ref || !rtdb || document.hidden) return;
    try { rtdb.update(party.ref, { away: 0, seen: TS(), awayAt: null }); } catch (e) {}
  }
  function armOffset(){
    if (party.offsetUnsub || !db || !rtdb) return;
    party.offsetUnsub = rtdb.onValue(ref('.info/serverTimeOffset'), snap => {
      const v = snap.val();
      if (typeof v !== 'number' || party.offsetSet) return;
      party.offset = v;
      party.offsetSet = true;
    }, () => {});
  }
  function disarmOffset(){
    if (party.offsetUnsub) { try { party.offsetUnsub(); } catch (e) {} party.offsetUnsub = null; }
  }
  function disarmInbox(){
    if (party.inboxUnsub) { try { party.inboxUnsub(); } catch (e) {} party.inboxUnsub = null; }
    party.inboxPath = '';
  }
  function syncInbox(){
    if (!db || !rtdb || !me) return;
    const code = (inParty() && party.code) || dev.code;
    if ((!inRoom() && !inParty()) || !code) { disarmInbox(); return; }
    const path = 'parties/' + code + '/inbox/' + me;
    if (party.inboxUnsub && party.inboxPath === path) return;
    disarmInbox();
    party.inboxPath = path;
    party.inboxUnsub = rtdb.onChildAdded(ref(path), snap => onInbox(snap.key, snap.val()), () => {});
  }
  function onInbox(from, note){
    if (!from || !note || typeof note.pid !== 'string') return;
    // A note that arrives before the switch snapshot must stay pending. Marking it seen would drop the invite.
    if (!coopOn()) { party.held = party.held || []; party.held.push({ from, note }); return; }
    const stamp = note.at == null ? '' : String(note.at);
    const key = from + ':' + note.pid + ':' + stamp;
    if (party.knownNote && party.knownNote[key]) return;
    if (!party.knownNote) party.knownNote = {};
    party.knownNote[key] = true;
    const code = (inParty() && party.code) || dev.code;
    const drop = () => { try { rtdb.remove(ref('parties/' + code + '/inbox/' + me + '/' + from)); } catch (e) {} };
    if (party.muted[from]) { drop(); return; }
    if (inParty() || party.ask) { if (inParty()) drop(); return; }
    openAsk(from, note);
  }
  function flushHeld(){
    const held = party.held || [];
    if (!held.length || !coopOn()) return;
    party.held = [];
    held.forEach(n => onInbox(n.from, n.note));
  }
  function askOpen(){ const ov = document.querySelector('#coopAsk'); return !!(ov && !ov.hidden); }
  function openAsk(from, note){
    party.ask = { from, pid: note.pid, at: note.at };
    const line = COOP_TEXT.ask(clampName(holderName(from)));
    if (H) H.toast(line);
    const title = document.querySelector('#coopAskTitle');
    if (title) title.textContent = line;
    const ov = document.querySelector('#coopAsk');
    if (ov) ov.hidden = false;
    clearTimeout(party.askTimer);
    party.askTimer = setTimeout(() => closeAsk(), COOP_CFG.inviteMs);
  }
  function closeAsk(){
    clearTimeout(party.askTimer); party.askTimer = 0;
    party.ask = null;
    const ov = document.querySelector('#coopAsk');
    if (ov) ov.hidden = true;
  }
  function wireAsk(){
    const joinBtn = document.querySelector('#coopJoin');
    const noBtn = document.querySelector('#coopNotNow');
    if (joinBtn && !joinBtn.dataset.coop) { joinBtn.dataset.coop = '1'; joinBtn.addEventListener('click', () => joinGroup()); }
    if (noBtn && !noBtn.dataset.coop) { noBtn.dataset.coop = '1'; noBtn.addEventListener('click', () => notNow()); }
  }
  async function invite(uid){
    if (!canInvite(uid) || !dev.code || !me || !rtdb) return;
    closeCard();
    try {
      await connect();
      if (!inParty()) {
        const pid = newPid();
        const area = (H && COOP_CFG.areas.indexOf(H.mapId()) >= 0) ? H.mapId() : 'hearthmoor';
        const path = 'parties/' + dev.code + '/' + pid;
        await rtdb.set(ref(path), {
          cv: COOP_CFG.cv, host: me, made: TS(), area,
          members: { [me]: memberBody() },
        });
        writes++;
        party.code = dev.code; party.pid = pid; party.host = me; party.at = Date.now(); party.role = 'host';
        party.ref = ref(path + '/members/' + me);
        party.known = {}; party.known[me] = true; party.saw = false;
        rememberParty();
        armMemberDisc(party.ref);
        watchParty();
      }
      await rtdb.set(ref(partyPath() + '/invites/' + uid), TS());
      writes++;
      await rtdb.set(ref('parties/' + party.code + '/inbox/' + uid + '/' + me), { pid: party.pid, at: TS() });
      writes++;
      syncInbox();
    } catch (e) { /* rules are the backstop */ }
    renderStrip();
  }
  async function joinGroup(){
    const ask = party.ask;
    if (!ask || !me || !dev.code || !rtdb) { closeAsk(); return; }
    const from = ask.from, pid = ask.pid;
    closeAsk();
    try {
      await connect();
      const path = 'parties/' + dev.code + '/' + pid;
      await rtdb.update(ref(path), { guest: me, ['members/' + me]: memberBody() });
      writes++;
      try { await rtdb.remove(ref('parties/' + dev.code + '/inbox/' + me + '/' + from)); } catch (e) {}
      party.code = dev.code; party.pid = pid; party.host = from; party.at = Date.now(); party.role = 'guest';
      party.ref = ref(path + '/members/' + me);
      party.solo = false; party.saw = false;
      rememberParty();
      armMemberDisc(party.ref);
      watchParty();
      syncInbox();
      if (H) H.toast(COOP_TEXT.together);
    } catch (e) { /* a full seat or a forged invite stays denied */ }
    renderStrip();
  }
  async function notNow(){
    const ask = party.ask;
    if (!ask || !me || !dev.code) { closeAsk(); return; }
    const from = ask.from, pid = ask.pid;
    closeAsk();
    party.notNow[from] = (party.notNow[from] || 0) + 1;
    if (party.notNow[from] >= (COOP_VOTE.invite.notNowMute || 3)) party.muted[from] = true;
    try {
      await rtdb.remove(ref('parties/' + dev.code + '/' + pid + '/invites/' + me));
      await rtdb.remove(ref('parties/' + dev.code + '/inbox/' + me + '/' + from));
    } catch (e) {}
  }
  async function leaveGroup(){
    if (!inParty() || !me || !rtdb) return;
    party.leaving = true;
    const code = party.code, pid = party.pid, host = party.host, node = party.ref;
    try {
      if (node) { try { await rtdb.onDisconnect(node).cancel(); } catch (e) {} }
      if (host === me) await rtdb.remove(ref('parties/' + code + '/' + pid));
      else await rtdb.update(ref('parties/' + code + '/' + pid), { guest: null, ['members/' + me]: null });
      writes++;
    } catch (e) {}
    clearPartyLocal();
    renderStrip();
  }
  function onSwitchOff(){
    const freshDrop = party.recentDrop && Date.now() - party.recentDrop < 2000;
    if (!(inParty() || party.ask || freshDrop)) return;
    party.leaving = true;
    party.recentDrop = 0;
    closeAsk();
    if (inParty() && party.host === me && party.code && party.pid && rtdb) {
      const path = partyPath();
      try { rtdb.remove(ref(path)).catch(() => {}); } catch (e) {}
    }
    clearPartyLocal(true);
    if (H) H.toast(NET_TEXT.solo_status);
    renderStrip();
  }
  function renderStrip(){
    const strip = document.querySelector('#coopStrip');
    if (!strip || !H) return;
    const head = strip.querySelector('.coop-head');
    const box = strip.querySelector('.coop-heads');
    if (party.solo && !inParty()) {
      strip.hidden = false;
      if (head) head.textContent = NET_TEXT.solo_status;
      if (box) { box.textContent = ''; box.dataset.sig = ''; }
      return;
    }
    if (!inParty() || !COOP_CFG.on) { strip.hidden = true; return; }
    const members = (party.data && party.data.members) || {};
    const ids = Object.keys(members);
    if (!ids.length) { strip.hidden = true; return; }
    ids.sort((a, b) => (a === me ? -1 : b === me ? 1 : (a < b ? -1 : 1)));
    if (head) head.textContent = COOP_VOTE.label + ' ' + ids.length + '/' + COOP_VOTE.maxMembers;
    if (!box) { strip.hidden = false; return; }
    const sig = ids.map(uid => {
      const m = members[uid] || {};
      return uid + ':' + (m.away ? 1 : 0) + ':' + awayLeft(m) + ':' + ((m.pet && m.pet.form) || '');
    }).join('|');
    strip.hidden = false;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    box.textContent = '';
    ids.forEach(uid => {
      const m = members[uid] || {};
      const b = el('button', 'coop-head-btn' + (m.away === 1 ? ' away' : ''));
      b.type = 'button';
      const who = clampName(holderName(uid));
      b.setAttribute('aria-label', who);
      const cv = el('canvas'); cv.width = cv.height = 18;
      const form = (m.pet && m.pet.form) || '';
      const bits = form.split('/');
      const spr = bits[0] && H.spr ? H.spr(bits[0], +bits[1] || 0, 0) : null;
      if (spr) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(spr, 0, 0); }
      b.append(cv);
      if (m.away === 1) b.append(el('span', 'coop-count', String(awayLeft(m))));
      b.addEventListener('click', () => openHead(uid));
      box.append(b);
    });
  }
  function openHead(uid){
    if (uid === me) { openCard(null); return; }
    const live = others.get(uid);
    if (live) { openCard(live); return; }
    const m = party.data && party.data.members && party.data.members[uid];
    const form = (m && m.pet && m.pet.form) || '';
    const bits = form.split('/');
    openCard({ uid, pet: { sp: bits[0] || '', st: +bits[1] || 0, lv: (m && m.pet && m.pet.level) || 1 }, title: 0, seals: 0 });
  }
  coop.invite = invite;
  coop.join = joinGroup;
  coop.notNow = notNow;
  coop.leave = leaveGroup;
  coop.renderStrip = renderStrip;

  const api = Object.freeze({
    enabled: true, start, overlayOpen, tapTile, mapEnts, drawFx, renderFriends, coopOn, coop, debug, syncLook,
  });
  window.PPNet = api;
  return api;
})();
