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
  apiKey: "AIzaSyDqz4eUMQ6h27Tu4kBeuLM480v-EU2fRFM",
  authDomain: "manit-attendance.firebaseapp.com",
  projectId: "manit-attendance",
  storageBucket: "manit-attendance.firebasestorage.app",
  messagingSenderId: "134455419392",
  appId: "1:134455419392:web:84d00f7f2f02c224972ee5"
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
