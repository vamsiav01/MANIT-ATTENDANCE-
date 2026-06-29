// ============================================================
// Firebase Configuration
// ============================================================
// INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Enable Authentication > Google sign-in + Email/Password
// 4. Create a Firestore database
// 5. Replace the config below with your project's config
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzaBACEjYiqumnj3tj8owSpD4shoYAcAc",
  authDomain: "maint-self-attendance.firebaseapp.com",
  projectId: "maint-self-attendance",
  storageBucket: "maint-self-attendance.firebasestorage.app",
  messagingSenderId: "715444738612",
  appId: "1:715444738612:web:9ae0b20df65fb0e710c861",
  measurementId: "G-PR3NCS9RJG"
};

// Initialize Firebase — with graceful fallback
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (error) {
  console.warn('Firebase initialization failed. Running in offline mode.', error.message);
}

export { app, auth, db, googleProvider };

/**
 * Check if Firebase is properly configured (not using placeholder keys).
 */
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('DEMO_REPLACE');
}
