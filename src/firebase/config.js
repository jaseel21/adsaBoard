import firebase from 'firebase'; // Import only the base Firebase module
import 'firebase/auth'; // Import Firebase authentication module
import 'firebase/firestore'; // Import Firebase Firestore module

const firebaseConfig = {
  apiKey: "AIzaSyBglBEqEB_tBLV2Vh9Y6NwJJ7gMIhNlvks",
  authDomain: "adsatboard.firebaseapp.com",
  projectId: "adsatboard",
  storageBucket: "adsatboard.appspot.com",
  messagingSenderId: "865352053662",
  appId: "1:865352053662:web:246b95524f3037b1e39c8f"
};

// Initialize Firebase app once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Enable offline persistence (gracefully handle environments where it's not supported)
try {
  if (typeof window !== 'undefined' && firebase.firestore) {
    firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch(() => {
      // Ignore persistence errors (e.g., multiple tabs without sync, private mode)
    });
  }
} catch (_) {}

// Export the firebase namespace so callers can use firebase.firestore()
export default firebase;


