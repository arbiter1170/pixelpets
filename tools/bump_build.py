#!/usr/bin/env python3
"""Cache-busting for the live site (no build step for players): stamps every local <script src> and <link href> in
index.html with ?v=<build id> and records the id in <meta name="kw-build"> and in window.BUILD (an inline script the
Settings panel reads for its "Build ..." line, so the label always matches the ?v= stamp). Run before every commit:
    python3 tools/bump_build.py          # new id from the current time (America/New_York), e.g. 20261008-1124
    python3 tools/bump_build.py --check  # exit 1 if any local tag is missing the current id
"""
import re, sys, datetime, pathlib
try:
    from zoneinfo import ZoneInfo; TZ = ZoneInfo('America/New_York')
except Exception:
    TZ = None
HTML = pathlib.Path(__file__).resolve().parent.parent / 'index.html'
TAG = re.compile(r'(<(?:script|link)\b[^>]*?\b(?:src|href)=")([^"]+)(")', re.I)
META = re.compile(r'<meta name="kw-build" content="([^"]*)">')
CONST = re.compile(r'<script>window\.BUILD = "([^"]*)";</script>')

def local(url): return not re.match(r'^(?:[a-z]+:|//|#)', url, re.I)
def current(html): m = META.search(html); return m.group(1) if m else None
def tags(html): return [(m.group(0), m.group(2)) for m in TAG.finditer(html) if local(m.group(2))]

def check(html):
    bid = current(html); bad = [u for _, u in tags(html) if not u.endswith('?v=' + str(bid))]
    c = CONST.search(html)
    if not c or c.group(1) != bid: bad.append('window.BUILD=' + (c.group(1) if c else 'missing'))
    return bid, bad

def stamp(html, bid):
    html = TAG.sub(lambda m: m.group(1) + (re.sub(r'\?v=[^"&]*$', '', m.group(2)) + '?v=' + bid if local(m.group(2)) else m.group(2)) + m.group(3), html)
    if META.search(html): html = META.sub('<meta name="kw-build" content="%s">' % bid, html)
    else: html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="kw-build" content="%s">' % bid, 1)
    const = '<script>window.BUILD = "%s";</script>' % bid
    if CONST.search(html): html = CONST.sub(const, html)
    else: html = re.sub(r'(<script src=")', const + '\n' + r'\1', html, count=1)
    return html

if __name__ == '__main__':
    html = HTML.read_text()
    if '--check' in sys.argv:
        bid, bad = check(html); print('build', bid, 'missing:', bad); sys.exit(1 if bad or not bid else 0)
    bid = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else datetime.datetime.now(TZ).strftime('%Y%m%d-%H%M')
    if bid == current(html): bid += 'b'
    HTML.write_text(stamp(html, bid)); print('build', bid, '->', len(tags(stamp(html, bid))), 'local tags stamped')
