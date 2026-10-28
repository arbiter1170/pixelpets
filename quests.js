/* Walklings - quest chain (NEXT_PLAN WP-C). Pure data plus a resolver; no DOM, no game state of its own.
   The current objective is derived entirely from the save's flags, so there is nothing to migrate: an old save lands on
   the right step the moment it loads. game.js reads PPQuests.current(state) and draws the button, the panel and the cues.

   state = { flags, seals, pets }  (S.flags, S.seals, number of owned Walklings)
   entry = { id, when?: [cond], done: [cond], text, place, target?: { map, x, y }, glimmer?: { text, place } }
   Copy (Build 2): the designer's objective text and places (GLIMMER_PATH v0.2). A `glimmer` block overrides text/place only
   while story.side is 'glimmer'; one when/done chain serves both sides. Text <= 110 chars, place <= 24, no tokens.
   Entries are in story order. The first entry that is not done (its own `done` flags, or any later entry's) and whose
   optional `when` holds is the current objective; `when` is only for skips (the first-wild meet when a second Walkling
   already joined). Conditions use the scene `cond()` syntax subset: 'flag', '!flag', 'flag=value', 'seal:id', plus 'pets>=N'. */
(function (root) {
  'use strict';
  const LINE_MAX = 110;   // same as interiors.json dialog.lineMax
  const PLACE_MAX = 24;   // GLIMMER_PATH v0.2 quest copy: place lines
  // Panel lines for when the player is stuck (GLIMMER_PATH v0.2 questStuck). [0] shows when nobody on the team can battle;
  // [1] and [2] are kept as data (no rule says when they appear yet; see OPEN_DECISIONS).
  const STUCK = Object.freeze([
    'Your team is worn out. Rest the whole party at a Lantern House. A rest costs a few Acorns.',
    'Lost? Open the map. The blinking dot is you.',
    'No rush. A walk with your Walkling helps you think.',
  ]);

  // Story flags written by the design data that are deliberately not chain steps (branch inputs, puzzle bits, values).
  // D441 (D12): optional finds counted on the NEXT STEP panel as "N side tasks nearby" while the holder is on their map. Not steps,
  // no marker, no chain row. `obj` is the map object; `done` is the flag its scene writes.
  const SIDE_TASKS = Object.freeze([
    Object.freeze({ id: 'faded_fuzzwick', map: 'fernbrook', obj: 'faded_fuzzwick', done: 'story.faded_fuzzwick' }),
    Object.freeze({ id: 'faded_pebblit', map: 'route2_glen', obj: 'faded_pebblit', done: 'story.faded_pebblit' }),
    Object.freeze({ id: 'brine_drizzlet', map: 'bw_depot_in', obj: 'brine_drizzlet', done: 'story.brine_drizzlet' }),   // BRINEWICK
  ]);
  const sideTaskLine = n => (n === 1 ? '1 side task nearby' : n + ' side tasks nearby');
  const NOT_STEPS = ['story.starter_line', 'story.rook_pact', 'story.rook_saw_lamps', 'story.h2_seam_a', 'story.h2_seam_b',
    'story.side', 'story.side_pick_done',    // WP-B0: the faction pledge is a branch, not a step (the chain is shared by both sides)
    'story.tour1_s1', 'story.tour1_s2', 'story.tour1_s3',   // Build 3: Bright Pavilion Tour progress; story.seal1 is still the hall1 step
    'story.switches', 'story.switch_chapter', 'story.switch_at',   // BS: switch bookkeeping written by the engine, never a step
'story.hc_invite', 'story.hc_arrived', 'story.hc_greeted', 'story.hc_games', 'story.hc_tonic',
    'story.hc_clear_lantern', 'story.hc_clear_shells', 'story.hc_clear_chirp', 'story.hc_clear_dash', 'story.hc_clear_pairs',
    'story.hc_clear_hop', 'story.hc_clear_relay', 'story.hc_clear_seek',
    'story.dream_roll', 'story.dream_red', 'story.dream_yellow', 'story.dream_blue',   // High Charity and Mahopac bits; neither is a main-chain step
    // Fernbrook Heights: floor and offer flags. story.heights_done is the chain step. seal1 implies the step via skipIf.
    'story.know_us', 'story.heights_path', 'story.stock_warned', 'story.rx_enter', 'story.met_nia', 'story.rx_f1',
    'story.met_cal', 'story.rx_f2', 'story.saw_arbiter', 'story.rx_f3', 'story.rx_done', 'story.rx_bitlet', 'story.sm_yard', 'story.sm_look',
    'story.met_jed', 'story.sm_freed', 'story.sm_haul', 'story.sm_done',
    'story.rook_end', 'story.rook_bond', 'story.rook_quit',
    'story.arbiter_test_seen', 'story.arbiter_test_active', 'story.arbiter_test_done', 'story.tour_unease',
    'story.rc_end', 'story.rc_freed', 'story.rc_stamped', 'story.rc_loose',
    'story.rc_tobin_done', 'story.rc_tobin_result', 'story.rival3_done', 'story.rival3_result',
    'story.switch_via',
    'story.met_bram', 'story.met_mo', 'story.met_wynn', 'story.met_lumen', 'story.met_rue',
    // Lizzy in Hearthmoor: the meet, the hug, and the Rook hook. Sister scenes and the landlord quests are a later build.
    'story.lizzy_met', 'story.lizzy_hug', 'story.lizzy_rook',
    'story.buddy_pat_today', 'story.leak5b_seen',
    'story.unlock_rep', 'story.unlock_phone', 'story.unlock_sides', 'story.unlock_quests', 'story.unlock_moral',
    'story.unlock_switch', 'story.unlock_letter', 'story.unlock_lantern', 'story.unlock_growup',
    // TB-3: the posting sets the pin only. It is not a step. Yes, the sign, and the report live on BOARD.
    'story.board_gate_pinned',
    // The Signal Review (GLIMMER_NEXT_QUEST). Done flags live on the four CHAIN rows. These are branches and one-shots.
    'story.gb_escort', 'story.gb_loan', 'story.gb_relay_let', 'story.gb_relay_back',
    'story.gb_hollis_kept', 'story.gb_hollis_told', 'story.gb_read', 'story.gb_stand', 'story.gb_hold',
    'story.gb_tune_asked', 'story.gb_tobin', 'story.gb_imogen_done', 'story.gb_imogen_result',
    // HUSHWATER: first step in. Not a chain step (no CHAIN row). The stair and Lizzy flags are not written here.
    'story.hw_reached',
    // BRINEWICK: Rook's arrival, the Glimmer manifest choice and the two Hall gauges. Not chain steps.
    'story.brine_arrived', 'story.brine_manifest', 'story.h3_gauge_a', 'story.h3_gauge_b',
    // ARBITER_UNITS Build C (D848-D853): Route 3 arrival and its derived open flag, the first four clues, and the boss rest flags are not steps.
    'story.reached_route3', 'story.route3_open', 'story.ans_tallybat_clue', 'story.ans_dimlamp_clue', 'story.ans_filecrow_clue', 'story.ans_cordhound_clue',
    'story.ans_tallybat_rest', 'story.ans_dimlamp_rest', 'story.ans_filecrow_rest', 'story.ans_cordhound_rest', 'story.ans_humwisp_rest'];

  const CHAIN = [
    { id: 'wake', done: ['story.intro_seen'],
      text: 'Good morning! Look around your room, then read the note by the door.', place: 'Hearthmoor, home',
      target: { map: 'hm_home_in', x: 4, y: 7 } },
    { id: 'lodge', done: ['story.starter_received'],
      text: "Someone small is waiting at the Warden's Lodge. Ilse has a Walkling for you.", place: "Warden's Lodge",
      target: { map: 'hm_lodge_in', x: 5, y: 3 } },
    { id: 'rival1', done: ['story.rival1_done'],
      text: 'Rook is bouncing by the east gate. Go and say hello.', place: 'Hearthmoor, east gate',
      target: { map: 'hearthmoor', x: 22, y: 8 } },
    { id: 'first_wild', when: ['!pets>=2'], done: ['story.first_wild_met'],
      text: 'A wild Walkling is nosing through the grass by the east path. Walk up gently.', place: 'Hearthmoor, east path',
      target: { map: 'hearthmoor', x: 18, y: 9 }, follow: 'guide' },   // game.js moves the cue onto the live guide wild when it is out
    { id: 'route1', done: ['story.reached_route1'],
      text: 'Route 1 starts past the east gate. Take your Walkling for a stroll.', place: 'Hearthmoor, east path',
      target: { map: 'hearthmoor', x: 23, y: 8 } },
    { id: 'fernbrook', done: ['story.reached_fernbrook'],
      text: "Follow the stream east along Route 1. Fernbrook's orchards are at the far end.", place: 'Route 1, east end',
      target: { map: 'route1', x: 47, y: 8 } },
    { id: 'glimmer', done: ['story.met_glimmerwell'],
      text: "There's a shiny new stand in the square. See what all the fuss is about.", place: 'Fernbrook square',
      target: { map: 'fernbrook', x: 13, y: 8 } },
    { id: 'fen', done: ['story.met_fen'],
      text: 'Master Fen is out in the orchard, west of the square. She looks worried.', place: 'Fernbrook orchard',
      target: { map: 'fernbrook', x: 10, y: 9 } },
    { id: 'heights', when: ['story.side_pick_done'], done: ['story.heights_done'], skipIf: ['story.seal1'], noImply: true,
      text: 'Get to know us. North in the Heights, Walklings are moved at night. Stock up first.', place: 'Fernbrook Heights',
      glimmer: { text: 'Get to know us. Copy Atten from RegenX. A floating computer woke in the top bay.', place: 'Fernbrook Heights' },
      target: { map: 'fb_heights', x: 12, y: 10 } },
    { id: 'orchard', done: ['story.orchard_cleared'],
      text: 'Tobin is stacking crates by the orchard gate. Help the Pomlets out.', place: 'Orchard gate',
      glimmer: { text: 'Tobin needs a hand packing crates at the orchard gate.', place: 'Orchard gate' },
      target: { map: 'fernbrook', x: 9, y: 14 } },
    { id: 'hall1', done: ['story.seal1'],
      text: 'The Trial Hall doors are open. Challenge Master Fen for the Fernbrook Seal.', place: 'Fernbrook Trial Hall',
      glimmer: { text: "Juniper's partnership tour ends at the Trial Hall. Fen's match is optional.", place: 'Fernbrook Trial Hall' },
      target: { map: 'fernbrook', x: 22, y: 6 } },
    { id: 'teaser', done: ['story.slice_end'],
      text: 'Rook has news, waiting outside the Trial Hall.', place: 'Trial Hall doorstep',
      glimmer: { text: 'Rook is lurking outside the Trial Hall. Probably about Bright of the Month.', place: 'Trial Hall doorstep' },
      target: { map: 'fernbrook', x: 22, y: 8 } },
    { id: 'route2', done: ['story.reached_route2'],
      text: 'The rubble east of Fernbrook is cleared. Route 2 is waiting.', place: 'Fernbrook, east edge',
      target: { map: 'fernbrook', x: 31, y: 8 } },
    { id: 'census', done: ['story.met_census'],
      text: 'Follow Route 2 east. Glimmerwell has set something up halfway along.', place: 'Route 2, halfway',
      glimmer: { text: 'The Glow Census tent is halfway along Route 2. They need volunteers.', place: 'Route 2, halfway' },
      target: { map: 'route2', x: 24, y: 8 } },
    { id: 'glen', done: ['story.reached_glen'],
      text: 'A little path heads north off Route 2, into Wickerglen.', place: 'Route 2, north path',
      target: { map: 'route2', x: 24, y: 0 } },
    { id: 'lead', done: ['story.met_lead'],
      text: 'Find Field Lead Imogen among the lamps in Wickerglen.', place: 'Wickerglen',
      glimmer: { text: 'Report to Field Lead Imogen among the lamps in Wickerglen.', place: 'Wickerglen' },
      target: { map: 'route2_glen', x: 12, y: 10 } },
    { id: 'glen_cleared', done: ['story.glen_cleared'],
      text: 'The Comfort Lamps hum oddly. Battle Field Lead Imogen beneath them.', place: 'Wickerglen lamps',
      glimmer: { text: 'Imogen wants to see your team in action, right under the Comfort Lamps.', place: 'Wickerglen lamps' },
      target: { map: 'route2_glen', x: 12, y: 5 } },
    { id: 'route2_end', done: ['story.route2_end'],
      text: 'Rook is waiting by the gate at the east end of Route 2.', place: 'Route 2, east gate',
      target: { map: 'route2', x: 44, y: 8 } },
    { id: 'cobblecrest', done: ['story.reached_cobblecrest'],
      text: 'The gate is open. Cobblecrest is just to the east.', place: 'Route 2, east gate',
      target: { map: 'route2', x: 47, y: 8 } },
    { id: 'cobble_arrive', done: ['story.cobble_arrived'],
      text: "Rook is waiting just inside Cobblecrest's west gate.", place: 'Cobblecrest, west gate',
      target: { map: 'cobblecrest', x: 3, y: 7 } },
    { id: 'quarry', done: ['story.reached_quarry'],
      text: "There's an open house at the quarry, up the north road.", place: 'Cobblecrest, north road',
      target: { map: 'cobblecrest', x: 16, y: 0 } },
    { id: 'buyout', done: ['story.quarry_bought'],
      text: "Walk up to the stage. Rook's supervisor is about to speak.", place: 'Quarry stage',
      glimmer: { text: 'Join Dorian Pell on the stage. Big day for the quarry!', place: 'Quarry stage' },
      target: { map: 'cobble_quarry', x: 16, y: 4 } },
    { id: 'hall2', done: ['story.seal2'],
      text: "Hale's Hall is open. Challenge Master Hale for the Cobblecrest Seal.", place: 'Cobblecrest Hall',
      glimmer: { text: 'Your second review is a Tuning. The free quota still closes it.', place: 'Cobblecrest Hall' },
      target: { map: 'cc_hall_in', x: 5, y: 2 } },
    { id: 'hook', done: ['story.cobble_end'],
      text: 'Rook is outside the Hall with news from the quarry.', place: "Outside Hale's Hall",
      glimmer: { text: 'Rook is by the Brinewick cart. He is staying with Glimmerwell.', place: "Outside Hale's Hall" },
      target: { map: 'cobblecrest', x: 25, y: 7 } },
    { id: 'hc_council', when: ['!story.side=glimmer'], done: ['story.hc_council_done'], noImply: true,
      text: 'High Charity called a Lantern Council. Bring both Seals to Sky-Dock Command.', place: 'High Charity, sky-dock',
      target: { map: 'hc_command_in', x: 2, y: 3 } },
    { id: 'gb_invite', when: ['story.side=glimmer'], done: ['story.gb_invited'],
      text: 'Dorian Pell is back on the quarry stage. Glimmerwell has news.', place: 'Quarry stage',
      target: { map: 'cobble_quarry', x: 16, y: 4 } },
    { id: 'gb_relay', when: ['story.side=glimmer'], done: ['story.gb_relay_done'],
      text: 'Field Lead Imogen is testing relays at the Wickerglen lamps.', place: 'Wickerglen, the lamps',
      target: { map: 'route2_glen', x: 12, y: 5 } },
    { id: 'gb_hollis', when: ['story.side=glimmer'], done: ['story.gb_hollis'],
      text: 'Associate Hollis is waiting on Route 2. He wants a quiet word.', place: 'Route 2, the Census',
      target: { map: 'route2', x: 25, y: 1 } },
    { id: 'gb_briefing', when: ['story.side=glimmer'], done: ['story.gb_done'],
      text: 'The Capital Partnership Briefing is in the Arbiter Bay.', place: 'Heights, top bay',
      target: { map: 'rx_f4', x: 6, y: 4 } },
    // BRINEWICK (one-pager v0.1, defaults): after the road opens (story.route3_open: Rook's last crates plus the chapter end, D848).
    // Until then the chain idles on `end`, so the High Charity games pointer and the side chains keep that card.
    { id: 'route3', when: ['story.route3_open'], done: ['story.reached_brinewick'],
      text: 'Walk Route 3 south. The gate at the far end opens onto Brinewick.', place: 'Route 3, south gate',
      target: { map: 'route3', x: 11, y: 46 } },
    { id: 'brine_depot', when: ['story.route3_open'], done: ['story.brine_depot'],
      text: 'Rook says the crates went into the white depot on the east pier. Go and look.', place: 'Brinewick, east pier',
      target: { map: 'brinewick', x: 24, y: 11 } },
    { id: 'brine_crate', when: ['story.route3_open'], done: ['story.brine_freed'],
      text: 'One crate in the depot hums. It is a cage. Look inside.', place: 'Brinewick depot',
      glimmer: { text: 'Line twelve on the manifest is a cage by the wall. Look before you sign.', place: 'Brinewick depot' },
      target: { map: 'bw_depot_in', x: 9, y: 3 } },
    { id: 'brine_dorian', when: ['story.route3_open'], done: ['story.brine_dorian'],
      text: 'Dorian Pell is waiting on the quay outside the depot.', place: 'Brinewick quay',
      glimmer: { text: 'Dorian Pell wants your quarterly review, out on the quay.', place: 'Brinewick quay' },
      target: { map: 'brinewick', x: 25, y: 13 } },
    { id: 'hall3', when: ['story.route3_open'], done: ['story.seal3'],
      text: "Master Marisol's Trial Hall is open on the west pier. Challenge her for the Brinewick Seal.", place: 'Brinewick Trial Hall',
      glimmer: { text: "Quinn is closing the quarter in Marisol's Hall. The captain's match is optional.", place: 'Brinewick Trial Hall' },
      target: { map: 'bw_hall_in', x: 5, y: 3 } },
    { id: 'ep1_end', when: ['story.route3_open'], done: ['story.ep1_end'],
      text: 'Rook is waiting outside the Trial Hall.', place: 'Brinewick, west pier',
      target: { map: 'brinewick', x: 6, y: 13 } },
    { id: 'end', done: [],
      text: "That's all for now. Explore, fill the Journal, and grow your friendships.", place: 'The Amberwild' },
  ];

  // Side quests do not move the main chain. Chains are independent: a later step implies earlier ones
  // only inside its own chain. The phone is the featured side quest until the officers issue it, then Mom's dream.
  const SIDE_CHAINS = [
    [
      { id: 'phone', label: 'Explore Route 1', when: ['story.starter_received'], done: ['story.phone_got'],
        text: 'The wild past the east gate is open. Go and explore.',
        place: 'Route 1, west end',
        target: { map: 'route1', x: 3, y: 7 } },
    ],
    [
      { id: 'mom', label: "Mom's trip", when: ['story.starter_received'], givers: ['mom'], done: ['story.mom_met'],
        text: 'Mom is upstairs. She wants to meet your Walkling.', place: 'Your home, upstairs',
        target: { map: 'hm_home_up', x: 5, y: 3 } },
      { id: 'mom_chore', when: ['story.mom_met'], done: ['story.mom_chore'],
        text: 'Clear the crumbs downstairs so your Walkling has a place to sit.', place: 'Your home',
        target: { map: 'hm_home_in', x: 7, y: 5 } },
      { id: 'mom_sent', when: ['story.mom_chore'], done: ['story.mom_sent'],
        text: 'Tell Mom the table is clear. She has a trip in mind.', place: 'Your home, upstairs',
        target: { map: 'hm_home_up', x: 5, y: 3 } },
      { id: 'mahopac', when: ['story.mom_sent'], done: ['story.reached_mahopac'],
        text: 'Take your Walkling up the north trail to Mahopac.', place: 'Hearthmoor, north trail',
        target: { map: 'hearthmoor', x: 9, y: 2 } },
      { id: 'observatory', when: ['story.reached_mahopac'], done: ['story.dream_started'],
        text: 'Step into Breckenridge Observatory. The lens is waiting.', place: 'Mahopac observatory',
        target: { map: 'mahopac_obs', x: 4, y: 2 } },
      { id: 'dream_toy', when: ['story.dream_started'], done: ['story.dream_toy'],
        text: 'You are small again. Push the popping toy around the rug.', place: 'A dream, 2004',
        target: { map: 'dream_2004', x: 3, y: 3 }, follow: 'pop_toy',   // pointOnMap tracks objPos while it rolls
        via: { map: 'mahopac_obs', x: 4, y: 2 } },
      { id: 'dream_party', when: ['story.dream_toy'], done: ['story.dream_party'],
        text: 'Pop the balloons at your seventh birthday.', place: 'A bowling alley',
        target: { map: 'dream_party', x: 5, y: 5 },
        via: { map: 'mahopac_obs', x: 4, y: 2 } },
      { id: 'dream_dad', when: ['story.dream_party'], done: ['story.dream_dad'],
        text: 'Sit with Dad at the MacRonalds drive-through.', place: 'A dream drive-through',
        target: { map: 'dream_drive', x: 2, y: 3 },
        via: { map: 'mahopac_obs', x: 4, y: 2 } },
      { id: 'dream_wake', when: ['story.dream_dad'], done: ['story.dream_woke'],
        text: 'You are home. Your Walkling is chirping, and Mom is here.', place: 'Your home, upstairs',
        target: { map: 'hm_home_up', x: 4, y: 5 } },
      { id: 'dream_study', when: ['story.dream_woke'], done: ['story.dream_study'],
        text: 'Tell Warden Ilse about the dream. Mom calls her Professor.', place: "Warden's Lodge",
        target: { map: 'hm_lodge_in', x: 5, y: 3 } },
    ],
    // Rook's Crossroads. Off the main chain. Accepting is talking to Rook at the Brinewick road sign.
    // The chain id the phone shows is the first entry's id (rc_meet). The label is "The last crates".
    [
      { id: 'rc_meet', label: 'The last crates', when: ['story.cobble_end'], givers: ['rook_road', 'rook_gate', 'rook_after'], done: ['story.rc_start'],
        text: 'Rook is sitting by the Brinewick road sign. He wants a word.', place: 'Cobblecrest, east road',
        glimmer: { text: 'Rook is by the Brinewick road sign. His mint lanyard is still on.', place: 'Cobblecrest, east road' },
        target: { map: 'cobblecrest', x: 28, y: 7 } },
      { id: 'rc_crates', when: ['story.rc_start'], done: ['story.rc_c1', 'story.rc_c2', 'story.rc_c3'],
        text: 'Three Pebblit crates wait in the quarry yard. Open them gently.', place: 'Quarry yard',
        glimmer: { text: 'Three crates in the quarry yard need a BRINEWICK stamp.', place: 'Quarry yard' },
        target: { map: 'cobble_quarry', x: 24, y: 7 } },
      { id: 'rc_gate', when: ['story.rc_start'], done: ['story.rc_climax'],
        text: 'Rook is at the quarry gate, stalling Tobin. Bring the Pebblits home.', place: 'Quarry gate',
        glimmer: { text: 'Tobin is at the quarry gate for the count. Rook is there too.', place: 'Quarry gate' },
        target: { map: 'cobble_quarry', x: 15, y: 2 } },
      { id: 'rc_wrap_hale', when: ['story.rc_climax', '!story.rc_end=shipped'], done: ['story.rc_done'],
        text: 'Tell Master Hale the Old Seam is purring again.', place: "Hale's Hall",
        target: { map: 'cc_hall_in', x: 5, y: 2 } },
      { id: 'rc_wrap_juniper', when: ['story.rc_climax', 'story.rc_end=shipped'], done: ['story.rc_done'],
        text: "Juniper is on the quarry's south path. Hand in the count.", place: 'Quarry, south path',
        target: { map: 'cobble_quarry', x: 14, y: 17 } },
    ],
    // The leak in 5B (D177, D182). Standing moves only through the moral step, not these rows.
    [
      { id: 'leak_ask', label: 'The leak in 5B', when: ['story.leak5b_seen'], givers: ['school_lizzy', 'f5_lizzy', 'diner_lizzy', 'court_lizzy'], done: ['story.leak5b_yes'],
        text: 'Find Lizzy. Weekdays 8 to 3 she teaches at the Schoolhouse. Other times, try home in 5B.', place: 'Amberhill Flats, 5B',
        target: { map: 'hm_flats_5', x: 13, y: 3 }, atSchool: { place: 'Hearthmoor Schoolhouse' } },
      { id: 'leak_gristle', when: ['story.leak5b_yes'], done: ['story.moral_leak5b'],
        text: 'Talk to Mr. Gristle', place: 'Amberhill Flats, Lobby',
        target: { map: 'hm_flats_lobby', x: 7, y: 9 } },
      { id: 'leak_file', when: ['story.moral_leak5b=court'], done: ['story.leak5b_filed'],
        text: 'File a claim with Clerk Wynn', place: 'Keeper House',
        target: { map: 'hm_hq_f1', x: 3, y: 10 } },
      { id: 'leak_serve', when: ['story.leak5b_filed'], done: ['story.leak5b_served'],
        text: 'Ask Constable Rue to serve it', place: 'Fernbrook, west edge',
        target: { map: 'fernbrook', x: 4, y: 9 } },
      { id: 'leak_done', when: ['story.moral_leak5b'], done: ['story.leak_fixed'],
        text: 'Check the bathroom in 5B', place: 'Amberhill Flats, 5B',
        target: { map: 'hm_flats_5', x: 11, y: 4 } },
    ],
    // Hearthmoor Plaza (D798). Off the main chain. Vale asks; a decline leaves the step open.
    [
      { id: 'plaza_ask', label: 'West watch', when: ['story.starter_received'], givers: ['hmp_watch'], done: ['story.plaza_yes'],
        text: 'Officer Vale wants a lap of the plaza.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 21, y: 7 } },
      { id: 'plaza_pryce', when: ['story.plaza_yes'], done: ['story.plaza_pryce'],
        text: 'Ask Keeper Pryce about the plaza lamps.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 21, y: 11 } },
      { id: 'plaza_lisse', when: ['story.plaza_pryce'], done: ['story.plaza_lisse'],
        text: 'Cadet Lisse is polishing the statue plaque.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 12, y: 13 } },
      { id: 'plaza_tansy', when: ['story.plaza_lisse'], done: ['story.plaza_tansy'],
        text: 'Tansy Holt is drawing in the plaza chalk.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 18, y: 12 } },
      { id: 'plaza_back', when: ['story.plaza_tansy'], done: ['story.plaza_done'],
        text: 'Tell Officer Vale the plaza lap is done.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 21, y: 7 } },
    ],
    [
      { id: 'plaza_sign_ask', label: 'Plaza sign', when: ['story.plaza_done'], givers: ['hmp_watch'], done: ['story.plaza_sign_yes'],
        text: 'Officer Vale wants the plaza sign read.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 21, y: 7 } },
      { id: 'plaza_sign_look', when: ['story.plaza_sign_yes'], done: ['story.plaza_sign'],
        text: 'Read the sign by the plaza gate.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 24, y: 7 } },
      { id: 'plaza_sign_tell', when: ['story.plaza_sign'], done: ['story.plaza_sign_done'],
        text: 'Tell Officer Vale what the sign says.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 21, y: 7 } },
    ],
    [
      { id: 'lantern_ask', label: 'Lantern night', when: ['story.cobble_end', 'story.plaza_sign_done'], givers: ['hmp_watch'], done: ['story.lantern_yes'],
        text: 'Officer Vale is holding lantern night.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 21, y: 7 } },
      { id: 'lantern_pryce', when: ['story.lantern_yes'], done: ['story.lantern_pryce'],
        text: 'Keeper Pryce is lighting the plaza lamps.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 21, y: 11 } },
      { id: 'lantern_tansy', when: ['story.lantern_pryce'], done: ['story.lantern_done'],
        text: 'Tansy Holt is drawing the lit square.', place: 'Hearthmoor Plaza',
        target: { map: 'hm_plaza', x: 18, y: 12 } },
    ],
    // Five that answer (ARBITER_UNITS Build C, D843, D848-D853). Opens on Route 3. Rows whose target differs by side come in pairs
    // with opposite when; the four lairs can be cleared in any order, so they share one row with four done flags.
    [
      { id: 'ans_open_k', label: 'Five that answer', when: ['story.reached_route3', '!story.side=glimmer'], givers: ['hq_mo', 'cc_quinn'], done: ['story.ans_open'],
        text: 'Archivist Mo has heard the hum on the Brinewick road. Go and listen.', place: 'Keeper House',
        target: { map: 'hm_hq_f1', x: 3, y: 5 } },
      { id: 'ans_open_g', when: ['story.reached_route3', 'story.side=glimmer'], done: ['story.ans_open'],
        text: 'Associate Quinn has a recall job on the Brinewick road. Go and listen.', place: 'Cobblecrest Trial Hall',
        target: { map: 'cc_hall_in', x: 8, y: 3 } },
      { id: 'ans_four', when: ['story.ans_open'], done: ['story.ans_tallybat', 'story.ans_dimlamp', 'story.ans_filecrow', 'story.ans_cordhound'],
        text: 'Four clues lead to four lairs on the Brinewick road. Find the ones that answer the hum.', place: 'Route 3',
        target: { map: 'route3', x: 11, y: 10 } },
      { id: 'ans_last_clue_k', when: ['story.ans_tallybat', 'story.ans_dimlamp', 'story.ans_filecrow', 'story.ans_cordhound', '!story.side=glimmer'], done: ['story.ans_humwisp_clue'],
        text: 'The four are quiet. Ask the old mast in Mahopac where the hum comes from.', place: 'Mahopac',
        target: { map: 'mahopac', x: 9, y: 5 } },
      { id: 'ans_last_clue_g', when: ['story.ans_tallybat', 'story.ans_dimlamp', 'story.ans_filecrow', 'story.ans_cordhound', 'story.side=glimmer'], done: ['story.ans_humwisp_clue'],
        text: 'The four are quiet. The cradle in the Arbiter Bay knows where the fifth went.', place: 'Arbiter Bay',
        target: { map: 'rx_f4', x: 6, y: 3 } },
      { id: 'ans_last', when: ['story.ans_humwisp_clue'], done: ['story.ans_humwisp'],
        text: 'The fifth waits in the relay house at the end of the Brinewick road.', place: 'Route 3, the relay',
        target: { map: 'r3_relay', x: 6, y: 4 } },
      { id: 'ans_close_k', when: ['story.ans_humwisp', '!story.side=glimmer'], done: ['story.ans_all'],
        text: 'Tell Archivist Mo all five are found.', place: 'Keeper House',
        target: { map: 'hm_hq_f1', x: 3, y: 5 } },
      { id: 'ans_close_g', when: ['story.ans_humwisp', 'story.side=glimmer'], done: ['story.ans_all'],
        text: 'Tell Associate Quinn all five relays are home.', place: 'Cobblecrest Trial Hall',
        target: { map: 'cc_hall_in', x: 8, y: 3 } },
    ],
  ];
  const SIDE = SIDE_CHAINS.flat();

  // Town-board slips (D40). Not SIDE_CHAINS: a pin must not hide Mom. At most three. The map draws the latest.
  // The posting sets story.board_<id>_pinned only. The NPC's yes is the only accept.
  const BOARD = [
    [
      { id: 'gate', label: 'Gate count', when: ['story.board_gate_pinned'], done: ['story.board_gate_yes'],
        text: 'Officer Cald wants a word about the east sign.', place: 'Hearthmoor',
        target: { map: 'hearthmoor', x: 17, y: 7 } },
      { id: 'gate_look', when: ['story.board_gate_yes'], done: ['story.board_gate_sign'],
        text: 'Look at the east sign. See if it is still standing.', place: 'Hearthmoor, east sign',
        target: { map: 'hearthmoor', x: 19, y: 10 } },
      { id: 'gate_tell', when: ['story.board_gate_sign'], done: ['story.board_gate_done'],
        text: 'Tell Officer Cald the east sign is still standing.', place: 'Hearthmoor',
        target: { map: 'hearthmoor', x: 17, y: 7 } },
    ],
  ];

  function evalCond(c, st){
    if (c === 'else') return true;
    let neg = false; if (c[0] === '!') { neg = true; c = c.slice(1); }
    let v;
    const ge = c.match(/^pets>=(\d+)$/);
    if (ge) v = (st.pets | 0) >= +ge[1];
    else if (c.startsWith('seal:')) v = !!(st.seals && st.seals[c.slice(5)]);
    else { const k = c.indexOf('='), F = st.flags || {}; v = k >= 0 ? String(F[c.slice(0, k)]) === c.slice(k + 1) : !!F[c]; }
    return neg ? !v : v;
  }
  const all = (cs, st) => (cs || []).every(c => evalCond(c, st));
  const ownDone = (e, st) => (e.done.length > 0 && all(e.done, st)) || (e.skipIf && all(e.skipIf, st));
  const eligible = (e, st) => all(e.when, st);
  // Progress implies the steps before it: a step counts as done when its own flags hold or any later step's do. Saves made
  // before a flag existed (story.reached_route1 is newer than Route 2) would otherwise pin the chain on a stale step.
  function doneMask(st){
    const m = CHAIN.map(e => ownDone(e, st));
    // A `noImply` step (Heights) is never marked done by a later step, and it does not block that
    // later progress from counting the steps before it. Finishing the orchard still finishes Fernbrook's intro.
    let later = false;
    for (let i = m.length - 1; i >= 0; i--) {
      if (!CHAIN[i].noImply && later) m[i] = true;
      if (m[i]) later = true;
    }
    return m;
  }
  // QUEST_MULTI (D106): every active side chain, in unlock order (SIDE_CHAINS index). Each chain keeps its own done mask
  // (later implies earlier only inside the chain); a locked or finished chain is left out. `chains` is for tests only.
  const LABEL_MAX = 30;
  function sideActive(st, chains){
    const out = [];
    for (const chain of (chains || SIDE_CHAINS)) {
      const m = chain.map(e => ownDone(e, st));
      for (let i = m.length - 2; i >= 0; i--) m[i] = m[i] || m[i + 1];
      for (let i = 0; i < chain.length; i++) if (!m[i] && eligible(chain[i], st)) { out.push({ chain: chain[0].id, label: chain[0].label || chain[0].id, step: resolve(chain[i], st) }); break; }
    }
    return out;
  }
  function sideCurrent(st){ const a = sideActive(st); return a.length ? a[0].step : null; }
  // One current step per pinned slip, in catalog order. The last entry is the latest pin.
  function boardActive(st){
    const out = [];
    for (const chain of BOARD) {
      const m = chain.map(e => ownDone(e, st));
      for (let i = m.length - 2; i >= 0; i--) m[i] = m[i] || m[i + 1];
      for (let i = 0; i < chain.length; i++) if (!m[i] && eligible(chain[i], st)) { out.push({ chain: chain[0].id, label: chain[0].label || chain[0].id, step: resolve(chain[i], st) }); break; }
    }
    return out;
  }

  // The current objective, or null when nothing applies (never happens with the chain above: `end` has no done).
  function current(st){
    const m = doneMask(st);
    for (let i = 0; i < CHAIN.length; i++) if (!m[i] && eligible(CHAIN[i], st)) return resolve(CHAIN[i], st);
    return null;
  }
  // Completed steps before the current one, most recent first (for the panel's dimmed list). Steps that were skipped
  // (not eligible) or only implied by later progress still count: the player is past them.
  function completed(st, n){
    const cur = current(st), m = doneMask(st), out = [];
    for (let i = 0; i < CHAIN.length; i++) { const e = CHAIN[i]; if (cur && e.id === cur.id) break; if (m[i] && eligible(e, st)) out.push(resolve(e, st)); }
    return out.reverse().slice(0, n == null ? out.length : n);
  }
  const byId = id => CHAIN.find(e => e.id === id) || null;
  // The entry as the player should read it: the glimmer text/place while story.side is 'glimmer' (ids, when, done, target kept).
  const sideOf = st => (st && st.flags && st.flags['story.side'] === 'glimmer') ? 'glimmer' : 'keepers';
  const resolve = (e, st) => (e && e.glimmer && sideOf(st) === 'glimmer') ? Object.assign({}, e, { text: e.glimmer.text, place: e.glimmer.place, variant: 'glimmer' }) : e;

  // Dev check (NEXT_PLAN WP-C task 8): every story.* flag written by the design data (scene setFlag steps, warp/door
  // setFlag fields) is a `done` condition of some entry or on NOT_STEPS, so new content cannot silently fall off the chain.
  // Also: text fits lineMax, no tokens, ids unique, done flags reachable. Returns a list of problems (empty = pass).
  function devCheck(MD){
    const bad = [], written = new Set();
    const scanSteps = node => {                                   // deep walk: if/choice branches are nested arrays too
      if (!Array.isArray(node)) return;
      if (node[0] === 'setFlag' && typeof node[1] === 'string') written.add(node[1]);
      for (const x of node) scanSteps(x);
    };
    const scanScenes = sc => { for (const steps of Object.values(sc || {})) scanSteps(steps); };
    const scanMaps = maps => { for (const m of Object.values(maps || {})) for (const o of (m && m.objs) || []) if (typeof o.setFlag === 'string') written.add(o.setFlag); };
    const scanPatch = p => { if (!p) return; scanScenes(p.scenes); for (const pt of Object.values(p.maps || {})) for (const o of [].concat(pt.addObjs || [], pt.replaceObjs || [])) if (typeof o.setFlag === 'string') written.add(o.setFlag); };
    for (const src of Object.values(MD || {})) { if (!src) continue; scanScenes(src.scenes); scanMaps(src.maps); scanMaps(src.rooms); scanPatch(src.slicePatch); scanPatch(src.route2Patch); }
    const doneFlags = new Set();
    const boardFlat = BOARD.flat();
    for (const e of CHAIN.concat(SIDE, boardFlat)) for (const c of e.done) doneFlags.add(c.replace(/^!/, '').split('=')[0]);
    for (const f of written) if (f.startsWith('story.') && !doneFlags.has(f) && !NOT_STEPS.includes(f)) bad.push('flag not on the chain: ' + f);
    const ids = new Set();
    const copyOk = (e, tag) => {
      if (typeof e.text !== 'string' || typeof e.place !== 'string') { bad.push('missing text/place: ' + tag); return; }
      if (Array.from(e.text).length > LINE_MAX) bad.push('text over ' + LINE_MAX + ': ' + tag);
      if (Array.from(e.place).length > PLACE_MAX) bad.push('place over ' + PLACE_MAX + ': ' + tag);
      if (/\{|\}|  /.test(e.text) || /\{|\}|  /.test(e.place)) bad.push('token or double space: ' + tag);
    };
    for (const e of CHAIN) {
      if (ids.has(e.id)) bad.push('duplicate id: ' + e.id); ids.add(e.id);
      copyOk(e, e.id); if (e.glimmer) copyOk(e.glimmer, e.id + '@glimmer');
      if (e.target && !(typeof e.target.map === 'string' && Number.isInteger(e.target.x) && Number.isInteger(e.target.y))) bad.push('bad target: ' + e.id);
    }
    if (CHAIN[CHAIN.length - 1].done.length) bad.push('the last entry must never be done');
    for (const chain of SIDE_CHAINS) { const l = chain[0].label; if (typeof l !== 'string' || !l || Array.from(l).length > LABEL_MAX) bad.push('chain label missing or over ' + LABEL_MAX + ': ' + chain[0].id); }
    const sideIds = new Set();
    for (const e of SIDE) {
      if (sideIds.has(e.id) || ids.has(e.id)) bad.push('duplicate id: ' + e.id); sideIds.add(e.id);
      copyOk(e, 'side ' + e.id);
      if (e.glimmer) copyOk(e.glimmer, 'side ' + e.id + '@glimmer');
      if (e.target && !(typeof e.target.map === 'string' && Number.isInteger(e.target.x) && Number.isInteger(e.target.y))) bad.push('bad target: ' + e.id);
    }
    for (const chain of BOARD) { const l = chain[0].label; if (typeof l !== 'string' || !l || Array.from(l).length > LABEL_MAX) bad.push('board label missing or over ' + LABEL_MAX + ': ' + chain[0].id); }
    for (const e of boardFlat) {
      if (sideIds.has(e.id) || ids.has(e.id)) bad.push('duplicate id: ' + e.id); sideIds.add(e.id);
      copyOk(e, 'board ' + e.id);
      if (e.glimmer) copyOk(e.glimmer, 'board ' + e.id + '@glimmer');
      if (e.target && !(typeof e.target.map === 'string' && Number.isInteger(e.target.x) && Number.isInteger(e.target.y))) bad.push('bad target: ' + e.id);
    }
    return bad;
  }

  const api = { SIDE_TASKS, sideTaskLine, CHAIN, SIDE, BOARD, NOT_STEPS, LINE_MAX, PLACE_MAX, STUCK, evalCond, current, sideCurrent, sideActive, boardActive, SIDE_CHAINS, LABEL_MAX, completed, byId, resolve, devCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PPQuests = api;
})(typeof window !== 'undefined' ? window : globalThis);
