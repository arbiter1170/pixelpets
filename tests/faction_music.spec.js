/* Glimmerwell battle music for a Keeper, wild combat loops, and loyalty-keyed faction lines. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.setStanding === 'function');
}

test('wild loops cycle, and a Keeper hears Glimmerwell as the dark theme', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const music = await page.evaluate(() => ({
    check: PixelPets.musicCheck(),
    ids: PixelPets.musicIds(),
    rolled: [PixelPets.rollWildTrack(), PixelPets.rollWildTrack(), PixelPets.rollWildTrack(), PixelPets.rollWildTrack()],
    tracks: PixelPets.wildTracks(),
  }));
  expect(music.check).toEqual([]);
  for (const id of ['wild_skip', 'wild_romp', 'wild_spark', 'glimmer_first', 'glimmer_battle']) {
    expect(music.ids).toContain(id);
  }
  expect(music.rolled).toEqual(['wild_skip', 'wild_romp', 'wild_spark', 'wild_skip']);
  expect(music.tracks).toEqual(['wild_skip', 'wild_romp', 'wild_spark']);

  const battles = await page.evaluate(() => {
    const first = PixelPets.battleTrack('trainer', 'fern_associate');
    const keeperTrial = PixelPets.battleTrack('trainer', 'hall1_fen');
    PixelPets.setFlag('music.glimmer_fought', true);
    const later = PixelPets.battleTrack('trainer', 'fern_associate');
    const lead = PixelPets.battleTrack('trainer', 'r2_lead');
    PixelPets.setSide('glimmer');
    const asCompany = PixelPets.battleTrack('trainer', 'fern_associate');
    const rook = PixelPets.battleTrack('trainer', 'rival2_rook');
    return { first, keeperTrial, later, lead, asCompany, rook };
  });
  expect(battles.first).toBe('glimmer_first');
  expect(battles.later).toBe('glimmer_battle');
  expect(battles.lead).toBe('glimmer_battle');
  expect(battles.keeperTrial).toBe('battle');
  expect(battles.asCompany).toBe('battle');
  expect(battles.rook).toBe('battle');
});

test('keeper and Glimmerwell lines follow pledge and standing', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const lines = await page.evaluate(() => {
    const T = PixelPets.standingCfg().thresholds;
    const out = {};
    out.juniperStranger = PixelPets.npcLine('juniper');
    PixelPets.setStanding('keepers', T[1]);
    out.juniperFriend = PixelPets.npcLine('juniper');
    PixelPets.setStanding('keepers', T[3]);
    out.juniperHall = PixelPets.npcLine('juniper');
    PixelPets.setStanding('glimmer', T[2]);
    out.juniperBoth = PixelPets.npcLine('juniper');
    out.amosTrusted = PixelPets.npcLine('amos');
    out.fenTrusted = PixelPets.npcLine('fen_after');
    out.tobinKeeper = PixelPets.trainerLine('fern_associate', 'intro');
    PixelPets.setSide('glimmer');
    PixelPets.setStanding('keepers', T[0]);
    PixelPets.setStanding('glimmer', T[4]);
    out.juniperPick = PixelPets.npcLine('juniper');
    out.tobinLead = PixelPets.trainerLine('fern_associate', 'intro');
    out.fenMint = PixelPets.npcLine('fen_after');
    out.haleMint = PixelPets.trainerLine('hall2_hale', 'intro');
    out.amosMint = PixelPets.npcLine('amos');
    PixelPets.setSide('keepers');
    PixelPets.setStanding('keepers', T[4]);
    out.fenAlly = PixelPets.trainerLine('hall1_fen', 'intro');
    out.haleAlly = PixelPets.trainerLine('hall2_hale', 'win');
    out.odile = PixelPets.npcLine('odile');
    return out;
  });
  expect(lines.juniperStranger).toBe('Free lantern? Offer never expires!');
  expect(lines.juniperFriend).toBe('A Keeper friend. Brochure, anyway?');
  expect(lines.juniperHall).toBe('The Halls like you. We can still talk.');
  expect(lines.juniperBoth).toBe("Hall Friend, and our file's still open.");
  expect(lines.amosTrusted).toBe('Trusted. Rest. Roots need sleep.');
  expect(lines.fenTrusted).toBe('Trusted hands. The trees agree.');
  expect(lines.tobinKeeper).toBe('Oh! A Hall Friend. The crates are still a partnership, {player}.');
  expect(lines.juniperPick).toBe("Founder's Pick! Marlowe asked after you.");
  expect(lines.tobinLead).toBe('Bright Lead! A spar keeps the quarterly glow healthy. Ready, {player}?');
  expect(lines.fenMint).toBe('Mint vest. Roots remember your step.');
  expect(lines.haleMint).toBe('Mint coat, {player}. Stone stands firm all the same.');
  expect(lines.amosMint).toBe('Bright day, then rest. Beds are beds.');
  expect(lines.fenAlly).toBe("Warden's Ally. Roots first, then blossoms. Show me, {name}.");
  expect(lines.haleAlly).toBe("Ha! You moved the hill, {player}. Gently, like a Warden's Ally.");
  expect(lines.odile).toBe("Warden's Ally. The windfalls are yours.");
  const house = await page.evaluate(() => {
    const T = PixelPets.standingCfg().thresholds;
    PixelPets.setFlag('story.side', null);
    PixelPets.setStanding('keepers', 0);
    const citizen = PixelPets.loyaltyLine('hq_bram');
    PixelPets.setFlag('story.side', 'keepers');
    PixelPets.setStanding('keepers', T[1]);
    const pledged = PixelPets.loyaltyLine('hq_bram');
    PixelPets.setStanding('keepers', T[4]);
    const ally = PixelPets.loyaltyLine('hq_lumen');
    const watch = PixelPets.loyaltyLine('hm_patrol');
    PixelPets.setSide('glimmer');
    const cold = PixelPets.loyaltyLine('hq_bram');
    const ness = PixelPets.loyaltyLine('hm_ness');
    return { citizen, pledged, ally, watch, cold, ness };
  });
  expect(house.citizen).toBeNull();
  expect(house.pledged).toBe('Pledged. Sign the night book, friend.');
  expect(house.ally).toBe("Warden's Ally. I'd trust you a route.");
  expect(house.watch).toBe("Warden's Ally. The road is yours.");
  expect(house.cold).toBe('Glimmerwell. You are not welcome here.');
  expect(house.ness).toBe('Company colours. State your business.');
  await page.evaluate(() => { PixelPets.setSide('keepers'); PixelPets.setStanding('keepers', PixelPets.standingCfg().thresholds[4]); PixelPets.showTab('walk'); });
  await page.evaluate(() => PixelPets.runScene('ilse_chat'));
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.full && s.text && s.text.indexOf("Warden's Ally") >= 0;
  });
  await playScene(page, ['Just saying hi']);
  expect(await page.evaluate(() => PixelPets.scene)).toBeNull();
});
