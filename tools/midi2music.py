#!/usr/bin/env python3
"""CV2. MIDI to a MUSIC data literal.

Track order follows the asset handoff: the first melodic track is the lead, the
second is the bass, and channel 10 (kick 36, snare 38, hat 42) is the drum kit.
Notes are quantised onto `stepsPerBar`, tied neighbours of the same pitch merge
into `[midi, steps]`, and a gap is `[0, steps]` (the rest used in sfx.js).
Drum hits become one `k` / `s` / `h` / `.` string per bar.

The process exits non-zero when a voice is polyphonic, a note falls outside
MIDI 36-96, or a note runs past the bar grid. On success the lead and the bass
each sum to `bars * stepsPerBar`, which is the sfx.js `musicCheck()` step rule.

  python3 tools/midi2music.py --json --id loop_ok --steps-per-bar 8 tests/fixtures/assets/loop_ok.mid
  python3 tools/midi2music.py --id trial --steps-per-bar 16 --bars 8 --key "D major" trial.mid

`--json` prints the object. The default print is a JS literal you can paste
next to the other loops. This tool does not write game files.
"""
import argparse, json, struct, sys
from pathlib import Path

NOTE_LO, NOTE_HI = 36, 96
DRUMS = {36: 'k', 38: 's', 42: 'h'}
GAINS = {('square', 'lead'): 0.06, ('triangle', 'lead'): 0.22, ('square', 'bass'): 0.08, ('triangle', 'bass'): 0.28}
MAJOR_SHARP = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
MAJOR_FLAT = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']
MINOR_SHARP = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#']
MINOR_FLAT = ['A', 'D', 'G', 'C', 'F', 'Bb', 'Eb']


def die(msg):
    print(msg, file=sys.stderr)
    raise SystemExit(1)


def vlq(data, i):
    n = 0
    while True:
        if i >= len(data):
            die('truncated midi')
        b = data[i]
        i += 1
        n = (n << 7) | (b & 0x7f)
        if not b & 0x80:
            return n, i


def parse_track(data):
    i, tick, status = 0, 0, None
    notes, metas = [], []
    while i < len(data):
        delta, i = vlq(data, i)
        tick += delta
        if i >= len(data):
            break
        byte = data[i]
        if byte >= 0x80:
            i += 1
            if byte == 0xFF:
                if i >= len(data):
                    die('truncated midi meta')
                kind = data[i]
                i += 1
                length, i = vlq(data, i)
                payload = data[i:i + length]
                i += length
                metas.append((tick, kind, payload))
                status = None
                if kind == 0x2F:
                    break
                continue
            if byte in (0xF0, 0xF7):
                length, i = vlq(data, i)
                i += length
                status = None
                continue
            status = byte
            if i >= len(data):
                die('truncated midi event')
            data1 = data[i]
            i += 1
        else:
            if status is None:
                die('midi running status with no status')
            data1 = byte
            i += 1
        kind = status & 0xF0
        channel = status & 0x0F
        data2 = None
        if kind not in (0xC0, 0xD0):
            if i >= len(data):
                die('truncated midi event')
            data2 = data[i]
            i += 1
        if kind == 0x90 and data2:
            notes.append((tick, 'on', channel, data1))
        elif kind == 0x80 or (kind == 0x90 and data2 == 0):
            notes.append((tick, 'off', channel, data1))
    return notes, metas


def parse_midi(blob):
    if len(blob) < 14 or blob[:4] != b'MThd':
        die('not a midi file')
    length = struct.unpack('>I', blob[4:8])[0]
    fmt, ntrks, division = struct.unpack('>HHH', blob[8:14])
    if length < 6:
        die('bad midi header')
    if division & 0x8000:
        die('smpte midi division is not supported')
    if fmt not in (0, 1):
        die('midi format %s is not supported' % fmt)
    pos, tracks = 8 + length, []
    for _ in range(ntrks):
        if blob[pos:pos + 4] != b'MTrk':
            die('missing midi track')
        size = struct.unpack('>I', blob[pos + 4:pos + 8])[0]
        tracks.append(parse_track(blob[pos + 8:pos + 8 + size]))
        pos += 8 + size
    return division, tracks


def key_name(payload):
    if len(payload) < 2:
        return None
    sf = struct.unpack('b', payload[:1])[0]
    minor = payload[1]
    if not -7 <= sf <= 7:
        return None
    if minor:
        return (MINOR_SHARP[sf] if sf >= 0 else MINOR_FLAT[-sf]) + ' minor'
    return (MAJOR_SHARP[sf] if sf >= 0 else MAJOR_FLAT[-sf]) + ' major'


