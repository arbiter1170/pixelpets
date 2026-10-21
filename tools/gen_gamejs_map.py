#!/usr/bin/env python3
"""Line map of column-0 declarations in the root scripts.

After editing a root .js file, run:
    python3 tools/gen_gamejs_map.py
Check without writing:
    python3 tools/gen_gamejs_map.py --check
rg NAME tools/GAMEJS_MAP.txt, then read only that range.

Exit codes:
    0  wrote the map, or --check found it current
    1  --check: the map is missing or stale
    2  usage error, or the generator crashed
"""
import pathlib
import sys

HEADER = (
    "# rg NAME tools/GAMEJS_MAP.txt, then read only that range.\n"
    "# The end line is the line before the next top-level declaration, or the end of the file.\n"
)


def repo_root(argv):
    if '--root' in argv:
        i = argv.index('--root')
        if i + 1 >= len(argv):
            print('missing --root directory', file=sys.stderr)
            sys.exit(2)
        return pathlib.Path(argv[i + 1]).resolve()
    return pathlib.Path(__file__).resolve().parent.parent


def root_scripts(root):
    names = sorted(p.name for p in root.glob('*.js') if p.is_file())
    if 'game.js' in names:
        names.remove('game.js')
        return ['game.js'] + names
    return names


def skip_string(s, i):
    q = s[i]
    i += 1
    n = len(s)
    while i < n:
        if s[i] == '\\':
            i += 2
            continue
        if q == '`' and s[i] == '$' and i + 1 < n and s[i + 1] == '{':
            i = skip_braced(s, i + 2)
            continue
        if s[i] == q:
            return i + 1
        i += 1
    return i


def skip_braced(s, i):
    depth = 1
    n = len(s)
    while i < n and depth:
        c = s[i]
        if c in '"\'`':
            i = skip_string(s, i)
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
        i += 1
    return i


def skip_ws(s, i):
    n = len(s)
    while i < n and s[i] in ' \t':
        i += 1
    if i + 1 < n and s[i:i + 2] == '//':
        return n
    return i


def skip_initializer(s, i):
    depth = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c in '"\'`':
            i = skip_string(s, i)
            continue
        if c in '([{':
            depth += 1
            i += 1
            continue
        if c in ')]}':
            if depth == 0:
                return i
            depth -= 1
            i += 1
            continue
        if depth == 0 and (c == ',' or c == ';'):
            return i
        if depth == 0 and s.startswith('//', i):
            return n
        i += 1
    return i


def read_ident(s, i):
    if i < len(s) and (s[i].isalpha() or s[i] in '_$'):
        j = i + 1
        while j < len(s) and (s[j].isalnum() or s[j] in '_$'):
            j += 1
        return s[i:j], j
    return None, i


def binding_names(pattern):
    names = []
    i = 0
    n = len(pattern)
    while i < n:
        c = pattern[i]
        if c in '"\'`':
            i = skip_string(pattern, i)
            continue
        name, j = read_ident(pattern, i)
        if name:
            k = skip_ws(pattern, j)
            if k < n and pattern[k] == ':':
                i = k + 1
                continue
            names.append(name)
            i = j
            continue
        i += 1
    return names


def matching_close(s, i):
    depth = 0
    n = len(s)
    j = i
    while j < n:
        if s[j] in '"\'`':
            j = skip_string(s, j)
            continue
        if s[j] in '{[':
            depth += 1
        elif s[j] in '}]':
            depth -= 1
            if depth == 0:
                return j + 1
        j += 1
    return n


def decl_names(rest):
    names = []
    i = 0
    n = len(rest)
    while i < n:
        i = skip_ws(rest, i)
        if i >= n or rest[i] == ';':
            break
        if rest[i] in '{[':
            j = matching_close(rest, i)
            names.extend(binding_names(rest[i:j]))
            i = j
        else:
            name, j = read_ident(rest, i)
            if not name:
                break
            names.append(name)
            i = j
        i = skip_ws(rest, i)
        if i < n and rest[i] == '=':
            i = skip_initializer(rest, i + 1)
            i = skip_ws(rest, i)
        if i < n and rest[i] == ',':
            i += 1
            continue
        break
    return names


def keyword_name(line, keyword):
    if not (line.startswith(keyword + ' ') or line.startswith(keyword + '\t')):
        return None
    tail = line[len(keyword):]
    i = skip_ws(tail, 0)
    name, _ = read_ident(tail, i)
    return name


def decls_in_line(line):
    if not line or line[0] in ' \t':
        return []
    if line.startswith('async ') or line.startswith('async\t'):
        tail = line[len('async'):]
        i = skip_ws(tail, 0)
        name = keyword_name(tail[i:], 'function')
        if name:
            return [('async function', name)]
        return []
    name = keyword_name(line, 'function')
    if name:
        return [('function', name)]
    name = keyword_name(line, 'class')
    if name:
        return [('class', name)]
    for kind in ('const', 'let', 'var'):
        if line.startswith(kind + ' ') or line.startswith(kind + '\t'):
            return [(kind, ident) for ident in decl_names(line[len(kind):])]
    name = object_name(line)
    if name:
        return [('object', name)]
    return []


def object_name(line):
    if '=' not in line or '{' not in line:
        return None
    left, right = line.split('=', 1)
    if not right.lstrip().startswith('{'):
        return None
    left = left.strip()
    if not left or left[0] in '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ':
        pass
    else:
        return None
    parts = left.split('.')
    for part in parts:
        if not part or not (part[0].isalpha() or part[0] in '_$'):
            return None
        if any(not (c.isalnum() or c in '_$') for c in part):
            return None
    return left


def line_decls(text):
    lines = text.splitlines()
    found = []
    for n, line in enumerate(lines, 1):
        for kind, name in decls_in_line(line):
            found.append((n, kind, name))
    return found, len(lines)


def with_ends(found, nlines):
    rows = []
    for i, (start, kind, name) in enumerate(found):
        end = nlines
        for j in range(i + 1, len(found)):
            if found[j][0] != start:
                end = found[j][0] - 1
                break
        if end < start:
            end = start
        rows.append((start, end, kind, name))
    return rows


def render(root):
    parts = [HEADER]
    for name in root_scripts(root):
        text = (root / name).read_text(encoding='utf-8')
        found, nlines = line_decls(text)
        if not found:
            continue
        parts.append('\n# %s\n' % name)
        for start, end, kind, ident in with_ends(found, nlines):
            parts.append('%d-%d  %s %s\n' % (start, end, kind, ident))
    return ''.join(parts)


def main(argv):
    root = repo_root(argv)
    out = root / 'tools' / 'GAMEJS_MAP.txt'
    body = render(root)
    if '--check' in argv:
        try:
            have = out.read_text(encoding='utf-8')
        except OSError:
            have = None
        if have != body:
            print('GAMEJS_MAP.txt is stale. run python3 tools/gen_gamejs_map.py', file=sys.stderr)
            sys.exit(1)
        return 0
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(body, encoding='utf-8', newline='\n')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main(sys.argv[1:]))
    except SystemExit:
        raise
    except Exception as exc:
        print('gen_gamejs_map.py: %s: %s' % (type(exc).__name__, exc), file=sys.stderr)
        sys.exit(2)
