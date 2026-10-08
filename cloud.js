/* Walklings online saves, Phase 1: anonymous sign-in + one private cloud backup per player (design ONLINE_SAVES_SCOPE.md).
   OFF unless cloud_config.js holds a real config (or, on localhost only, ?cloud=emu for the Firebase Local Emulator Suite).
   When OFF: no Firebase SDK is loaded, no network call is made, no UI is added; every hook below is a no-op.
   When ON:
   - localStorage (pixelpets.save.v2) stays the main and offline copy. Boot never waits for the network; the SDK loads
     afterwards from Google's CDN (pinned), and if it fails the game plays exactly as it does without it.
   - Cloud doc saves/{firebaseUid} = { data: "<save JSON>", v: 2, rev, updatedAt } (see firestore.rules).
   - Device bookkeeping lives in pixelpets.cloud (outside the save): { fbUid, syncedRev, syncedHash, pending, pendingErase, paused, lastSyncAt, adopted }.
   - "Real changes" = the save minus `last`/`rev`/`updatedAt` and the drifting care/HP numbers (hunger, happy, energy, hpNow),
     so the 5 s heartbeat and passive decay never upload on their own. Uploads: at most once a minute, plus on tab hide / pagehide.
   - Load compare by rev: cloud unchanged -> local wins; local unchanged + cloud changed -> adopt quietly (write v2, reload);
     both changed -> ask (two summaries side by side), the game not kept goes to pixelpets.cloud.backup. Never merge.
   - A cloud save from a newer format (v > 2) is never overwritten or adopted. */
