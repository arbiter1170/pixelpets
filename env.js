/* PixelPets environment: real-world location + weather -> spawn tags. No dependencies, no API keys.
   Privacy: coordinates are rounded to 2 decimals (~1 km) BEFORE any network call or storage.
   Sources (all free, CORS-enabled, keyless):
     - Open-Meteo forecast   (temperature, weather code, is_day, wind, elevation)
     - Open-Meteo elevation  (5-point grid ~1 km apart -> local relief, for "steep" terrain)
     - OSM Overpass API      (water / urban / buildings / forest / parks within ~350 m; mirror fallback)
     - OSM Nominatim reverse (fallback "is this a city?" when Overpass is busy)
   Results are cached in localStorage key `pixelpets.env` (weather 30 min, terrain 7 days), separate from the save. */
'use strict';
const PPEnv = (() => {
  const GEO_KEY = 'pixelpets.geo';            // 'allow' | 'deny' (the in-game card choice)
  const CACHE_KEY = 'pixelpets.env';
  const OVERRIDE_KEY = 'pixelpets.envOverride';
  const WEATHER_TTL = 30 * 60e3, TERRAIN_TTL = 7 * 24 * 3600e3, TERRAIN_RETRY = 30 * 60e3;
  const RADIUS = 350;                         // metres for the Overpass "what's nearby" lookup
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
  const TERRAIN_TAGS = ['mountain', 'city', 'water', 'forest', 'park', 'meadow'];   // label priority
  const TERRAIN_LABEL = { mountain: 'Mountain', city: 'City', water: 'Waterside', forest: 'Forest', park: 'Park', meadow: 'Meadow' };
  const WEATHER_LABEL = { storm: 'Storm', snow: 'Snow', rain: 'Rain', fog: 'Fog', windy: 'Windy' };
  const ALL_TAGS = ['mountain', 'water', 'city', 'forest', 'park', 'meadow', 'rain', 'snow', 'storm', 'fog', 'windy', 'hot', 'cold', 'night'];
  const PRESETS = {
    meadow:   { name: 'Meadow',   tags: ['meadow'], temp: 18 },
    city:     { name: 'City',     tags: ['city'], temp: 16 },
    cityrain: { name: 'City rain', tags: ['city', 'rain'], temp: 12 },
    mountain: { name: 'Mountain', tags: ['mountain', 'cold'], temp: 2 },
    lake:     { name: 'Lake',     tags: ['water', 'park'], temp: 21 },
    forest:   { name: 'Forest',   tags: ['forest'], temp: 15 },
    desert:   { name: 'Desert',   tags: ['meadow', 'hot'], temp: 38, place: 'Desert' },
    snow:     { name: 'Snowfield', tags: ['mountain', 'snow', 'cold'], temp: -6 },
    storm:    { name: 'Stormy coast', tags: ['water', 'storm', 'rain', 'windy'], temp: 14 },
    night:    { name: 'Night',    tags: ['meadow', 'night'], temp: 10 },
  };

  const round2 = v => Math.round(v * 100) / 100;
  const ls = {
    get(k){ try { return localStorage.getItem(k); } catch(e) { return null; } },
    set(k, v){ try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e) {} },
    json(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } },
  };
  async function getJson(url, ms){
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }

  /* WMO weather code -> word. https://open-meteo.com/en/docs (weather_code) */
  function wmo(code){
    if (code == null) return null;
    if (code >= 95) return 'storm';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 2) return 'cloudy';
    return 'clear';
  }
  const clockNight = (ms = Date.now()) => { const h = new Date(ms).getHours(); return h >= 20 || h < 6; };

  async function fetchWeather(lat, lon){
    const j = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,wind_speed_10m`, 9000);
    const c = j.current || {};
    if (typeof c.temperature_2m !== 'number') throw new Error('bad weather payload');
    return { temp: c.temperature_2m, code: c.weather_code, isDay: c.is_day, wind: c.wind_speed_10m, elev: j.elevation, at: Date.now() };
  }
  async function fetchRelief(lat, lon){
    const d = 0.01, la = [lat, lat + d, lat - d, lat, lat].map(round2), lo = [lon, lon, lon, lon + d, lon - d].map(round2);
    const j = await getJson(`https://api.open-meteo.com/v1/elevation?latitude=${la.join(',')}&longitude=${lo.join(',')}`, 9000);
    const e = (j.elevation || []).filter(v => typeof v === 'number');
    if (!e.length) throw new Error('bad elevation payload');
    return { elev: e[0], relief: Math.round(Math.max(...e) - Math.min(...e)) };
  }
  function overpassQuery(lat, lon){   // 5 tiny counts; ways only (areas/lines), short server timeout
    const a = `(around:${RADIUS},${lat},${lon})`;
    return `[out:json][timeout:10];` +
      `(way${a}[natural~"^(water|coastline|beach|bay)$"];way${a}[waterway~"^(river|stream|canal)$"];rel${a}[natural=water];);out count;` +
      `way${a}[landuse~"^(residential|commercial|retail|industrial)$"];out count;` +
      `way${a}[building];out count;` +
      `(way${a}[landuse=forest];way${a}[natural=wood];);out count;` +
      `way${a}[leisure~"^(park|nature_reserve|garden)$"];out count;`;
  }
  async function fetchOverpass(lat, lon){
    const q = encodeURIComponent(overpassQuery(lat, lon)); let last;
    for (const host of OVERPASS) {
      try {
        const j = await getJson(host + '?data=' + q, 15000);
        const n = (j.elements || []).map(e => +(e.tags && e.tags.total) || 0);
        if (n.length === 5) return { water: n[0], urban: n[1], buildings: n[2], forest: n[3], park: n[4] };
        last = new Error('bad overpass payload');
      } catch(e) { last = e; }
    }
    throw last || new Error('overpass failed');
  }
  async function fetchPlace(lat, lon){
    const j = await getJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`, 8000);
    const a = j.address || {};
    return { urban: !!(a.city || a.suburb || a.quarter || a.city_district || a.borough || a.neighbourhood), name: j.name || a.city || a.town || a.village || null };
  }
  async function fetchTerrain(lat, lon){
    const [rel, osm] = await Promise.allSettled([fetchRelief(lat, lon), fetchOverpass(lat, lon)]);
    const t = { at: Date.now(), relief: null, elev: null, osm: null, place: null, partial: false };
    if (rel.status === 'fulfilled') Object.assign(t, rel.value); else t.partial = true;
    if (osm.status === 'fulfilled') t.osm = osm.value;
    else { t.partial = true; try { t.place = await fetchPlace(lat, lon); } catch(e) {} }
    if (t.elev == null && !t.osm && !t.place) throw new Error('terrain lookups failed');
    return t;
  }

  /* Tag rules (documented in README). */
  function deriveTags(weather, terrain, now = Date.now()){
    const tags = new Set();
    const elev = terrain && terrain.elev != null ? terrain.elev : weather ? weather.elev : null;
    if ((elev != null && elev >= 800) || (terrain && terrain.relief >= 150)) tags.add('mountain');
    const o = terrain && terrain.osm;
    if (o) {
      if (o.water > 0) tags.add('water');
      if (o.urban >= 3 || o.buildings >= 40) tags.add('city');
      if (o.forest > 0) tags.add('forest');
      if (o.park > 0) tags.add('park');
    } else if (terrain && terrain.place && terrain.place.urban) tags.add('city');
    if (!TERRAIN_TAGS.some(t => t !== 'meadow' && tags.has(t))) tags.add('meadow');
    if (weather) {
      const w = wmo(weather.code);
      if (w === 'storm') { tags.add('storm'); tags.add('rain'); }
      else if (w === 'rain' || w === 'snow' || w === 'fog') tags.add(w);
      if (weather.temp >= 28) tags.add('hot');
      if (weather.temp <= 3) tags.add('cold');
      if (weather.wind >= 30) tags.add('windy');
      if (weather.isDay === 0) tags.add('night');
    } else if (clockNight(now)) tags.add('night');
    return ALL_TAGS.filter(t => tags.has(t));
  }
  function labelFor(tags, temp, place){
    const terr = place || TERRAIN_LABEL[TERRAIN_TAGS.find(t => tags.includes(t)) || 'meadow'];
    const wkey = ['storm', 'snow', 'rain', 'fog', 'windy'].find(t => tags.includes(t));
    const weather = wkey ? WEATHER_LABEL[wkey] : tags.includes('night') ? 'Night' : null;
    return [terr, weather, temp != null && isFinite(temp) ? Math.round(temp) + '\u00b0C' : null].filter(Boolean).join(' \u00b7 ');
  }

  /* ---------- state ---------- */
  let env = null, listener = null, busy = null;
  const emit = () => { if (listener) listener(env); };
  function build(tags, extra){
    return Object.assign({ tags, temp: null, label: '', source: 'default', status: 'off', coords: null, place: null, updated: Date.now(), detail: '' }, extra,
      { label: labelFor(tags, extra && extra.temp, extra && extra.placeLabel) });
  }
  function fallback(status){   // "meadow" + device-clock night; used when location is off/denied/offline
    return build(deriveTags(null, null), { source: 'default', status });
  }
  function fromCache(c, status){
    const w = c.weather && Date.now() - c.weather.at < 6 * 3600e3 ? c.weather : null;   // very old weather is worse than none
    const tags = deriveTags(w, c.terrain);
    return build(tags, { source: 'location', status, coords: c.key, temp: w ? w.temp : null, place: c.terrain && c.terrain.place ? c.terrain.place.name : null,
      updated: Math.max(w ? w.at : 0, c.terrain ? c.terrain.at : 0), detail: describe(c) });
  }
  function describe(c){
    const parts = [];
    if (c.weather) parts.push('weather ' + Math.round((Date.now() - c.weather.at) / 60e3) + ' min old');
    if (c.terrain) parts.push(c.terrain.osm ? 'map data' : c.terrain.place ? 'place lookup (map data busy)' : 'elevation only');
    return parts.join(', ');
  }
  function overrideEnv(){
    const o = ls.json(OVERRIDE_KEY); if (!o) return null;
    const p = o.preset && PRESETS[o.preset];
    if (p) return build(p.tags.slice(), { source: 'manual', status: 'manual', temp: p.temp, placeLabel: p.place, preset: o.preset });
    if (Array.isArray(o.tags)) { const tags = ALL_TAGS.filter(t => o.tags.includes(t)); return build(tags.length ? tags : ['meadow'], { source: 'manual', status: 'manual', temp: o.temp != null ? o.temp : null }); }
    return null;
  }
  const geoPref = () => ls.get(GEO_KEY);
  function setGeoPref(v){ ls.set(GEO_KEY, v); }

  function init(onChange){
    listener = onChange;
    env = overrideEnv();
    if (!env) {
      const c = ls.json(CACHE_KEY);
      env = c && c.key && geoPref() === 'allow' ? fromCache(c, 'cached') : fallback(geoPref() === 'deny' ? 'off' : 'off');
    }
    return env;
  }
  function locate(){
    return new Promise((res, rej) => {
      if (!window.isSecureContext || !navigator.geolocation) return rej(Object.assign(new Error('unavailable'), { code: 'unavailable' }));
      navigator.geolocation.getCurrentPosition(p => res(p.coords), e => rej(Object.assign(new Error(e.message || 'denied'), { code: e.code === 1 ? 'denied' : 'unavailable' })),
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60e3 });
    });
  }
  // Refresh from the device location (only when the player allowed it). Never throws; always ends with an env.
  function refresh(force){
    if (busy) return busy;
    busy = (async () => {
      if (geoPref() !== 'allow') return env;
      const manual = !!ls.json(OVERRIDE_KEY);
      const setEnv = e => { if (!manual) { env = e; emit(); } };
      const prev = env;
      setEnv(Object.assign({}, env, { status: 'loading' }));      // badge shows "..." right away
      let lat, lon;
      try { const c = await locate(); lat = round2(c.latitude); lon = round2(c.longitude); }
      catch(e) {
        // a one-off GPS timeout on a periodic refresh keeps the last real area; a denial always falls back
        if (e.code !== 'denied' && prev && prev.source !== 'default' && prev.source !== 'manual') { setEnv(prev); return env; }
        setEnv(fallback(e.code === 'denied' ? 'denied' : 'unavailable')); return env; }
      const key = lat.toFixed(2) + ',' + lon.toFixed(2);
      let c = ls.json(CACHE_KEY); if (!c || c.key !== key) c = { key, weather: null, terrain: null };
      const now = Date.now();
      const needW = force || !c.weather || now - c.weather.at > WEATHER_TTL;
      const needT = force || !c.terrain || now - c.terrain.at > (c.terrain.partial ? TERRAIN_RETRY : TERRAIN_TTL);
      if (!needW && !needT) { setEnv(fromCache(c, 'ok')); return env; }
      setEnv(Object.assign(fromCache(c, 'loading'), { status: 'loading' }));
      const save = () => ls.set(CACHE_KEY, JSON.stringify(c));
      const jobs = [];
      let failed = 0;
      if (needW) jobs.push(fetchWeather(lat, lon).then(w => { c.weather = w; save(); setEnv(fromCache(c, 'loading')); }, () => { failed++; }));
      if (needT) jobs.push(fetchTerrain(lat, lon).then(t => { c.terrain = t; save(); setEnv(fromCache(c, 'loading')); }, () => { failed++; }));
      await Promise.all(jobs);
      if (!c.weather && !c.terrain) setEnv(fallback('offline'));
      else setEnv(fromCache(c, failed ? 'partial' : (c.terrain && c.terrain.partial ? 'partial' : 'ok')));
      return env;
    })().finally(() => { busy = null; });
    return busy;
  }
  function setOverride(x){
    if (x == null || x === 'auto') { ls.set(OVERRIDE_KEY, null); const c = ls.json(CACHE_KEY); env = c && c.key && geoPref() === 'allow' ? fromCache(c, 'cached') : fallback('off'); emit(); refresh(); return env; }
    if (typeof x === 'string') { if (!PRESETS[x]) throw new Error('Unknown preset ' + x + '. Try: ' + Object.keys(PRESETS).join(', ')); ls.set(OVERRIDE_KEY, JSON.stringify({ preset: x })); }
    else if (Array.isArray(x)) ls.set(OVERRIDE_KEY, JSON.stringify({ tags: x }));
    else if (typeof x === 'object') ls.set(OVERRIDE_KEY, JSON.stringify({ tags: x.tags || [], temp: x.temp }));
    env = overrideEnv(); emit(); return env;
  }
  // Recompute time-dependent bits (device-clock night for the fallback) without any network.
  function tick(){ if (env && env.source === 'default') { const e = fallback(env.status); if (e.label !== env.label) { env = e; emit(); } } }

  return { init, refresh, setOverride, tick, geoPref, setGeoPref, get current(){ return env; },
    PRESETS, ALL_TAGS, deriveTags, labelFor, wmo, round2, overpassQuery, WEATHER_TTL, TERRAIN_TTL };
})();
