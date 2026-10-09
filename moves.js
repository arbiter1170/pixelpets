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
  ]
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
  "foeFainted": "{foe} is worn out!"
};

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

function befriendWidth(hpFrac, stage, joy, treat){
  const base = stage === 0 ? 0.22 : 0.14;
  return Math.max(0.06, Math.min(0.50, base * (0.5 + (1 - hpFrac)) + joy / 1000 + (treat ? 0.08 : 0)));
}
function battleLine(key, vars){
  let t = BATTLE_TEXT[key] || "";
  const v = Object.assign({}, vars);
  if (v.name != null && v.player == null) v.player = v.name;   // MAPS_SLICE {name} alias
  for (const [k, val] of Object.entries(v)) t = t.split("{"+k+"}").join(String(val == null ? "" : val));
  return t;
}
