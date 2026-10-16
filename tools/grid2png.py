#!/usr/bin/env python3
"""CV3. Palette grid JSON back to a PNG preview at 1x or 4x.

The reverse of png2grid.py, so a reviewer can see the pixels the game will draw.
`.` is alpha 0. Every other character must be a palette key. Scale 4 repeats
each pixel in a 4x4 block (nearest neighbour, no new colours).

  python3 tools/grid2png.py --id dock --scale 1 --out preview.png grid.json
  python3 tools/grid2png.py --id walker --scale 4 --out preview4.png grid.json

A creature object (`half` and `col`) is drawn by mirroring the half, which is
what the game does. A list of rows is drawn as those keys. Pass `--id` when the
JSON holds more than one key. This tool does not write game files.
"""
import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import assetlib


def die(msg):
    print(msg, file=sys.stderr)
    raise SystemExit(1)


def rows_of(value):
    if isinstance(value, list):
        if not value or not all(isinstance(row, str) for row in value):
            die('grid rows must be strings')
        return value
    if isinstance(value, dict) and 'half' in value and 'col' in value:
        try:
            return assetlib.render_creature(value['half'], value['col'])
        except ValueError as err:
            die(str(err))
    if isinstance(value, dict) and isinstance(value.get('rows'), list):
        return rows_of(value['rows'])
    die('JSON value is not a grid or a creature half')


def main():
    parser = argparse.ArgumentParser(description='Palette grid JSON to a PNG preview (CV3).')
    parser.add_argument('json_path')
    parser.add_argument('--id', help='Which key to draw. Required when there are several.')
    parser.add_argument('--scale', type=int, default=1, help='1 or 4. Each source pixel becomes a solid block.')
    parser.add_argument('--out', required=True, help='PNG path to write.')
    args = parser.parse_args()
    if args.scale not in (1, 4):
        die('scale must be 1 or 4')
    try:
        data = json.loads(Path(args.json_path).read_text())
    except (OSError, ValueError) as err:
        die('json: %s' % err)
    if not isinstance(data, dict) or not data:
        die('JSON must be an object of id to grid')
    if args.id:
        if args.id not in data:
            die('missing id %s' % args.id)
        value = data[args.id]
    elif len(data) == 1:
        value = next(iter(data.values()))
    else:
        die('pass --id (JSON has %s keys)' % len(data))
    rows = rows_of(value)
    try:
        w, h, pixels = assetlib.rows_to_pixels(rows)
        pixels, w, h = assetlib.scale_pixels(pixels, w, h, args.scale)
        assetlib.write_png(Path(args.out), w, h, pixels)
    except (OSError, ValueError) as err:
        die(str(err))
    print('wrote %s %sx%s' % (args.out, w, h))


if __name__ == '__main__':
    main()
