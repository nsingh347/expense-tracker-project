
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBl1hsLLH9vM4zAJ2bX4ONfmxDVSmVgIAQ",
  authDomain: "expense-tracker-b3ac9.firebaseapp.com",
  projectId: "expense-tracker-b3ac9",
  storageBucket: "expense-tracker-b3ac9.appspot.com",  // <-- fixed here
  messagingSenderId: "787455974976",
  appId: "1:787455974976:web:3f5014f31e0bc588c7c9a5",
  measurementId: "G-G7XNTR1WK3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously to enable Firestore access
signInAnonymously(auth)
  .then(() => {
    console.log("Signed in anonymously");
  })
  .catch((error) => {
    console.error("Error signing in anonymously:", error);
  });

export { db, auth };
