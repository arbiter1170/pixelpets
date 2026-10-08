/* Walklings online saves: the Firebase web config (design ONLINE_SAVES_SCOPE.md).
   null = the cloud path is OFF: no Firebase SDK is loaded, no network calls, no cloud UI; the game plays exactly as before.
   To turn it on, replace null with the web app config object from the Firebase console
   (Project settings > Your apps > Web app > SDK setup and configuration > Config), e.g.
     window.PP_CLOUD_CONFIG = { apiKey: "...", authDomain: "....firebaseapp.com", projectId: "...", appId: "..." };
   The web config is public by design; firestore.rules is what protects the saves. */
window.PP_CLOUD_CONFIG = null;
