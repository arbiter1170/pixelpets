/* WORLD_CLOCK_TOWN P1 (D363, D368-D372, D379, D390). A faster in-game clock.
   One day is 42 real minutes. Nothing is written to the save. The debug offset lives in
   localStorage pixelpets.clockDebug and is ignored unless ?debug=1 is on. */
const PPClock = (() => {
  const EPOCH = Date.parse('2026-10-19T04:00:00Z');
  const MS = 1750;
  const DAY = 1440;
  const WEEK = DAY * 7;
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const KEY = 'pixelpets.clockDebug';
  const WINDOWS = [
    { id: 'school', days: 'mon-fri', from: 8 * 60, to: 15 * 60 },
    { id: 'after_school', days: 'mon-fri', from: 15 * 60, to: 19 * 60 },
    { id: 'evening', days: 'all', from: 19 * 60, to: 22 * 60 },
    { id: 'late', days: 'all', from: 22 * 60, to: 7 * 60 },
    { id: 'weekend_day', days: 'sat-sun', from: 7 * 60, to: 19 * 60 },
    { id: 'office', days: 'mon-fri', from: 9 * 60, to: 17 * 60 },
  ];

  let waitMs = 0;
  let freezeAt = null;
  let virtual = null;
  let onChange = null;

  function debugOn(){
    try {
      if (typeof location !== 'undefined') {
        const d = new URLSearchParams(location.search).get('debug');
        if (d === '1' || d === 'true') return true;
      }
    } catch (e) {}
    try { if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pixelpets.debug') === '1') return true; } catch (e) {}
    return false;
  }
  function stored(){
    if (!debugOn()) return 0;
    try {
      const n = JSON.parse(localStorage.getItem(KEY));
      return Number.isFinite(n) ? n : 0;
    } catch (e) { return 0; }
  }
  function persist(ms){
    if (!debugOn()) return;
    try { localStorage.setItem(KEY, JSON.stringify(ms)); } catch (e) {}
  }
  function forget(){
    try { localStorage.removeItem(KEY); } catch (e) {}
  }
  function dayOk(spec, idx){
    return spec.split(',').some(part => {
      const p = part.trim();
      if (p === 'weekday') return idx <= 4;
      if (p === 'weekend') return idx >= 5;
      if (p.indexOf('-') > 0) {
        const ab = p.split('-'), a = DAYS.indexOf(ab[0]), b = DAYS.indexOf(ab[1]);
        return a >= 0 && b >= a && idx >= a && idx <= b;
      }
      return p === DAYS[idx];
    });
  }
  function inSpan(mins, from, to){
    if (from === to) return mins === from;
    if (from < to) return mins >= from && mins < to;
    return mins >= from || mins < to;
  }
  function windowsOf(idx, hh, mm){
    const mins = hh * 60 + mm, out = [];
    for (const w of WINDOWS) if (dayOk(w.days, idx) && inSpan(mins, w.from, w.to)) out.push(w.id);
    return out;
  }
  function phaseOf(hh){
    if (hh >= 5 && hh < 7) return 'dawn';
    if (hh >= 7 && hh < 18) return 'day';
    if (hh >= 18 && hh < 20) return 'dusk';
    return 'night';
  }
  function reading(ms){
    const gameMinute = Math.floor((ms - EPOCH) / MS);
    const dayMin = ((gameMinute % DAY) + DAY) % DAY;
    const idx = ((Math.floor(gameMinute / DAY) % 7) + 7) % 7;
    const hh = Math.floor(dayMin / 60), mm = dayMin % 60;
    const week = Math.floor(gameMinute / WEEK) + 1;
    return {
      day: DAYS[idx], hh, mm, phase: phaseOf(hh), windows: windowsOf(idx, hh, mm),
      week, offsetMs: 0, weather: null, gameMinute, label: LABELS[idx], name: NAMES[idx],
    };
  }
  function effectiveMs(){
    if (debugOn() && freezeAt != null) return EPOCH + freezeAt * MS;
    return Date.now() + (debugOn() ? stored() : 0) + waitMs;
  }
  function now(){
    if (virtual != null) return reading(EPOCH + virtual * MS);
    const ms = effectiveMs();
    const r = reading(ms);
    r.offsetMs = ms - Date.now();
    return r;
  }
  function changed(){ if (onChange) onChange(); }
  function set(day, hh, mm){
    if (!debugOn()) return now();
    const di = DAYS.indexOf(String(day || '').toLowerCase());
    hh = hh | 0; mm = mm | 0;
    if (di < 0 || hh < 0 || hh > 23 || mm < 0 || mm > 59) return now();
    freezeAt = null;
    waitMs = 0;
    const base = Date.now();
    let week = Math.floor(Math.floor((base - EPOCH) / MS) / WEEK);
    if (week < 0) week = 0;
    const target = week * WEEK + di * DAY + hh * 60 + mm;
    persist(EPOCH + target * MS - base);
    changed();
    return now();
  }
  function freeze(on){
    if (!debugOn()) return now();
    if (on === false) freezeAt = null;
    else freezeAt = now().gameMinute;
    changed();
    return now();
  }
  function clear(){
    if (!debugOn()) return now();
    freezeAt = null;
    waitMs = 0;
    forget();
    changed();
    return now();
  }
  function skipToMinute(gm){
    const target = EPOCH + gm * MS;
    waitMs = target - (Date.now() + (debugOn() ? stored() : 0));
    changed();
    return now();
  }
  function match(term){
    if (typeof term !== 'string') return null;
    const t = term.trim();
    const r = now();
    if (t.indexOf('wx:') === 0) return false;
    if (t.indexOf('day:') === 0) return dayOk(t.slice(4), DAYS.indexOf(r.day));
    if (t.indexOf('win:') === 0) return r.windows.indexOf(t.slice(4)) >= 0;
    if (t.indexOf('phase:') === 0) return r.phase === t.slice(6);
    if (t.indexOf('time:') === 0) {
      const m = /^time:(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(t);
      if (!m) return false;
      return inSpan(r.hh * 60 + r.mm, (+m[1]) * 60 + (+m[2]), (+m[3]) * 60 + (+m[4]));
    }
    return null;
  }
  function phaseAt(ms){
    if (ms == null || Math.abs(ms - Date.now()) < 1500) return now().phase;
    return reading(ms).phase;
  }
  function bootUrl(){
    if (!debugOn() || typeof location === 'undefined') return;
    let raw = null;
    try { raw = new URLSearchParams(location.search).get('clock'); } catch (e) {}
    const m = /^([a-z]{3})-(\d{2})(\d{2})$/.exec(String(raw || '').toLowerCase());
    if (!m || DAYS.indexOf(m[1]) < 0) return;
    const hh = +m[2], mm = +m[3];
    if (hh > 23 || mm > 59) return;
    set(m[1], hh, mm);
  }
  bootUrl();

  return {
    EPOCH, MS, DAY, WEEK, DAYS, LABELS, NAMES,
    reading, now, set, freeze, clear, skipToMinute, match,
    weatherAt: () => null,
    phase: phaseAt,
    lampsOn: () => { const r = now(); return r.hh >= 19 || r.hh < 6; },
    inWindow: id => now().windows.indexOf(id) >= 0,
    gameMinute: () => now().gameMinute,
    atMinute: gm => reading(EPOCH + gm * MS),
    withMinute: (gm, fn) => { const prev = virtual; virtual = gm; try { return fn(); } finally { virtual = prev; } },
    setOnChange: fn => { onChange = fn; },
    debugOn,
  };
})();
if (typeof window !== 'undefined') window.PPClock = PPClock;
if (typeof module !== 'undefined' && module.exports) module.exports = PPClock;