'use strict';
const PPCloud = (() => {
  const CLOUD_KEY = 'pixelpets.cloud', BACKUP_KEY = 'pixelpets.cloud.backup';
  const SDK_VERSION = '13.0.0', CDN = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/';
  const LABEL = 'This browser only: link Google to keep it safe';
  const q = (() => { try { return new URLSearchParams(location.search); } catch(e) { return new URLSearchParams(''); } })();
  const LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  const EMU = LOCAL && q.get('cloud') === 'emu';
  const CFG = EMU ? { apiKey: 'demo-key', authDomain: 'demo-walklings.firebaseapp.com', projectId: 'demo-walklings', appId: 'demo-walklings' }
    : (window.PP_CLOUD_CONFIG && typeof window.PP_CLOUD_CONFIG === 'object' && window.PP_CLOUD_CONFIG.apiKey && window.PP_CLOUD_CONFIG.projectId ? window.PP_CLOUD_CONFIG : null);
  const noop = () => {};
  if (!CFG) return Object.freeze({ enabled: false, CLOUD_KEY, BACKUP_KEY, start: noop, overlayOpen: () => false, startOver: wipe => { wipe(); return Promise.resolve(true); }, info: () => ({ enabled: false }) });

  const num = (k, d) => { const v = +q.get(k); return EMU && Number.isFinite(v) && v > 0 ? v : d; };   // test knobs, emulator only
  const GAP = num('cloudGap', 60000), TICK = num('cloudTick', 10000), NET_WAIT = num('cloudWait', 10000), LOAD_WAIT = 20000;
  const EMU_AUTH = 'http://127.0.0.1:' + num('authPort', 9099), EMU_FS_PORT = num('fsPort', 8080);

  /* ---------- device key ---------- */
  const DEV0 = () => ({ fbUid: null, syncedRev: 0, syncedHash: null, pending: null, pendingErase: false, paused: false, lastSyncAt: 0, adopted: false });
  function readDev(){ let o = null; try { o = JSON.parse(localStorage.getItem(CLOUD_KEY)); } catch(e) {} return Object.assign(DEV0(), o && typeof o === 'object' ? o : {}); }
  function writeDev(patch){ const d = Object.assign(readDev(), patch); try { localStorage.setItem(CLOUD_KEY, JSON.stringify(d)); } catch(e) {} return d; }

  /* ---------- change detection ---------- */
  const DRIFT = ['hunger', 'happy', 'energy', 'hpNow'];
  function hashOf(s){
    if (!s) return null;
    const c = JSON.parse(JSON.stringify(s)); delete c.last; delete c.rev; delete c.updatedAt;
    for (const list of [c.party, c.box]) if (Array.isArray(list)) list.forEach(p => { if (p && typeof p === 'object') DRIFT.forEach(k => delete p[k]); });
    const str = JSON.stringify(c); let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16) + ':' + str.length;
  }
  const petsIn = s => !!s && ((Array.isArray(s.party) && s.party.length) || (Array.isArray(s.box) && s.box.length));

  /* ---------- state ---------- */
  let H = null, fb = null, auth = null, db = null, user = null;
  let status = 'starting', compared = false, inflight = null, lastUpload = 0, lastSeen = null, conflict = null, lastErr = null;
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'timeout' })), ms))]);
  const ref = () => fb.fs.doc(db, 'saves', user.uid);
  const denied = e => e && /permission/i.test(String(e.code || e.message));
  function setStatus(s){ status = s; renderRow(); renderPanel(); }

  async function loadSdk(){
    const [app, au, fs] = await withTimeout(Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => import(CDN + f))), LOAD_WAIT);
    fb = { app, au, fs };
    const a = app.initializeApp(CFG, 'walklings');
    auth = au.getAuth(a); db = fs.getFirestore(a);
    if (EMU) { au.connectAuthEmulator(auth, EMU_AUTH, { disableWarnings: true }); fs.connectFirestoreEmulator(db, '127.0.0.1', EMU_FS_PORT); }
    user = await new Promise(res => { const off = au.onAuthStateChanged(auth, u => { off(); res(u); }); });
    if (!user) user = (await withTimeout(au.signInAnonymously(auth), NET_WAIT)).user;
  }

  async function start(hooks){
    H = hooks; buildRow();
    // Just reloaded into an adopted cloud save: boot normalized it (and applied away-time), so re-take its fingerprint before any play.
    if (readDev().adopted) { const S0 = H.getState(); writeDev({ adopted: false, syncedHash: S0 ? hashOf(S0) : null }); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); else renderRow(); });
    window.addEventListener('pagehide', flush);
    try { await loadSdk(); }
    catch(e) { lastErr = String(e && (e.code || e.message)); setStatus('unavailable'); return; }   // plays exactly as without cloud
    const d = readDev();
    if (d.fbUid !== user.uid) writeDev({ fbUid: user.uid, syncedRev: 0, syncedHash: null, pending: null, paused: false });   // a new anonymous account: nothing synced yet
    setStatus('ok');
    await sync();
    setInterval(sync, TICK);
  }

  // One step of the loop: pending erase -> load compare (once) -> upload when changed (debounced).
  async function sync(force){
    if (!user || inflight || conflict || status === 'newer') return;
    const d = readDev();
    if (d.pendingErase) { await erase(); return; }
    if (!compared) { await compare(); return; }
    const S = H.getState();
    if (!S || d.paused) return;
    const h = hashOf(S);
    if (h !== lastSeen) { if (lastSeen !== null || h !== d.syncedHash) S.updatedAt = Date.now(); lastSeen = h; }
    if (h === d.syncedHash || !petsIn(S)) return;
    if (!force && Date.now() - lastUpload < GAP) return;
    await upload(d.syncedRev + 1);
  }
  function flush(){ if (compared && !conflict) sync(true); }

  async function compare(){
    let snap;
    try { snap = await withTimeout(fb.fs.getDocFromServer(ref()), NET_WAIT); }
    catch(e) { lastErr = String(e.code || e.message); setStatus('offline'); return; }
    const d = readDev(), S = H.getState(), local = hashOf(S);
    compared = true; lastSeen = local;
    if (!snap.exists()) {
      if (d.syncedRev > 0 && !d.paused) {          // it was backed up, and now it's gone (deleted from another tab or device)
        writeDev({ syncedRev: 0, syncedHash: null, pending: null, paused: true });
        setStatus('gone'); H.toast('Your cloud save was deleted. You can back up again in Settings.');
        return;
      }
      writeDev({ syncedRev: 0, pending: null }); setStatus('ok');
      return sync(true);
    }
    const c = snap.data();
    if (!Number.isInteger(c.v) || c.v > 2) { setStatus('newer'); return; }   // SAVE_V2 §7.1: never overwrite or adopt
    const cloudHash = (() => { try { return hashOf(JSON.parse(c.data)); } catch(e) { return null; } })();
    if (d.pending && d.pending.rev === c.rev && d.pending.hash === cloudHash) { writeDev({ syncedRev: c.rev, syncedHash: cloudHash, pending: null }); return compareDone(); }   // our own write landed before the page closed
    if (c.rev === d.syncedRev) return compareDone();                                    // cloud unchanged: local wins
    if (local === d.syncedHash || cloudHash === local || !petsIn(S)) {                  // local unchanged, the same game, or no game yet: cloud wins quietly                                // local unchanged (or the same game): cloud wins quietly
      writeDev({ syncedRev: c.rev, syncedHash: cloudHash, pending: null, paused: false, lastSyncAt: Date.now(), adopted: cloudHash !== local });
      if (cloudHash === local) return compareDone();
      H.adopt(c.data); return;
    }
    conflict = { cloud: c, cloudHash }; showConflict();                                 // both changed: ask, never merge
  }
  function compareDone(){ setStatus('ok'); return sync(true); }

  async function upload(rev){
    const S = H.getState(), d = readDev();
    if (!S || !user) return;
    const c = JSON.parse(JSON.stringify(S)); c.rev = rev; if (!Number.isFinite(c.updatedAt)) c.updatedAt = Date.now();
    const data = JSON.stringify(c), hash = hashOf(c);
    writeDev({ pending: { rev, hash } });
    lastUpload = Date.now(); setStatus('saving');
    const p = fb.fs.setDoc(ref(), { data, v: 2, rev, updatedAt: Math.round(c.updatedAt) });
    inflight = p;
    const slow = setTimeout(() => { if (inflight === p) setStatus('offline'); }, NET_WAIT);   // the write stays queued; one at a time
    try {
      await p;
      writeDev({ syncedRev: rev, syncedHash: hash, pending: null, lastSyncAt: Date.now() });
      const cur = H.getState(); if (cur && cur.uid === c.uid) { cur.rev = rev; H.save(); }
      lastErr = null; setStatus('ok');
    } catch(e) {
      lastErr = String(e.code || e.message); writeDev({ pending: null });
      if (denied(e)) { compared = false; setStatus('ok'); }                 // stale rev: someone else wrote first -> compare again
      else setStatus('offline');
    } finally { clearTimeout(slow); inflight = null; }
    if (!compared) sync();
  }

  async function erase(){
    const p = fb.fs.deleteDoc(ref()); inflight = p; setStatus('saving');
    try { await withTimeout(p, NET_WAIT); writeDev({ pendingErase: false, syncedRev: 0, syncedHash: null, pending: null, lastSyncAt: 0 }); compared = false; setStatus(readDev().paused ? 'paused' : 'ok'); }
    catch(e) { lastErr = String(e.code || e.message); setStatus('offline'); }
    finally { if (inflight === p) inflight = null; }
    if (!readDev().pendingErase && !readDev().paused) sync();
  }

  // Start over: erase the cloud copy (up to a few seconds), then wipe locally; if the erase didn't go through, it runs before the next upload.
  async function startOver(wipe){
    let ok = false;
    if (user && db) { try { await withTimeout(fb.fs.deleteDoc(ref()), Math.min(NET_WAIT, 4000)); ok = true; } catch(e) { lastErr = String(e.code || e.message); } }
    wipe();                                                    // PPSave.startOver: also clears pixelpets.cloud and the backup
    if (!ok) try { localStorage.setItem(CLOUD_KEY, JSON.stringify(Object.assign(DEV0(), { fbUid: user ? user.uid : null, pendingErase: true }))); } catch(e) {}
    return ok;
  }

  /* ---------- UI: the Settings row, the panel and the "which game to keep" choice (built only when ON) ---------- */
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function ago(t){
    if (!t) return '';
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    const dd = Math.round(h / 24); return dd + (dd === 1 ? ' day ago' : ' days ago');
  }
  function stateLine(){
    const d = readDev();
    if (status === 'newer') return 'A newer version has this cloud save. Not backing up here.';
    if (d.paused || status === 'gone') return 'Not backed up';
    if (status === 'offline' || status === 'unavailable' || d.pendingErase) return 'Offline, will back up later';
    if (status === 'saving') return 'Backing up...';
    if (d.lastSyncAt) return 'Backed up ' + ago(d.lastSyncAt);
    return 'Not backed up yet';
  }
  let row = null, ov = null, panelMode = null;
  function buildRow(){
    const list = document.querySelector('#ovSettings .set-list');
    if (!list || row) return;
    row = el('button', 'set-row set-cloud'); row.type = 'button'; row.id = 'setCloud';
    const lab = el('span', 'set-lab'); lab.append(el('span', 'set-cloud-t', 'Cloud save'), el('span', 'set-sub', LABEL));
    row.append(lab, el('span', 'set-val', '\u203a'));
    list.append(row);
    row.addEventListener('click', () => { H.sfx('tap'); openPanel(); });
    renderRow();
  }
  function renderRow(){
    if (!row) return;
    const s = stateLine(), sub = row.querySelector('.set-sub');
    sub.textContent = /^Backed up|^Backing|^Not backed up yet/.test(s) ? LABEL : s;
    row.setAttribute('aria-label', 'Cloud save: ' + sub.textContent);
  }
  function overlay(){
    if (ov) return ov;
    ov = el('div', 'overlay cloud-ov'); ov.id = 'ovCloud'; ov.hidden = true;
    const inner = el('div', 'ov-inner cloud-inner'); inner.setAttribute('role', 'dialog'); inner.setAttribute('aria-modal', 'true');
    ov.append(inner); document.body.append(ov);
    ov.addEventListener('click', e => { if (e.target === ov && panelMode !== 'conflict') closeOverlay(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden && panelMode !== 'conflict') { e.stopImmediatePropagation(); closeOverlay(); } }, true);
    return ov;
  }
  const isOpen = () => !!ov && !ov.hidden;
  function closeOverlay(){ if (!isOpen()) return; ov.hidden = true; panelMode = null; H.afterOverlay(); }
  const btn = (text, cls, fn) => { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; b.addEventListener('click', () => { H.sfx('tap'); fn(); }); return b; };
  function openPanel(confirm){
    overlay(); panelMode = confirm ? 'confirm' : 'panel'; ov.hidden = false; renderPanel();
    const f = ov.querySelector('button'); if (f) f.focus({ preventScroll: true });
  }
  function renderPanel(){
    if (!isOpen() || (panelMode !== 'panel' && panelMode !== 'confirm')) return;
    const inner = ov.firstChild; inner.textContent = '';
    inner.setAttribute('aria-labelledby', 'cloudTitle');
    const t = el('div', 'ov-title', 'Cloud save'); t.id = 'cloudTitle'; inner.append(t);
    const d = readDev();
    if (panelMode === 'confirm') {
      inner.append(el('p', 'reset-msg', 'Delete your cloud save? Your game stays on this device.'));
      const a = el('div', 'actions two-even');
      a.append(btn('CANCEL', '', () => openPanel()), btn('DELETE', 'btn-danger', deleteCloud));
      inner.append(a); return;
    }
    inner.append(el('p', 'cloud-label', LABEL + '.'));
    inner.append(el('p', 'hint cloud-state', stateLine() + '.'));
    inner.append(el('p', 'hint cloud-note', "Backups are tied to this browser. If its site data is cleared, the backup can't be reached. Linking Google is coming soon."));
    inner.append(el('p', 'hint cloud-privacy', 'Walklings keeps a copy of your game with Google Firebase so you can restore it. We only store your game save and an account ID. You can delete your cloud save here.'));
    const a = el('div', 'actions cloud-actions');
    if (status !== 'newer') {
      if (d.paused || status === 'gone') a.append(btn('BACK UP THIS GAME', 'btn-play', resume));
      else a.append(btn('DELETE CLOUD SAVE', 'btn-danger', () => openPanel(true)));
    }
    a.append(btn('CLOSE', '', closeOverlay));
    inner.append(a);
  }
  async function deleteCloud(){
    writeDev({ paused: true, pendingErase: true, syncedRev: 0, syncedHash: null, pending: null });
    openPanel(); if (status === 'gone') status = 'paused';
    if (user) { if (inflight) try { await inflight; } catch(e) {} await erase(); }
    renderRow(); renderPanel(); H.toast(readDev().pendingErase ? 'Cloud save will be deleted when you are back online.' : 'Cloud save deleted. Your game is still on this device.');
  }
  function resume(){ writeDev({ paused: false, syncedRev: 0, syncedHash: null, pending: null }); compared = false; setStatus('ok'); renderPanel(); sync(true); }

  // Both changed: wait until nothing else is on screen, then ask. The game not kept is saved once as a local backup.
  function showConflict(){
    if (!conflict) return;
    if (H.busy() || isOpen()) { setTimeout(showConflict, 1000); return; }
    overlay(); panelMode = 'conflict'; ov.hidden = false; H.beforeOverlay();
    const inner = ov.firstChild; inner.textContent = ''; inner.setAttribute('aria-labelledby', 'cloudTitle');
    const t = el('div', 'ov-title', 'Which game to keep?'); t.id = 'cloudTitle'; inner.append(t);
    inner.append(el('p', 'hint', 'This game changed here and in your cloud save. Pick the one to keep on this device. The other is kept once as a backup on this device.'));
    const local = JSON.stringify(H.getState()), cards = el('div', 'cloud-cards');
    const card = (title, raw, keep) => {
      const s = H.summary(raw), c = el('div', 'cloud-card');
      c.append(el('div', 'cloud-card-t', title));
      if (s && s.sp != null) { const cv = el('canvas', 'cloud-card-art'); cv.width = cv.height = 18; H.drawPet(cv, s.sp, s.stage); c.append(cv); }
      c.append(el('div', 'cloud-card-n', s ? (s.partner || 'No partner yet') : 'Unreadable save'));
      if (s) { c.append(el('div', 'cloud-card-l', s.pets + (s.pets === 1 ? ' Walkling' : ' Walklings'))); c.append(el('div', 'cloud-card-l', s.seals + (s.seals === 1 ? ' Seal' : ' Seals'))); c.append(el('div', 'cloud-card-l', 'Played ' + ago(s.last))); }
      const b = btn('KEEP THIS', 'btn-play', keep); b.disabled = !s; c.append(b);
      return c;
    };
    cards.append(card('THIS DEVICE', local, () => keep('device', local)), card('CLOUD SAVE', conflict.cloud.data, () => keep('cloud', local)));
    inner.append(cards);
    const f = inner.querySelector('.cloud-card button'); if (f) f.focus({ preventScroll: true });
  }
  async function keep(which, local){
    const c = conflict; if (!c) return;
    try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: Date.now(), kept: which, from: which === 'device' ? 'cloud' : 'device', data: which === 'device' ? c.cloud.data : local })); } catch(e) {}
    conflict = null; compared = true;
    if (which === 'cloud') { writeDev({ syncedRev: c.cloud.rev, syncedHash: c.cloudHash, pending: null, paused: false, lastSyncAt: Date.now(), adopted: true }); H.adopt(c.cloud.data); return; }
    ov.hidden = true; panelMode = null; H.afterOverlay();
    writeDev({ syncedRev: c.cloud.rev, paused: false });
    await upload(c.cloud.rev + 1);
  }

  const info = () => ({ enabled: true, emu: EMU, sdk: SDK_VERSION, status, compared, conflict: !!conflict, inflight: !!inflight, fbUid: user && user.uid, dev: readDev(), lastErr, gap: GAP, row: row ? row.querySelector('.set-sub').textContent : null, state: stateLine() });
  return Object.freeze({ enabled: true, emu: EMU, CLOUD_KEY, BACKUP_KEY, LABEL, start, overlayOpen: isOpen, startOver, info, syncNow: () => sync(true), hashOf });
})();
