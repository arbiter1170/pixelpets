/* Walklings online saves: the Firebase web config (design ONLINE_SAVES_SCOPE.md).
   Phase 1 is ON for project walklings-4cc89 (Vincent, Oct 19, 2026).
   null would turn the cloud path OFF: no Firebase SDK, no network calls, no cloud UI.
   The web config is public by design; firestore.rules is what protects the saves.
   Automated tests never use this object: cloud.js ignores it when navigator.webdriver is set,
   unless the page is the local emulator (?cloud=emu) or a stubbed check (?cloud=block). */
window.PP_CLOUD_CONFIG = {
  apiKey: "AIzaSyCTgXizuG8_IZz79AW9tlhq-mFHV4HegFQ",
  authDomain: "walklings-4cc89.firebaseapp.com",
  projectId: "walklings-4cc89",
  storageBucket: "walklings-4cc89.firebasestorage.app",
  messagingSenderId: "489222021878",
  appId: "1:489222021878:web:9439e9f9e1efaa2d4802d7",
  databaseURL: "https://walklings-4cc89-default-rtdb.firebaseio.com"
};