def collect(tracks):
    """Split channel-10 drums from the first two melodic (track, channel) voices."""
    voices, drums = [], []
    index_of = {}
    tempo, key, timesig = None, None, None
    open_notes = {}
    for track_i, (notes, metas) in enumerate(tracks):
        for tick, kind, payload in metas:
            if kind == 0x51 and len(payload) == 3 and tempo is None:
                tempo = (payload[0] << 16) | (payload[1] << 8) | payload[2]
            elif kind == 0x51 and len(payload) == 3:
                other = (payload[0] << 16) | (payload[1] << 8) | payload[2]
                if other != tempo:
                    die('tempo changes mid loop')
            elif kind == 0x59 and key is None:
                key = key_name(payload)
            elif kind == 0x58 and len(payload) >= 2 and timesig is None:
                timesig = (payload[0], payload[1])
        for tick, event, channel, note in notes:
            if channel == 9:
                slot = ('drum', note)
            else:
                ident = (track_i, channel)
                if ident not in index_of:
                    if len(voices) >= 2:
                        die('more than two melodic voices')
                    index_of[ident] = len(voices)
                    voices.append([])
                    open_notes[ident] = {}
                slot = ident
            if event == 'on':
                if channel == 9:
                    drums.append((tick, note))
                else:
                    if note in open_notes[ident]:
                        die('polyphonic %s' % ('lead' if index_of[ident] == 0 else 'bass'))
                    open_notes[ident][note] = tick
            elif channel != 9:
                start = open_notes[ident].pop(note, None)
                if start is None or tick <= start:
                    continue
                voices[index_of[ident]].append((start, tick, note))
        for ident, pending in list(open_notes.items()):
            if pending and ident[0] == track_i:
                die('unfinished note')
    if len(voices) < 2:
        die('need a lead track and a bass track')
    if timesig not in (None, (4, 2)):
        die('time signature must be 4/4')
    return voices[0], voices[1], drums, tempo, key


