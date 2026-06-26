import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppLockContext = createContext();

const KEYS = {
  enabled: 'manit_lock_enabled',
  type: 'manit_lock_type',      // 'pin' | 'password' | 'pattern' | 'biometric' | 'voice'
  hash: 'manit_lock_hash',
  setup: 'manit_lock_setup',
};

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AppLockProvider({ children }) {
  const [isLockEnabled, setIsLockEnabled] = useState(
    () => localStorage.getItem(KEYS.enabled) === 'true'
  );
  const [lockType, setLockType] = useState(
    () => localStorage.getItem(KEYS.type) || 'pin'
  );
  const [hasSetup, setHasSetup] = useState(
    () => localStorage.getItem(KEYS.setup) === 'true'
  );
  const [isLocked, setIsLocked] = useState(
    () => localStorage.getItem(KEYS.enabled) === 'true' &&
          localStorage.getItem(KEYS.setup) === 'true'
  );
  const [showLockSettings, setShowLockSettings] = useState(false);

  // Lock the app (called on inactivity, manual lock, etc.)
  const lockApp = useCallback(() => {
    if (isLockEnabled && hasSetup) setIsLocked(true);
  }, [isLockEnabled, hasSetup]);

  // Setup a new lock credential
  const setupLock = useCallback(async (type, credential) => {
    const hash = await sha256(credential.toString());
    localStorage.setItem(KEYS.hash, hash);
    localStorage.setItem(KEYS.type, type);
    localStorage.setItem(KEYS.setup, 'true');
    localStorage.setItem(KEYS.enabled, 'true');
    setLockType(type);
    setHasSetup(true);
    setIsLockEnabled(true);
    setIsLocked(false);
  }, []);

  // Verify credential and unlock
  const unlock = useCallback(async (credential) => {
    const stored = localStorage.getItem(KEYS.hash);
    const hash = await sha256(credential.toString());
    if (hash === stored) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  // Unlock directly (for biometric/voice — browser already verified)
  const unlockDirect = useCallback(() => {
    setIsLocked(false);
  }, []);

  const enableLock = useCallback(() => {
    localStorage.setItem(KEYS.enabled, 'true');
    setIsLockEnabled(true);
    if (hasSetup) setIsLocked(true);
  }, [hasSetup]);

  const disableLock = useCallback(() => {
    localStorage.setItem(KEYS.enabled, 'false');
    setIsLockEnabled(false);
    setIsLocked(false);
  }, []);

  const resetLock = useCallback(() => {
    localStorage.removeItem(KEYS.hash);
    localStorage.removeItem(KEYS.type);
    localStorage.removeItem(KEYS.setup);
    localStorage.removeItem(KEYS.enabled);
    setIsLockEnabled(false);
    setIsLocked(false);
    setHasSetup(false);
    setLockType('pin');
  }, []);

  // Auto-lock on tab visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isLockEnabled && hasSetup) {
        setIsLocked(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isLockEnabled, hasSetup]);

  const value = {
    isLockEnabled,
    lockType,
    hasSetup,
    isLocked,
    showLockSettings,
    setShowLockSettings,
    setupLock,
    unlock,
    unlockDirect,
    enableLock,
    disableLock,
    resetLock,
    lockApp,
  };

  return (
    <AppLockContext.Provider value={value}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
}
