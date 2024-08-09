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

// Initialize Firebase app and export it directly
export default firebase.initializeApp(firebaseConfig);