def to_step(tick, ppq, steps_per_bar):
    den = ppq * 4
    return (tick * steps_per_bar + den // 2) // den


def monophonic(spans, ppq, steps_per_bar, total, voice):
    stepped = []
    for start, end, note in spans:
        a, b = to_step(start, ppq, steps_per_bar), to_step(end, ppq, steps_per_bar)
        if b <= a:
            b = a + 1
        if note < NOTE_LO or note > NOTE_HI:
            die('out of range %s midi %s (want %s-%s)' % (voice, note, NOTE_LO, NOTE_HI))
        stepped.append((a, b, note))
    stepped.sort()
    if not stepped:
        return [(0, total)]
    merged = [list(stepped[0])]
    for start, end, note in stepped[1:]:
        prev = merged[-1]
        if start < prev[1]:
            die('polyphonic %s' % voice)
        if start > total or end > total:
            die('bar overflow on %s' % voice)
        if note == prev[2] and start == prev[1]:
            prev[1] = end
        else:
            merged.append([start, end, note])
    if merged[0][0] > total or merged[-1][1] > total:
        die('bar overflow on %s' % voice)
    line = []
    cursor = 0
    for start, end, note in merged:
        if start < cursor:
            die('polyphonic %s' % voice)
        if start > cursor:
            line.append((0, start - cursor))
        line.append((note, end - start))
        cursor = end
    if cursor < total:
        line.append((0, total - cursor))
    return line


def drum_bars(hits, ppq, steps_per_bar, bars):
    total = bars * steps_per_bar
    grid = [['.'] * steps_per_bar for _ in range(bars)]
    for tick, note in hits:
        if note not in DRUMS:
            die('unknown drum midi %s (want 36, 38, or 42)' % note)
        step = to_step(tick, ppq, steps_per_bar)
        if step >= total:
            die('bar overflow on drums')
        bar, index = divmod(step, steps_per_bar)
        if grid[bar][index] != '.':
            die('polyphonic drums')
        grid[bar][index] = DRUMS[note]
    return [''.join(bar) for bar in grid]


def music_check(entry):
    """Same step sums as sfx.js musicCheck: each voice sums to bars * stepsPerBar."""
    bad = []
    need = entry['bars'] * entry['stepsPerBar']
    name = entry.get('id', 'track')
    for voice in ('lead', 'bass'):
        total = sum(note[1] for note in entry[voice]['notes'])
        if total != need:
            bad.append('%s %s %s!=%s' % (name, voice, total, need))
    if len(entry['drums']) != entry['bars']:
        bad.append('%s drum bars' % name)
    for index, bar in enumerate(entry['drums']):
        if len(bar) != entry['stepsPerBar'] or any(ch not in 'ksh.' for ch in bar):
            bad.append('%s drum %s' % (name, index))
    return bad


def js_str(text):
    return "'" + str(text).replace('\\', '\\\\').replace("'", "\\'") + "'"


def literal(name, entry):
    def notes(pairs):
        return '[' + ','.join('[%s,%s]' % (pitch, steps) for pitch, steps in pairs) + ']'

    drums = ','.join(js_str(bar) for bar in entry['drums'])
    return (
        "%s: { key: %s, bpm: %s, bars: %s, stepsPerBar: %s, gate: %s, perc: %s,\n"
        "  lead: { wave: %s, gain: %s, notes: %s },\n"
        "  bass: { wave: %s, gain: %s, notes: %s },\n"
        "  drums: [%s] }"
    ) % (
        name, js_str(entry['key']), json.dumps(entry['bpm']), entry['bars'], entry['stepsPerBar'],
        json.dumps(entry['gate']), json.dumps(entry['perc']),
        js_str(entry['lead']['wave']), json.dumps(entry['lead']['gain']), notes(entry['lead']['notes']),
        js_str(entry['bass']['wave']), json.dumps(entry['bass']['gain']), notes(entry['bass']['notes']),
        drums,
    )


def main():
    parser = argparse.ArgumentParser(description='MIDI to a Walklings MUSIC literal (CV2).')
    parser.add_argument('mid')
    parser.add_argument('--id', help='Loop id. Defaults to the file name.')
    parser.add_argument('--steps-per-bar', type=int, default=8)
    parser.add_argument('--bars', type=int, help='Loop length. Defaults to the MIDI length, rounded up to a bar.')
    parser.add_argument('--bpm', type=int, help='Overrides the MIDI tempo.')
    parser.add_argument('--key', help='For example "D major". Overrides the MIDI key signature.')
    parser.add_argument('--lead-wave', default='square', choices=('square', 'triangle'))
    parser.add_argument('--bass-wave', default='triangle', choices=('square', 'triangle'))
    parser.add_argument('--lead-gain', type=float)
    parser.add_argument('--bass-gain', type=float)
    parser.add_argument('--gate', type=float, default=0.9)
    parser.add_argument('--perc', type=float, default=0.55)
    parser.add_argument('--json', action='store_true', help='Print JSON instead of a JS literal.')
    args = parser.parse_args()
    name = args.id or Path(args.mid).stem
    if not name or any(ch not in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_' for ch in name):
        die('id must be letters, digits, and underscore')
    if args.steps_per_bar < 1:
        die('steps-per-bar must be at least 1')
    try:
        blob = Path(args.mid).read_bytes()
    except OSError as err:
        die(str(err))
    ppq, tracks = parse_midi(blob)
    lead, bass, drums, tempo, key = collect(tracks)
    if args.bpm:
        bpm = args.bpm
    elif tempo:
        bpm = int(round(60000000 / tempo))
    else:
        die('missing tempo (pass --bpm)')
    key = args.key or key
    if not key:
        die('missing key (pass --key)')
    end_tick = 0
    for spans in (lead, bass):
        if spans:
            end_tick = max(end_tick, max(end for _start, end, _note in spans))
    if drums:
        end_tick = max(end_tick, max(tick for tick, _note in drums))
    inferred = max(1, (to_step(end_tick, ppq, args.steps_per_bar) + args.steps_per_bar - 1) // args.steps_per_bar)
    bars = args.bars or inferred
    if bars < 1:
        die('bars must be at least 1')
    total = bars * args.steps_per_bar
    entry = {
        'key': key,
        'bpm': bpm,
        'bars': bars,
        'stepsPerBar': args.steps_per_bar,
        'gate': args.gate,
        'perc': args.perc,
        'lead': {
            'wave': args.lead_wave,
            'gain': args.lead_gain if args.lead_gain is not None else GAINS[(args.lead_wave, 'lead')],
            'notes': monophonic(lead, ppq, args.steps_per_bar, total, 'lead'),
        },
        'bass': {
            'wave': args.bass_wave,
            'gain': args.bass_gain if args.bass_gain is not None else GAINS[(args.bass_wave, 'bass')],
            'notes': monophonic(bass, ppq, args.steps_per_bar, total, 'bass'),
        },
        'drums': drum_bars(drums, ppq, args.steps_per_bar, bars),
    }
    entry['id'] = name
    bad = music_check(entry)
    if bad:
        die('musicCheck ' + '; '.join(bad))
    payload = {k: v for k, v in entry.items() if k != 'id'}
    if args.json:
        json.dump({name: payload}, sys.stdout)
        print()
    else:
        print(literal(name, entry))


if __name__ == '__main__':
    main()
