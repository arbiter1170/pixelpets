"""Shared palette and PNG IO for the asset converters (CV1 and CV3).

The hex values are the game palette in sprites.js (base, room, and skin keys).
A pixel maps only when its RGB matches one of those hexes exactly. Alpha 0 is
transparent (`.`). Any other colour, and any semi-transparent pixel, is unknown.

These helpers read and write files. They do not touch save data or the game.
"""
import struct, zlib

# Order matches sprites.js PAL. Do not invent keys.
PAL = {
    'k': '#1a1c2c', 'p': '#5d275d', 'r': '#b13e53', 'o': '#ef7d57',
    'y': '#ffcd75', 'l': '#a7f070', 'g': '#38b764', 't': '#257179',
    'n': '#29366f', 'b': '#3b5dc9', 'c': '#41a6f6', 's': '#73eff7',
    'w': '#f4f4f4', 'h': '#94b0c2', 'm': '#566c86', 'd': '#333c57',
    '1': '#f9dcc0', '2': '#efbb8e', '3': '#d4955f', '4': '#a96e43',
    '5': '#7d4b2c', '6': '#5a3520',
    'A': '#c9925e', 'B': '#a8674a', 'C': '#e3d3ac', 'D': '#9fae86',
    'E': '#5f6e4f', 'F': '#5c4033', 'G': '#b5845a', 'H': '#b9877a',
    'I': '#9c9382', 'J': '#2f5a3e', 'P': '#9686a8', 'K': '#7a8aa0',
}
PAL_INDEX = {key: i for i, key in enumerate(PAL)}
ROLE_LETTERS = ('a', 'b', 'c', 'd', 'x')
# Eyes are not in the col table. The game draws e as k and i as w (sprites.js buildSprite).
EYE_DARK, EYE_SHINE = 'k', 'w'

def _rgb(hex_colour):
    h = hex_colour[1:]
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

RGB_TO_KEY = {_rgb(hex_colour): key for key, hex_colour in PAL.items()}
SIG = b'\x89PNG\r\n\x1a\n'


def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def _chunks(blob):
    if not blob.startswith(SIG):
        raise ValueError('not a png')
    i, out = 8, []
    while i < len(blob):
        if i + 12 > len(blob):
            raise ValueError('truncated png')
        ln = struct.unpack('>I', blob[i:i + 4])[0]
        typ = blob[i + 4:i + 8]
        i += 8
        data = blob[i:i + ln]
        i += ln
        crc = struct.unpack('>I', blob[i:i + 4])[0]
        i += 4
        if len(data) != ln:
            raise ValueError('truncated png')
        if (zlib.crc32(typ + data) & 0xffffffff) != crc:
            raise ValueError('bad png crc')
        out.append((typ, data))
        if typ == b'IEND':
            return out
    raise ValueError('png missing IEND')


