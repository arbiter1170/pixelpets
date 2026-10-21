/* Walklings moves, learnsets and trainers (design/specs/BATTLE.md v0.3.1).
   Load after stats.js and before save.js / game.js. Pure data + helpers; the battle engine lives in game.js. */
"use strict";

const MOVES = {
  "bump": {
    "name": "Bump",
    "type": "PLAIN",
    "power": 30,
    "acc": 100,
    "uses": 20
  },
  "tumble_charge": {
    "name": "Tumble Charge",
    "type": "PLAIN",
    "power": 45,
    "acc": 90,
    "uses": 10
  },
  "wobble": {
    "name": "Wobble",
    "type": "PLAIN",
    "power": 20,
    "acc": 100,
    "uses": Infinity,
    "fallback": true
  },
  "flick_flame": {
    "name": "Flick Flame",
    "type": "EMBER",
    "power": 35,
    "acc": 100,
    "uses": 15
  },
  "stoke_up": {
    "name": "Stoke Up",
    "type": "EMBER",
    "power": 0,
    "acc": 100,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "atk",
      "stages": 1
    }
  },
  "kiln_rush": {
    "name": "Kiln Rush",
    "type": "EMBER",
    "power": 50,
    "acc": 95,
    "uses": 10
  },
  "ripple_jab": {
    "name": "Ripple Jab",
    "type": "TIDE",
    "power": 35,
    "acc": 100,
    "uses": 15
  },
  "mist_veil": {
    "name": "Mist Veil",
    "type": "TIDE",
    "power": 0,
    "acc": 100,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": 1
    }
  },
  "undertow": {
    "name": "Undertow",
    "type": "TIDE",
    "power": 50,
    "acc": 95,
    "uses": 10
  },
  "seed_toss": {
    "name": "Seed Toss",
    "type": "BLOOM",
    "power": 35,
    "acc": 100,
    "uses": 15
  },
  "sap_sip": {
    "name": "Sap Sip",
    "type": "BLOOM",
    "power": 0,
    "acc": 100,
    "uses": 3,
    "effect": {
      "target": "self",
      "heal": 0.25
    }
  },
  "thorn_lash": {
    "name": "Thorn Lash",
    "type": "BLOOM",
    "power": 50,
    "acc": 95,
    "uses": 10
  },
  "pebble_flick": {
    "name": "Pebble Flick",
    "type": "STONE",
    "power": 35,
    "acc": 95,
    "uses": 15
  },
  "brace_rock": {
    "name": "Brace Rock",
    "type": "STONE",
    "power": 0,
    "acc": 100,
    "uses": 3,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": 2
    }
  },
  "boulder_drop": {
    "name": "Boulder Drop",
    "type": "STONE",
    "power": 55,
    "acc": 85,
    "uses": 10
  },
  "zap_tap": {
    "name": "Zap Tap",
    "type": "VOLT",
    "power": 35,
    "acc": 100,
    "uses": 15
  },
  "neon_flash": {
    "name": "Neon Flash",
    "type": "VOLT",
    "power": 0,
    "acc": 100,
    "uses": 5,
    "effect": {
      "target": "foe",
      "stat": "atk",
      "stages": -1
    }
  },
  "arc_bolt": {
    "name": "Arc Bolt",
    "type": "VOLT",
    "power": 50,
    "acc": 95,
    "uses": 10
  },
  "frost_nip": {
    "name": "Frost Nip",
    "type": "FROST",
    "power": 35,
    "acc": 100,
    "uses": 15
  },
  "cold_snap": {
    "name": "Cold Snap",
    "type": "FROST",
    "power": 30,
    "acc": 95,
    "uses": 10,
    "effect": {
      "target": "foe",
      "stat": "spd",
      "stages": -1
    }
  },
  "sleet_pelt": {
    "name": "Sleet Pelt",
    "type": "FROST",
    "power": 50,
    "acc": 95,
    "uses": 10
  },
  "puff_shot": {
    "name": "Puff Shot",
    "type": "GUST",
    "power": 35,
    "acc": 100,
    "uses": 15
  },
  "updraft": {
    "name": "Updraft",
    "type": "GUST",
    "power": 0,
    "acc": 100,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "spd",
      "stages": 1
    }
  },
  "gale_slice": {
    "name": "Gale Slice",
    "type": "GUST",
    "power": 50,
    "acc": 95,
    "uses": 10
  },
  "gloom_poke": {
    "name": "Gloom Poke",
    "type": "SHADE",
    "power": 35,
    "acc": 100,
    "uses": 15
  },
  "night_veil": {
    "name": "Night Veil",
    "type": "SHADE",
    "power": 0,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "foe",
      "stat": "def",
      "stages": -1
    }
  },
  "dusk_fang": {
    "name": "Dusk Fang",
    "type": "SHADE",
    "power": 50,
    "acc": 95,
    "uses": 10
  },
  "full_tilt": {
    "name": "Full Tilt",
    "type": "PLAIN",
    "power": 70,
    "acc": 90,
    "uses": 8
  },
  "kindle_burst": {
    "name": "Glow Burst",
    "type": "EMBER",
    "power": 70,
    "acc": 90,
    "uses": 8
  },
  "breaker_wave": {
    "name": "Breaker Wave",
    "type": "TIDE",
    "power": 70,
    "acc": 90,
    "uses": 8
  },
  "briar_volley": {
    "name": "Briar Volley",
    "type": "BLOOM",
    "power": 70,
    "acc": 90,
    "uses": 8
  },
  "quarry_crash": {
    "name": "Quarry Crash",
    "type": "STONE",
    "power": 75,
    "acc": 85,
    "uses": 8
  },
  "neon_burst": {
    "name": "Neon Burst",
    "type": "VOLT",
    "power": 70,
    "acc": 90,
    "uses": 8
  },
  "rime_rush": {
    "name": "Rime Rush",
    "type": "FROST",
    "power": 70,
    "acc": 90,
    "uses": 8
  },
  "tempest_dive": {
    "name": "Tempest Dive",
    "type": "GUST",
    "power": 70,
    "acc": 90,
    "uses": 8
  },
  "nightfall": {
    "name": "Nightfall",
    "type": "SHADE",
    "power": 70,
    "acc": 90,
    "uses": 8
  },
  "cinder_pounce": {
    "name": "Cinder Pounce",
    "type": "EMBER",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "puddle_stomp": {
    "name": "Puddle Stomp",
    "type": "TIDE",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "petal_hop": {
    "name": "Petal Hop",
    "type": "BLOOM",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "scree_slide": {
    "name": "Scree Slide",
    "type": "STONE",
    "power": 65,
    "acc": 90,
    "uses": 10
  },
  "whisker_spark": {
    "name": "Whisker Spark",
    "type": "VOLT",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "flurry_fluff": {
    "name": "Flurry Fluff",
    "type": "FROST",
    "power": 55,
    "acc": 95,
    "uses": 10,
    "effect": {
      "target": "foe",
      "stat": "spd",
      "stages": -1
    }
  },
  "kite_swoop": {
    "name": "Kite Swoop",
    "type": "GUST",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "gloam_swipe": {
    "name": "Gloam Swipe",
    "type": "SHADE",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "shell_roll": {
    "name": "Shell Roll",
    "type": "BLOOM",
    "power": 55,
    "acc": 95,
    "uses": 8,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": 1
    }
  },
  "burrow_bash": {
    "name": "Burrow Bash",
    "type": "BLOOM",
    "power": 65,
    "acc": 90,
    "uses": 10
  },
  "shard_pinch": {
    "name": "Shard Pinch",
    "type": "TIDE",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "lantern_waltz": {
    "name": "Lantern Waltz",
    "type": "VOLT",
    "power": 0,
    "acc": 100,
    "uses": 3,
    "effect": {
      "target": "self",
      "stat": "atk",
      "stages": 2
    }
  },
  "pinwheel_peck": {
    "name": "Pinwheel Peck",
    "type": "GUST",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "lullaby_hum": {
    "name": "Lullaby Hum",
    "type": "SHADE",
    "power": 0,
    "acc": 90,
    "uses": 5,
    "effect": {
      "target": "foe",
      "stat": "atk",
      "stages": -2
    }
  },
  "torch_tail": {
    "name": "Torch Tail",
    "type": "EMBER",
    "power": 80,
    "acc": 90,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": -1
    }
  },
  "riptide_howl": {
    "name": "Riptide Howl",
    "type": "TIDE",
    "power": 75,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "foe",
      "stat": "spd",
      "stages": -1
    }
  },
  "bramble_kick": {
    "name": "Bramble Kick",
    "type": "BLOOM",
    "power": 80,
    "acc": 90,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "spd",
      "stages": -1
    }
  },
  "summit_slam": {
    "name": "Summit Slam",
    "type": "STONE",
    "power": 85,
    "acc": 85,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "spd",
      "stages": -1
    }
  },
  "static_lunge": {
    "name": "Static Lunge",
    "type": "VOLT",
    "power": 80,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": -1
    }
  },
  "glacier_press": {
    "name": "Glacier Press",
    "type": "FROST",
    "power": 80,
    "acc": 90,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "spd",
      "stages": -1
    }
  },
  "crest_cyclone": {
    "name": "Crest Cyclone",
    "type": "GUST",
    "power": 75,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "spd",
      "stages": 1
    }
  },
  "eclipse_rush": {
    "name": "Eclipse Rush",
    "type": "SHADE",
    "power": 85,
    "acc": 85,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": -1
    }
  },
  "windfall": {
    "name": "Windfall",
    "type": "BLOOM",
    "power": 75,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "self",
      "heal": 0.25
    }
  },
  "hedgerow_crash": {
    "name": "Hedgerow Crash",
    "type": "BLOOM",
    "power": 75,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "atk",
      "stages": 1
    }
  },
  "mosaic_clamp": {
    "name": "Mosaic Clamp",
    "type": "TIDE",
    "power": 75,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "foe",
      "stat": "def",
      "stages": -1
    }
  },
  "halo_surge": {
    "name": "Halo Surge",
    "type": "VOLT",
    "power": 75,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "foe",
      "stat": "atk",
      "stages": -1
    }
  },
  "squall_line": {
    "name": "Squall Line",
    "type": "GUST",
    "power": 85,
    "acc": 85,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": -1
    }
  },
  "moon_cloak": {
    "name": "Moon Cloak",
    "type": "SHADE",
    "power": 75,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": 1
    }
  },
  "cursor_tap": {
    "name": "Cursor Tap",
    "type": "VOLT",
    "power": 40,
    "acc": 100,
    "uses": 15
  },
  "screen_glow": {
    "name": "Screen Glow",
    "type": "VOLT",
    "power": 0,
    "acc": 100,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "spd",
      "stages": 1
    }
  },
  "hover_hum": {
    "name": "Hover Hum",
    "type": "VOLT",
    "power": 55,
    "acc": 95,
    "uses": 10
  },
  "bit_burst": {
    "name": "Bit Burst",
    "type": "VOLT",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "archive_surge": {
    "name": "Archive Surge",
    "type": "VOLT",
    "power": 75,
    "acc": 90,
    "uses": 5
  },
  "fetch_dash": {
    "name": "Fetch Dash",
    "type": "BLOOM",
    "power": 60,
    "acc": 95,
    "uses": 10
  },
  "steadfast_paw": {
    "name": "Steadfast Paw",
    "type": "BLOOM",
    "power": 70,
    "acc": 95,
    "uses": 5,
    "effect": {
      "target": "self",
      "stat": "def",
      "stages": 1
    }
  }
};

