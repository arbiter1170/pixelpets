/* A tiny static file server for the game folder. Node only, so it runs anywhere Node does (no python3 needed).
   Used by tools/iphone_emulate.js and playwright.iphone.config.js. Every file is sent no-store so a reload is always the
   file on disk. Run it alone: node tools/static_server.js [--port 8080] [--host 127.0.0.1] */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webmanifest': 'application/manifest+json',
};

function handler(req, res) {
  let rel;
  try { rel = decodeURIComponent(req.url.split('?')[0]); } catch (e) { rel = '/'; }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  // Stay inside the game folder, and never serve the private design/ or docs/ folders or git internals.
  const inside = file === ROOT || file.startsWith(ROOT + path.sep);
  const hidden = /^[\\/](\.git|node_modules|design|docs)([\\/]|$)/.test(file.slice(ROOT.length));
  if (!inside || hidden) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(buf);
  });
}

// Resolves { server, port, urls } once listening. Port 0 picks a free one.
function start({ port = 8080, host = '127.0.0.1' } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once('error', reject);
    server.listen(port, host, () => {
      const p = server.address().port;
      resolve({ server, port: p, urls: urlsFor(host, p) });
    });
  });
}

// What to type into a phone on the same Wi-Fi: every non-loopback IPv4 address of this computer.
function urlsFor(host, port) {
  if (host !== '0.0.0.0') return ['http://' + host + ':' + port + '/'];
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push('http://' + a.address + ':' + port + '/');
  }
  return out;
}

module.exports = { start, urlsFor, ROOT };

if (require.main === module) {
  const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
  start({ port: +arg('port', 8080), host: arg('host', '127.0.0.1') })
    .then(s => { console.log('Serving ' + ROOT + '\n  ' + s.urls.join('\n  ')); })
    .catch(e => { console.error('Could not start: ' + e.message); process.exit(1); });
}