def _unpack_samples(row, bit_depth, count):
    if bit_depth == 8:
        return list(row[:count])
    if bit_depth not in (1, 2, 4):
        raise ValueError('unsupported bit depth %s' % bit_depth)
    samples = []
    mask = (1 << bit_depth) - 1
    for n in range(count):
        bitpos = n * bit_depth
        shift = 8 - bit_depth - (bitpos % 8)
        samples.append((row[bitpos // 8] >> shift) & mask)
    return samples


def read_png(path):
    """Return (width, height, pixels) with pixels as (r, g, b, a) in 0..255."""
    blob = path.read_bytes() if hasattr(path, 'read_bytes') else open(path, 'rb').read()
    chunks = _chunks(blob)
    ihdr = next(data for typ, data in chunks if typ == b'IHDR')
    w, h, depth, colour, comp, filt, inter = struct.unpack('>IIBBBBB', ihdr)
    if comp != 0 or filt != 0:
        raise ValueError('unsupported png compression')
    if inter != 0:
        raise ValueError('interlaced png is not supported')
    if colour not in (0, 2, 3, 4, 6):
        raise ValueError('unsupported png colour type')
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[colour]
    if depth not in (1, 2, 4, 8) or (depth != 8 and colour not in (0, 3)):
        raise ValueError('unsupported png bit depth')
    plte = b''.join(data for typ, data in chunks if typ == b'PLTE')
    trns = b''.join(data for typ, data in chunks if typ == b'tRNS')
    raw = zlib.decompress(b''.join(data for typ, data in chunks if typ == b'IDAT'))
    bpp = max(1, (channels * depth + 7) // 8)
    row_bytes = (w * channels * depth + 7) // 8
    rows, prev, pos = [], None, 0
    for _ in range(h):
        if pos + 1 + row_bytes > len(raw):
            raise ValueError('truncated png rows')
        typ = raw[pos]
        scan = bytearray(raw[pos + 1:pos + 1 + row_bytes])
        pos += 1 + row_bytes
        out = bytearray(len(scan))
        for n, val in enumerate(scan):
            left = out[n - bpp] if n >= bpp else 0
            up = prev[n] if prev is not None else 0
            ul = prev[n - bpp] if prev is not None and n >= bpp else 0
            if typ == 0:
                recon = val
            elif typ == 1:
                recon = (val + left) & 255
            elif typ == 2:
                recon = (val + up) & 255
            elif typ == 3:
                recon = (val + ((left + up) // 2)) & 255
            elif typ == 4:
                recon = (val + paeth(left, up, ul)) & 255
            else:
                raise ValueError('bad png filter')
            out[n] = recon
        rows.append(out)
        prev = out
    if pos != len(raw):
        raise ValueError('trailing png row data')
    scale = 255 // ((1 << depth) - 1) if colour != 3 else 1
    pixels = []
    for row in rows:
        samples = _unpack_samples(row, depth, w * channels)
        if colour == 6:
            pixels.extend((samples[i], samples[i + 1], samples[i + 2], samples[i + 3]) for i in range(0, len(samples), 4))
        elif colour == 2:
            for i in range(0, len(samples), 3):
                r, g, b = (samples[i] * scale, samples[i + 1] * scale, samples[i + 2] * scale)
                alpha = 0 if trns == bytes((samples[i], samples[i + 1], samples[i + 2])) else 255
                pixels.append((r, g, b, alpha))
        elif colour == 0:
            for sample in samples:
                v = sample * scale
                alpha = 0 if trns == bytes((sample,)) or trns == struct.pack('>H', sample) else 255
                pixels.append((v, v, v, alpha))
        elif colour == 4:
            for i in range(0, len(samples), 2):
                v = samples[i] * scale
                pixels.append((v, v, v, samples[i + 1] * scale))
        else:
            if not plte:
                raise ValueError('indexed png has no palette')
            for index in samples:
                if index * 3 + 2 >= len(plte):
                    raise ValueError('indexed pixel outside the palette')
                r, g, b = plte[index * 3:index * 3 + 3]
                alpha = trns[index] if index < len(trns) else 255
                pixels.append((r, g, b, alpha))
    if len(pixels) != w * h:
        raise ValueError('png pixel count')
    return w, h, pixels


def write_png(path, w, h, pixels):
    """Write an 8-bit RGBA PNG. `.` previews use alpha 0. No filtering, no interlacing."""
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            raw.extend(pixels[y * w + x])
    comp = zlib.compress(bytes(raw), 9)

    def chunk(typ, data):
        return struct.pack('>I', len(data)) + typ + data + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    blob = SIG + chunk(b'IHDR', ihdr) + chunk(b'IDAT', comp) + chunk(b'IEND', b'')
    if hasattr(path, 'write_bytes'):
        path.write_bytes(blob)
    else:
        open(path, 'wb').write(blob)


def pixels_to_rows(pixels, w, h):
    """Map pixels to palette-key rows. Returns (rows, unknown) where unknown is (x, y, label)."""
    rows, unknown = [], []
    for y in range(h):
        chars = []
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            if a == 0:
                chars.append('.')
            elif a != 255:
                chars.append('?')
                unknown.append((x, y, 'semi #%02x%02x%02x%02x' % (r, g, b, a)))
            else:
                key = RGB_TO_KEY.get((r, g, b))
                if key is None:
                    chars.append('?')
                    unknown.append((x, y, '#%02x%02x%02x' % (r, g, b)))
                else:
                    chars.append(key)
        rows.append(''.join(chars))
    return rows, unknown


def rows_to_pixels(rows):
    pixels = []
    width = len(rows[0]) if rows else 0
    for y, row in enumerate(rows):
        if len(row) != width:
            raise ValueError('row %s length %s, expected %s' % (y, len(row), width))
        for ch in row:
            if ch == '.':
                pixels.append((0, 0, 0, 0))
            elif ch in PAL:
                pixels.append(_rgb(PAL[ch]) + (255,))
            else:
                raise ValueError('unknown grid key %r' % ch)
    return width, len(rows), pixels


def scale_pixels(pixels, w, h, scale):
    if scale < 1:
        raise ValueError('scale')
    if scale == 1:
        return pixels, w, h
    out_w, out_h = w * scale, h * scale
    out = [(0, 0, 0, 0)] * (out_w * out_h)
    for y in range(h):
        for x in range(w):
            pixel = pixels[y * w + x]
            for dy in range(scale):
                base = (y * scale + dy) * out_w + x * scale
                out[base:base + scale] = (pixel,) * scale
    return out, out_w, out_h


def mirror_mismatches(rows):
    """Cells whose palette key differs from the mirrored cell. Creature art has to match."""
    bad = []
    for y, row in enumerate(rows):
        for x in range(len(row) // 2):
            if row[x] != row[-1 - x]:
                bad.append((x, y, row[x], row[-1 - x]))
    return bad


def creature_parts(rows):
    """16x16 palette rows -> 8-wide half, col table, and the same rows.

    The half is the left eight columns. The game mirrors it, so the right eight
    must already be that mirror, including the extra role `x`. Eyes are `e`
    (dark, palette k) and `i` (shine, palette w) when those keys are not the
    main body colour. Other colours, most frequent first, become a, b, c, d, x.
    """
    if len(rows) != 16 or any(len(row) != 16 for row in rows):
        raise ValueError('creature grid must be 16x16')
    mismatches = mirror_mismatches(rows)
    if mismatches:
        x, y, left, right = mismatches[0]
        raise ValueError('not mirror-symmetric at %s,%s (%s vs %s)' % (x, y, left, right))
    counts = {}
    for row in rows:
        for ch in row:
            if ch != '.':
                counts[ch] = counts.get(ch, 0) + 1
    majority = max(counts, key=lambda key: (counts[key], -PAL_INDEX[key])) if counts else None
    role = [[None] * 16 for _ in range(16)]
    cells = [list(row) for row in rows]

    def adjacent(x, y, pred):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < 16 and 0 <= ny < 16 and pred(cells[ny][nx], role[ny][nx]):
                return True
        return False

    if counts.get(EYE_DARK) and majority != EYE_DARK:
        for y in range(16):
            for x in range(16):
                if cells[y][x] == EYE_DARK and adjacent(x, y, lambda ch, _role: ch == EYE_SHINE):
                    role[y][x] = 'e'
    if counts.get(EYE_SHINE) and majority != EYE_SHINE:
        for y in range(16):
            for x in range(16):
                if cells[y][x] == EYE_SHINE and role[y][x] is None and adjacent(x, y, lambda _ch, assigned: assigned == 'e'):
                    role[y][x] = 'i'
    body = {}
    for y in range(16):
        for x in range(16):
            if role[y][x] is None and cells[y][x] != '.':
                body[cells[y][x]] = body.get(cells[y][x], 0) + 1
    order = sorted(body, key=lambda key: (-body[key], PAL_INDEX[key]))
    if len(order) > len(ROLE_LETTERS):
        raise ValueError('too many colours for roles a b c d x: %s' % ' '.join(order))
    col = {}
    letter_of = {}
    for letter, key in zip(ROLE_LETTERS, order):
        letter_of[key] = letter
        col[letter] = key
    for y in range(16):
        for x in range(16):
            if cells[y][x] == '.':
                role[y][x] = '.'
            elif role[y][x] is None:
                role[y][x] = letter_of[cells[y][x]]
    half = [''.join(role[y][x] for x in range(8)) for y in range(16)]
    redrawn = render_creature(half, col)
    if redrawn != list(rows):
        raise ValueError('role letters do not redraw the grid')
    return {'half': half, 'col': col, 'rows': list(rows)}


def render_creature(half, col):
    """Mirror an 8-wide half through its col table into 16 palette-key rows."""
    if len(half) != 16 or any(len(row) != 8 for row in half):
        raise ValueError('half must be 16 rows of 8')
    rows = []
    for row in half:
        left = []
        for ch in row:
            if ch == '.':
                left.append('.')
            elif ch == 'e':
                left.append(EYE_DARK)
            elif ch == 'i':
                left.append(EYE_SHINE)
            elif ch in col:
                left.append(col[ch])
            else:
                raise ValueError('unknown role %r' % ch)
        rows.append(''.join(left) + ''.join(reversed(left)))
    return rows


def slice_cells(rows, cells_w, cells_h):
    """Cut a prop grid into 16x16 cells, left to right, top to bottom."""
    cell = 16
    slices = []
    for cy in range(cells_h):
        for cx in range(cells_w):
            slices.append([row[cx * cell:(cx + 1) * cell] for row in rows[cy * cell:(cy + 1) * cell]])
    return slices
