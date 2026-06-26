import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  deleteUser,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../config/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const firebaseReady = isFirebaseConfigured() && auth;

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    // Force session persistence so user must log in when opening a new tab/link
    setPersistence(auth, browserSessionPersistence)
      .then(() => {
        // Check for redirect result (mobile Google sign-in fallback)
        return getRedirectResult(auth);
      })
      .then((result) => {
        if (result?.user) {
          // User signed in via redirect, onAuthStateChanged will handle the state
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/popup-closed-by-user') {
          console.warn('Redirect sign-in check:', err.message);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData?.[0]?.providerId || 'unknown',
        });
        setLoading(false);
      } else {
        if (sessionStorage.getItem('autoLoginGuest') === 'true') {
          sessionStorage.removeItem('autoLoginGuest');
          setUser({ uid: 'local', displayName: 'Guest', email: 'guest@local', photoURL: null, provider: 'local' });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  const signInWithGoogle = async () => {
    if (!firebaseReady) {
      setError('Firebase is not configured. Please update src/config/firebase.js');
      return;
    }
    try {
      setError(null);
      // Try popup first (works on desktop and most browsers)
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      // If popup is blocked or fails, fall back to redirect (better for mobile)
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          // Page will redirect, result handled in useEffect above
          return;
        } catch (redirectErr) {
          setError('Sign-in failed. Please try again.');
          throw redirectErr;
        }
      }

      // Handle specific error codes with friendly messages
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if (err.code === 'auth/internal-error') {
        setError('Authentication service error. Please try again later.');
      } else {
        setError(err.message);
      }
      throw err;
    }
  };

  const signInWithEmail = async (email, password) => {
    if (!firebaseReady) {
      setError('Firebase is not configured.');
      return;
    }
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      if (err.code === 'auth/user-not-found') setError('No account found with this email.');
      else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.');
      else if (err.code === 'auth/invalid-credential') setError('Invalid email or password. Please check and try again.');
      else if (err.code === 'auth/too-many-requests') setError('Too many failed attempts. Please wait a moment and try again.');
      else setError(err.message);
      throw err;
    }
  };

  const signUpWithEmail = async (email, password, name) => {
    if (!firebaseReady) {
      setError('Firebase is not configured.');
      return;
    }
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }
      setUser((prev) => prev ? { ...prev, displayName: name || prev.displayName } : prev);
      return result.user;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.');
      else setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      if (firebaseReady && auth) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.warn('Firebase sign out error:', err.message);
    }
    
    // Clear all local app data (except theme) so the next user starts fresh
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('manit_self_') && key !== 'manit_self_theme') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    setUser(null);
    window.location.reload(); // Force full reload to clear all React state
  };

  const deleteAccount = async () => {
    try {
      if (firebaseReady && auth && auth.currentUser) {
        const uid = auth.currentUser.uid;
        if (db) {
          try {
            await deleteDoc(doc(db, 'users', uid));
          } catch (e) {
            console.warn('Could not delete firestore data:', e);
          }
        }
        await deleteUser(auth.currentUser);
      }
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('For security reasons, please sign out and sign in again before deleting your account.');
        throw err;
      }
      console.warn('Firebase account deletion error:', err.message);
      throw err;
    }
    
    // Clear all local app data (except theme)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('manit_self_') && key !== 'manit_self_theme') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    setUser(null);
    window.location.reload();
  };

  const skipAuth = () => {
    if (localStorage.getItem('manit_self_is_setup') === 'true') {
      const wantFresh = window.confirm("Existing offline data found. Click 'OK' to continue with it, or 'Cancel' to start a fresh account.");
      if (!wantFresh) {
        // Clear all local app data (except theme) to start fresh
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('manit_self_') && key !== 'manit_self_theme') {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        sessionStorage.setItem('autoLoginGuest', 'true');
        window.location.reload();
        return;
      }
    }
    setUser({ uid: 'local', displayName: 'Guest', email: 'guest@local', photoURL: null, provider: 'local' });
    setLoading(false);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      firebaseReady,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      deleteAccount,
      skipAuth,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
