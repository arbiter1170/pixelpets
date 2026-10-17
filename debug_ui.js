/* Debug panel markup. Not part of the player page: game.js inserts it into the DOM only while debug is on
   (?debug=1 for this tab session, or the Settings → Debug gate), and removes it when debug is turned off. */
window.PP_DEBUG_HTML = `
<div id="ovDebug" class="overlay" hidden>
  <div class="ov-inner dbg-inner" role="dialog" aria-modal="true" aria-labelledby="dbgTitle">
    <div class="ov-title" id="dbgTitle">Debug</div>
    <p id="dbgLive" class="dbg-live" hidden></p>
    <section class="dbg-sec" id="dbgMusic">
      <div class="dbg-h">Music</div>
      <select id="dbgMusicId" aria-label="Music loop"></select>
      <div class="dbg-row">
        <button id="dbgMusicPlay" class="btn sm" type="button">PLAY</button>
        <button id="dbgMusicBack" class="btn sm" type="button">BACK</button>
      </div>
    </section>
    <div id="dbgBattleHp" hidden>
      <div class="dbg-row">
        <input id="dbgFoeHp" type="number" min="0" inputmode="numeric" aria-label="Foe HP">
        <button id="dbgSetFoeHp" class="btn sm" type="button">FOE HP</button>
      </div>
      <div class="dbg-row">
        <input id="dbgMyHp" type="number" min="0" inputmode="numeric" aria-label="Your HP">
        <button id="dbgSetMyHp" class="btn sm" type="button">YOUR HP</button>
      </div>
      <div class="dbg-row">
        <button id="dbgWin" class="btn sm" type="button">WIN</button>
        <button id="dbgLose" class="btn sm" type="button">LOSE</button>
      </div>
    </div>
    <section class="dbg-sec">
      <div class="dbg-h">Checkpoint</div>
      <select id="dbgCheckpoint" aria-label="Checkpoint"></select>
      <button id="dbgGoCheckpoint" class="btn sm" type="button">GO</button>
    </section>
    <section class="dbg-sec">
      <div class="dbg-h">Items</div>
      <select id="dbgItem" aria-label="Item"></select>
      <div class="dbg-row">
        <input id="dbgItemN" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="How many">
        <button id="dbgGiveItem" class="btn sm" type="button">GIVE</button>
      </div>
      <div class="dbg-row">
        <input id="dbgAcorns" type="number" min="0" value="0" inputmode="numeric" aria-label="Acorns">
        <button id="dbgSetAcorns" class="btn sm" type="button">ACORNS</button>
      </div>
    </section>
    <section class="dbg-sec">
      <div class="dbg-h">Walkling encounter</div>
      <select id="dbgSpecies" aria-label="Species"></select>
      <div class="dbg-row">
        <select id="dbgStage" aria-label="Form"></select>
        <input id="dbgLevel" type="number" min="1" max="50" value="5" inputmode="numeric" aria-label="Level">
      </div>
      <select id="dbgHp" aria-label="Starting HP"></select>
      <p id="dbgEncStats" class="dbg-live"></p>
      <div class="dbg-row">
        <button id="dbgSpawnEnc" class="btn sm btn-play" type="button">START BATTLE</button>
        <button id="dbgPlaceWild" class="btn sm" type="button">PLACE ON MAP</button>
      </div>
    </section>
    <section class="dbg-sec">
      <div class="dbg-h">Faction</div>
      <div class="dbg-row">
        <button id="dbgSideKeepers" class="btn sm" type="button" aria-pressed="true">KEEPERS</button>
        <button id="dbgSideGlimmer" class="btn sm" type="button" aria-pressed="false">GLIMMERWELL</button>
      </div>
    </section>
    <section class="dbg-sec">
      <div class="dbg-h">Standing</div>
      <p id="dbgKeepersNow" class="dbg-live"></p>
      <div class="dbg-row">
        <input id="dbgKeepersPts" type="number" min="0" max="100" inputmode="numeric" aria-label="Keepers standing">
        <button id="dbgSetKeepers" class="btn sm" type="button">KEEPERS</button>
      </div>
      <p id="dbgGlimmerNow" class="dbg-live"></p>
      <div class="dbg-row">
        <input id="dbgGlimmerPts" type="number" min="0" max="100" inputmode="numeric" aria-label="Glimmerwell standing">
        <button id="dbgSetGlimmer" class="btn sm" type="button">GLIMMER</button>
      </div>
    </section>
    <details class="dbg-sec" id="dbgAgent">
      <summary class="dbg-h">Agent tools</summary>
      <div class="dbg-grid">
        <button id="dbgHeal" class="btn sm" type="button">HEAL</button>
        <button id="dbgFillCare" class="btn sm" type="button">FILL CARE</button>
        <button id="dbgFast" class="btn sm" type="button" aria-pressed="false">FAST OFF</button>
        <button id="dbgClearHold" class="btn sm" type="button">CLEAR HOLD</button>
        <button id="dbgKit" class="btn sm" type="button">PREP KIT</button>
        <button id="dbgResetCaps" class="btn sm" type="button">RESET CAPS</button>
        <button id="dbgSight" class="btn sm" type="button">SIGHT LINES</button>
        <button id="dbgEndScene" class="btn sm" type="button">END SCENE</button>
      </div>
      <div class="dbg-row">
        <input id="dbgPetLevel" type="number" min="1" max="50" value="5" inputmode="numeric" aria-label="Partner level">
        <button id="dbgSetLevel" class="btn sm" type="button">SET LEVEL</button>
      </div>
      <div class="dbg-row">
        <input id="dbgHours" type="number" min="0" max="240" value="8" inputmode="numeric" aria-label="Hours to skip">
        <button id="dbgSkip" class="btn sm" type="button">SKIP HOURS</button>
      </div>
      <select id="dbgTextSpeed" aria-label="Text speed"></select>
      <select id="dbgMap" aria-label="Map"></select>
      <button id="dbgWarp" class="btn sm" type="button">WARP</button>
      <div class="dbg-row">
        <input id="dbgScene" type="text" maxlength="40" autocomplete="off" spellcheck="false" aria-label="Scene id" value="orchard">
        <button id="dbgRunScene" class="btn sm" type="button">RUN SCENE</button>
      </div>
      <div class="dbg-row">
        <input id="dbgFlag" type="text" maxlength="60" autocomplete="off" spellcheck="false" aria-label="Flag name">
        <input id="dbgFlagVal" type="text" maxlength="40" autocomplete="off" spellcheck="false" aria-label="Flag value">
      </div>
      <div class="dbg-row">
        <button id="dbgSetFlag" class="btn sm" type="button">SET FLAG</button>
        <button id="dbgClearFlag" class="btn sm" type="button">CLEAR FLAG</button>
      </div>
      <select id="dbgTrainer" aria-label="Trainer"></select>
      <label class="dbg-check"><input id="dbgRematch" type="checkbox" checked> Rematch if already beaten</label>
      <button id="dbgForceTrainer" class="btn sm" type="button">TRAINER BATTLE</button>
      <div class="dbg-row">
        <select id="dbgBooth" aria-label="Event Hall game"></select>
        <button id="dbgBoothGo" class="btn sm" type="button">PLAY BOOTH</button>
      </div>
      <div class="dbg-row">
        <button id="dbgChecks" class="btn sm" type="button">DEV CHECKS</button>
        <button id="dbgSnap" class="btn sm" type="button">SNAPSHOT</button>
      </div>
    </details>
    <p id="dbgOut" class="dbg-out" hidden></p>
    <button id="dbgLock" class="btn sm btn-danger" type="button">LOCK DEBUG</button>
    <button id="dbgClose" class="btn btn-play" type="button">CLOSE</button>
  </div>
</div>
`;