const LEARNSETS = {
  "ember/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "stoke_up"
    ],
    [
      5,
      "flick_flame"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "kiln_rush"
    ],
    [
      15,
      "seed_toss"
    ],
    [
      20,
      "kindle_burst"
    ],
    [
      25,
      "updraft"
    ],
    [
      30,
      "arc_bolt"
    ]
  ],
  "ember/1": [
    [
      0,
      "cinder_pounce"
    ],
    [
      22,
      "dusk_fang"
    ]
  ],
  "ember/2": [
    [
      0,
      "torch_tail"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "tide/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "mist_veil"
    ],
    [
      5,
      "ripple_jab"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "undertow"
    ],
    [
      15,
      "frost_nip"
    ],
    [
      20,
      "breaker_wave"
    ],
    [
      25,
      "sap_sip"
    ],
    [
      30,
      "boulder_drop"
    ]
  ],
  "tide/1": [
    [
      0,
      "puddle_stomp"
    ],
    [
      22,
      "dusk_fang"
    ]
  ],
  "tide/2": [
    [
      0,
      "riptide_howl"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "bloom/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "sap_sip"
    ],
    [
      5,
      "seed_toss"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "thorn_lash"
    ],
    [
      15,
      "pebble_flick"
    ],
    [
      20,
      "briar_volley"
    ],
    [
      25,
      "stoke_up"
    ],
    [
      30,
      "gale_slice"
    ]
  ],
  "bloom/1": [
    [
      0,
      "petal_hop"
    ],
    [
      22,
      "arc_bolt"
    ]
  ],
  "bloom/2": [
    [
      0,
      "bramble_kick"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "stone/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "brace_rock"
    ],
    [
      5,
      "pebble_flick"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "boulder_drop"
    ],
    [
      15,
      "flick_flame"
    ],
    [
      20,
      "quarry_crash"
    ],
    [
      25,
      "stoke_up"
    ],
    [
      30,
      "sleet_pelt"
    ]
  ],
  "stone/1": [
    [
      0,
      "scree_slide"
    ],
    [
      22,
      "undertow"
    ]
  ],
  "stone/2": [
    [
      0,
      "summit_slam"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "volt/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "neon_flash"
    ],
    [
      5,
      "zap_tap"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "arc_bolt"
    ],
    [
      15,
      "puff_shot"
    ],
    [
      20,
      "neon_burst"
    ],
    [
      25,
      "mist_veil"
    ],
    [
      30,
      "undertow"
    ]
  ],
  "volt/1": [
    [
      0,
      "whisker_spark"
    ],
    [
      22,
      "dusk_fang"
    ]
  ],
  "volt/2": [
    [
      0,
      "static_lunge"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "frost/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "cold_snap"
    ],
    [
      5,
      "frost_nip"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "sleet_pelt"
    ],
    [
      15,
      "zap_tap"
    ],
    [
      20,
      "rime_rush"
    ],
    [
      25,
      "sap_sip"
    ],
    [
      30,
      "boulder_drop"
    ]
  ],
  "frost/1": [
    [
      0,
      "flurry_fluff"
    ],
    [
      22,
      "arc_bolt"
    ]
  ],
  "frost/2": [
    [
      0,
      "glacier_press"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "gust/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "updraft"
    ],
    [
      5,
      "puff_shot"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "gale_slice"
    ],
    [
      15,
      "pebble_flick"
    ],
    [
      20,
      "tempest_dive"
    ],
    [
      25,
      "stoke_up"
    ],
    [
      30,
      "kiln_rush"
    ]
  ],
  "gust/1": [
    [
      0,
      "kite_swoop"
    ],
    [
      22,
      "boulder_drop"
    ]
  ],
  "gust/2": [
    [
      0,
      "crest_cyclone"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "shade/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "night_veil"
    ],
    [
      5,
      "gloom_poke"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "dusk_fang"
    ],
    [
      15,
      "frost_nip"
    ],
    [
      20,
      "nightfall"
    ],
    [
      25,
      "updraft"
    ],
    [
      30,
      "gale_slice"
    ]
  ],
  "shade/1": [
    [
      0,
      "gloam_swipe"
    ],
    [
      22,
      "sleet_pelt"
    ]
  ],
  "shade/2": [
    [
      0,
      "eclipse_rush"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "beetle/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "brace_rock"
    ],
    [
      5,
      "seed_toss"
    ],
    [
      9,
      "sap_sip"
    ],
    [
      12,
      "thorn_lash"
    ],
    [
      15,
      "pebble_flick"
    ],
    [
      20,
      "briar_volley"
    ],
    [
      25,
      "stoke_up"
    ],
    [
      30,
      "gale_slice"
    ]
  ],
  "beetle/1": [
    [
      0,
      "shell_roll"
    ],
    [
      22,
      "boulder_drop"
    ]
  ],
  "beetle/2": [
    [
      0,
      "windfall"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "mole/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "stoke_up"
    ],
    [
      5,
      "seed_toss"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "thorn_lash"
    ],
    [
      15,
      "boulder_drop"
    ],
    [
      20,
      "briar_volley"
    ],
    [
      25,
      "brace_rock"
    ],
    [
      30,
      "kiln_rush"
    ]
  ],
  "mole/1": [
    [
      0,
      "burrow_bash"
    ],
    [
      22,
      "undertow"
    ]
  ],
  "mole/2": [
    [
      0,
      "hedgerow_crash"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "crab/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "brace_rock"
    ],
    [
      5,
      "ripple_jab"
    ],
    [
      9,
      "tumble_charge"
    ],
    [
      12,
      "undertow"
    ],
    [
      15,
      "pebble_flick"
    ],
    [
      20,
      "breaker_wave"
    ],
    [
      25,
      "stoke_up"
    ],
    [
      30,
      "sleet_pelt"
    ]
  ],
  "crab/1": [
    [
      0,
      "shard_pinch"
    ],
    [
      22,
      "boulder_drop"
    ]
  ],
  "crab/2": [
    [
      0,
      "mosaic_clamp"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "moth/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "neon_flash"
    ],
    [
      5,
      "zap_tap"
    ],
    [
      9,
      "updraft"
    ],
    [
      12,
      "arc_bolt"
    ],
    [
      15,
      "puff_shot"
    ],
    [
      20,
      "neon_burst"
    ],
    [
      25,
      "mist_veil"
    ],
    [
      30,
      "thorn_lash"
    ]
  ],
  "moth/1": [
    [
      0,
      "lantern_waltz"
    ],
    [
      22,
      "gale_slice"
    ]
  ],
  "moth/2": [
    [
      0,
      "halo_surge"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "vane/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "updraft"
    ],
    [
      5,
      "puff_shot"
    ],
    [
      9,
      "cold_snap"
    ],
    [
      12,
      "gale_slice"
    ],
    [
      15,
      "pebble_flick"
    ],
    [
      20,
      "tempest_dive"
    ],
    [
      25,
      "neon_flash"
    ],
    [
      30,
      "kiln_rush"
    ]
  ],
  "vane/1": [
    [
      0,
      "pinwheel_peck"
    ],
    [
      22,
      "sleet_pelt"
    ]
  ],
  "vane/2": [
    [
      0,
      "squall_line"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "dormouse/0": [
    [
      1,
      "bump"
    ],
    [
      3,
      "night_veil"
    ],
    [
      5,
      "gloom_poke"
    ],
    [
      9,
      "frost_nip"
    ],
    [
      12,
      "dusk_fang"
    ],
    [
      15,
      "sap_sip"
    ],
    [
      20,
      "nightfall"
    ],
    [
      25,
      "mist_veil"
    ],
    [
      30,
      "gale_slice"
    ]
  ],
  "dormouse/1": [
    [
      0,
      "lullaby_hum"
    ],
    [
      22,
      "sleet_pelt"
    ]
  ],
  "dormouse/2": [
    [
      0,
      "moon_cloak"
    ],
    [
      27,
      "full_tilt"
    ]
  ],
  "byte/0": [
    [1, "bump"],
    [3, "screen_glow"],
    [5, "cursor_tap"],
    [9, "zap_tap"],
    [12, "arc_bolt"],
    [16, "puff_shot"],
    [20, "neon_burst"],
    [24, "hover_hum"],
    [28, "updraft"]
  ],
  "byte/1": [
    [0, "bit_burst"],
    [22, "gale_slice"]
  ],
  "byte/2": [
    [0, "archive_surge"],
    [27, "full_tilt"]
  ],
  "fetch/0": [
    [1, "bump"],
    [3, "sap_sip"],
    [5, "seed_toss"],
    [9, "tumble_charge"],
    [12, "thorn_lash"],
    [15, "mist_veil"],
    [20, "briar_volley"],
    [25, "stoke_up"],
    [30, "undertow"]
  ],
  "fetch/1": [
    [0, "fetch_dash"],
    [22, "pebble_flick"]
  ],
  "fetch/2": [
    [0, "steadfast_paw"],
    [27, "full_tilt"]
  ],
  // HUSHWATER B2 (D356): existing moves only. Stage 0 at 1/3/5/9/12/15/20/25/30; stage 1 is the signature plus 22; stage 2 is the signature plus 27.
  "skink/0": [[1, "bump"], [3, "stoke_up"], [5, "flick_flame"], [9, "tumble_charge"], [12, "kiln_rush"], [15, "pebble_flick"], [20, "kindle_burst"], [25, "brace_rock"], [30, "scree_slide"]],
  "skink/1": [[0, "cinder_pounce"], [22, "boulder_drop"]],
  "skink/2": [[0, "torch_tail"], [27, "full_tilt"]],
  "otter/0": [[1, "bump"], [3, "mist_veil"], [5, "frost_nip"], [9, "ripple_jab"], [12, "sleet_pelt"], [15, "cold_snap"], [20, "rime_rush"], [25, "undertow"], [30, "breaker_wave"]],
  "otter/1": [[0, "flurry_fluff"], [22, "puddle_stomp"]],
  "otter/2": [[0, "glacier_press"], [27, "full_tilt"]],
  "owl/0": [[1, "bump"], [3, "night_veil"], [5, "gloom_poke"], [9, "puff_shot"], [12, "dusk_fang"], [15, "updraft"], [20, "nightfall"], [25, "gale_slice"], [30, "kite_swoop"]],
  "owl/1": [[0, "lullaby_hum"], [22, "gloam_swipe"]],
  "owl/2": [[0, "moon_cloak"], [27, "full_tilt"]],
  "snail/0": [[1, "bump"], [3, "brace_rock"], [5, "pebble_flick"], [9, "tumble_charge"], [12, "undertow"], [15, "sap_sip"], [20, "quarry_crash"], [25, "mist_veil"], [30, "thorn_lash"]],
  "snail/1": [[0, "boulder_drop"], [22, "scree_slide"]],
  "snail/2": [[0, "summit_slam"], [27, "full_tilt"]]
};

const TRAINERS = {
  "route1_pia": {
    "name": "Pia",
    "title": "Kite Kid",
    "map": "route1",
    "x": 10,
    "y": 6,
    "ai": "basic",
    "team": [
      {
        "form": "gust/0",
        "level": 4
      },
      {
        "form": "beetle/0",
        "level": 5
      }
    ],
    "money": null,
    "lines": {
      "intro": "My kites never lose!",
      "win": "Aw, my string snapped...",
      "lose": "Ha! Rest up and come back, {player}."
    }
  },
  "hall1_fen": {
    "name": "Fen",
    "title": "Trial Master",
    "hall": true,
    "seal": "seal_fernbrook",
    "ai": "leader",
    "items": {
      "heal_snack": 1
    },
    "team": [
      {
        "form": "mole/0",
        "level": 12,
        "moves": [
          "stoke_up",
          "seed_toss",
          "tumble_charge",
          "thorn_lash"
        ]
      },
      {
        "form": "beetle/0",
        "level": 13,
        "moves": [
          "brace_rock",
          "seed_toss",
          "sap_sip",
          "thorn_lash"
        ]
      },
      {
        "form": "mole/1",
        "level": 14,
        "moves": [
          "stoke_up",
          "seed_toss",
          "tumble_charge",
          "thorn_lash"
        ]
      }
    ],
    "money": null,
    "lines": {
      "intro": "Roots first, then blossoms. Show me yours.",
      "win": "Ha! The orchard approves of you, {player}.",
      "lose": "Rest under the trees a while. Come back greener."
    }
  }
};

const BATTLE_TEXT = {
  "trainerSummon": "{trainer} has summoned {foe}!",
  "trainerIntro": "{title} {trainer} wants a friendly match with {player}!",
  "trainerSend": "{trainer} summons {foe}!",
  "playerSend": "{player} summons {pet}!",
  "wildAppear": "A wild {foe} wanders out!",
  "wildSend": "You're up, {pet}!",
  "swapOut": "{pet}, take a breather!",
  "trainerWin": "{player} won the match against {title} {trainer}!",
  "trainerLose": "{player}'s whole team is worn out...",
  "petFainted": "{pet} is worn out!",
  "foeFainted": "{foe} is worn out!",
  "befriendWary": "It's wary. Wear it down first."
};
// GLIMMER_PATH v0.2: the wary line rotates through these three (one per battle, in order); no gameplay change.
// befriendWary above stays the first for callers that read a single string.
const BEFRIEND_WARY_LINES = Object.freeze([
  BATTLE_TEXT.befriendWary,
  "It keeps its distance. Tire it first.",
  "It's not sure yet. Weaken it a bit."
]);

const STAGE_MULT = {
  "0": 1,
  "1": 1.25,
  "2": 1.5,
  "3": 1.75,
  "-3": 0.5,
  "-2": 0.65,
  "-1": 0.8
};

const TEXT_MS = {
  "slow": 1600,
  "normal": 1100,
  "fast": 600
};

function learnset(formId){
  const [line, s] = formId.split('/'), out = [];
  for (let k = 0; k <= +s; k++) for (const [lv, id] of LEARNSETS[line + '/' + k] || []) out.push({lv, id, stage:k});
  return out.sort((a, b) => a.lv - b.lv || a.stage - b.stage);   // stable; evolution moves (lv 0) sort first
}

function defaultMoves(formId, L){
  const all = learnset(formId), lvl = all.filter(e => e.lv >= 1 && e.lv <= L), evo = all.filter(e => e.lv === 0);
  return [...lvl, ...evo].map(e => e.id).slice(-4);
}

// Befriend zone width (NEXT_PLAN WP-A). Without `ctx` this is the pre-WP-A formula (kept for old call sites and tests).
// With ctx = { foeLv, leadLv, engaged }: an untouched foe is much harder (full HP 0.30, was 0.50), the width falls with the
// foe's level and with each level it has over the lead, and being in the fight (a turn has passed) gives a small credit.
// JOY scales with level too, so a high-level foe's zone doesn't float on the flat joy term. Floor 0.06, cap 0.50 unchanged.
const BEFRIEND_TUNE = { fullHp: 0.30, hpSlope: 0.90, perLevel: 0.025, overLead: 0.03, levelFloor: 0.50, levelCap: 1.10, engaged: 1.10, guide: 0.08 };
function befriendLevelMul(foeLv, leadLv){
  const T = BEFRIEND_TUNE, fl = Math.max(1, +foeLv || 1), ll = Math.max(1, +leadLv || fl);
  return Math.max(T.levelFloor, Math.min(T.levelCap, 1 - T.perLevel * (fl - 2) - T.overLead * Math.max(0, fl - ll)));
}
function befriendWidth(hpFrac, stage, joy, treat, ctx){
  const base = stage === 0 ? 0.22 : 0.14, hp = Math.max(0, Math.min(1, +hpFrac || 0)), j = Math.max(0, Math.min(100, +joy || 0));
  if (!ctx) return Math.max(0.06, Math.min(0.50, base * (0.5 + (1 - hp)) + j / 1000 + (treat ? 0.08 : 0)));
  const T = BEFRIEND_TUNE, hpTerm = T.fullHp + T.hpSlope * (1 - hp), lm = befriendLevelMul(ctx.foeLv, ctx.leadLv), eng = ctx.engaged ? T.engaged : 1;
  return Math.max(0.06, Math.min(0.50, (base * hpTerm + j / 1000) * lm * eng + (treat ? 0.08 : 0)));
}
// Marker speed by level: +1.2% per level over 2, capped at +35% (Lv 31+).
function befriendSpeed(stage, foeLv){ return (stage ? 0.0042 : 0.003) * Math.min(1.35, 1 + 0.012 * Math.max(0, (+foeLv || 2) - 2)); }
// Rough chance that a random press lands: the marker is a sine, so it lingers at the bar's ends (arcsine law); the zone's
// centre is uniform in 0.2..0.8. Averaged over centres. Skilled timing beats this; it is a tuning yardstick, not a promise.
function befriendHitChance(width){
  const w = Math.max(0, Math.min(1, width)), F = m => Math.asin(2 * Math.max(0, Math.min(1, m)) - 1) / Math.PI;
  let sum = 0, n = 0;
  for (let c = 0.2; c <= 0.8001; c += 0.05) { sum += F(c + w / 2) - F(c - w / 2); n++; }
  return sum / n;
}
// Dev check (WP-A task 6): non-increasing in foeLv, non-decreasing as HP falls, floor and cap hold. Returns problems.
function befriendDevCheck(){
  const bad = [], W = (hp, lv, lead, eng) => befriendWidth(hp, 0, 60, false, { foeLv: lv, leadLv: lead, engaged: eng });
  for (const hp of [1, 0.5, 0.25]) for (let lv = 2; lv < 40; lv++) if (W(hp, lv + 1, 12, true) > W(hp, lv, 12, true) + 1e-9) bad.push('width rises with level at hp ' + hp + ' lv ' + lv);
  for (const lv of [3, 13, 18, 30]) for (let hp = 1; hp > 0.01; hp -= 0.05) if (W(hp - 0.05, lv, lv, true) < W(hp, lv, lv, true) - 1e-9) bad.push('width falls as hp drops at lv ' + lv);
  for (const lv of [1, 50]) for (const hp of [0, 1]) for (const st of [0, 1]) for (const tr of [false, true]) { const w = befriendWidth(hp, st, 100, tr, { foeLv: lv, leadLv: 5, engaged: true }); if (w < 0.06 - 1e-9 || w > 0.5 + 1e-9) bad.push('out of range ' + w); }
  if (befriendWidth(1, 0, 60, false) !== Math.max(0.06, Math.min(0.5, 0.22 * 0.5 + 0.06))) bad.push('legacy formula changed');
  return bad;
}
function battleLine(key, vars){
  let t = BATTLE_TEXT[key] || "";
  const v = Object.assign({}, vars);
  if (v.name != null && v.player == null) v.player = v.name;   // MAPS_SLICE {name} alias
  for (const [k, val] of Object.entries(v)) t = t.split("{"+k+"}").join(String(val == null ? "" : val));
  return t;
}
