#!/usr/bin/env python3
"""CV1. PNG to a palette-key grid.

Each opaque pixel must be an exact palette hex from sprites.js. Alpha 0 becomes
`.`. Any other colour, or any semi-transparent pixel, is unknown and the process
exits non-zero. The wrong size for the chosen mode also exits non-zero.

  python3 tools/png2grid.py --tile --id dock tests/fixtures/assets/tile_ok.png
  python3 tools/png2grid.py --creature --id walker tests/fixtures/assets/creature_ok.png
  python3 tools/png2grid.py --keeper --id captain_hat tests/fixtures/assets/keeper_ok.png
  python3 tools/png2grid.py --prop --cells 2x1 --id ferry tests/fixtures/assets/prop_ok.png

Stdout is JSON `{id: [rows]}` for a tile, a keeper strip, and a prop. A prop with
more than one cell also includes `<id>_0..n` slices (left to right, top to bottom).
`--creature` writes `{id: {half, col, rows}}`: `half` is the left 8 columns of
role letters, `col` maps a/b/c/d/x to palette keys, and `rows` is the 16x16 key
grid. The keeper strip is 96x16: down 0, down 1, up 0, up 1, right 0, right 1.
Stderr on success is `unknown 0`. This tool does not write game files.
"""
import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import assetlib


def die(msg):
    print(msg, file=sys.stderr)
    raise SystemExit(1)


def asset_id(path, given):
    name = given or Path(path).stem
    if not name or any(ch not in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_' for ch in name):
        die('id must be letters, digits, and underscore')
    return name


def parse_cells(text):
    parts = text.lower().split('x')
    if len(parts) != 2 or not all(part.isdigit() and int(part) > 0 for part in parts):
        die('cells must look like 3x2')
    return int(parts[0]), int(parts[1])


def load(path, expect_w, expect_h):
    try:
        w, h, pixels = assetlib.read_png(Path(path))
    except (OSError, ValueError) as err:
        die('png: %s' % err)
    if (w, h) != (expect_w, expect_h):
        die('wrong size %sx%s, expected %sx%s' % (w, h, expect_w, expect_h))
    rows, unknown = assetlib.pixels_to_rows(pixels, w, h)
    if unknown:
        shown = ', '.join('%s at %s,%s' % (label, x, y) for x, y, label in unknown[:8])
        die('unknown %s %s' % (len(unknown), shown))
    return rows


def main():
    parser = argparse.ArgumentParser(description='PNG to a Walklings palette grid (CV1).')
    parser.add_argument('png')
    parser.add_argument('--id', help='JSON key. Defaults to the file name.')
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--creature', action='store_true', help='16x16 mirrored Walkling. Emits half and col.')
    mode.add_argument('--keeper', action='store_true', help='6 frames in a 96x16 strip.')
    mode.add_argument('--tile', action='store_true', help='One 16x16 tile.')
    mode.add_argument('--prop', action='store_true', help='16x16 cells. Pass --cells WxH.')
    parser.add_argument('--cells', help='Prop cell count, for example 3x2.')
    args = parser.parse_args()
    name = asset_id(args.png, args.id)
    if args.prop:
        if not args.cells:
            die('--prop needs --cells WxH')
        cells_w, cells_h = parse_cells(args.cells)
        rows = load(args.png, cells_w * 16, cells_h * 16)
        out = {name: rows}
        if cells_w * cells_h > 1:
            for index, cell in enumerate(assetlib.slice_cells(rows, cells_w, cells_h)):
                out['%s_%s' % (name, index)] = cell
    elif args.cells:
        die('--cells is only for --prop')
    elif args.tile:
        out = {name: load(args.png, 16, 16)}
    elif args.keeper:
        out = {name: load(args.png, 96, 16)}
    else:
        rows = load(args.png, 16, 16)
        try:
            out = {name: assetlib.creature_parts(rows)}
        except ValueError as err:
            die(str(err))
    print('unknown 0', file=sys.stderr)
    json.dump(out, sys.stdout)
    print()


if __name__ == '__main__':
    main()
