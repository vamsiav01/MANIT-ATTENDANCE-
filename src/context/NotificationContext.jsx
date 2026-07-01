import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  notifyWelcome,
  notifyLowAttendance,
  notifyCriticalAttendance,
  notifyUnmarkedClasses,
  scheduleDailyReminder,
  clearDailyReminder,
  scheduleSmartNotifications,
  clearSmartNotifications,
  subscribeToWebPush,
  subscribeToWebPushBackground,
} from '../utils/notifications';
import { useAttendance } from './AttendanceContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { subjects, schedule, history, showToast } = useAttendance();
  const { user } = useAuth();
  // Always reflect the REAL OS permission state
  const [permission, setPermission] = useState(() => getNotificationPermission());

  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem('manit_self_notif_banner_dismissed') === 'true'
  );
  const [isToggling, setIsToggling] = useState(false);

  // notificationsEnabled = OS permission is granted AND user hasn't disabled in-app
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const osPermission = getNotificationPermission();
    const stored = localStorage.getItem('manit_self_notif_enabled');
    // Only enabled if OS also granted
    return osPermission === 'granted' && (stored === null ? true : stored === 'true');
  });

  // Poll the real OS permission every 2s so UI stays in sync when user
  // changes settings from outside the app (phone Settings → Apps)
  useEffect(() => {
    if (!isNotificationSupported()) return;
    
    // Initialize permission state from OS and refresh subscription if needed
    const current = getNotificationPermission();
    setPermission(current);
    
    // Auto-refresh subscription in background if already enabled and logged in
    if (current === 'granted' && localStorage.getItem('manit_self_notif_enabled') === 'true' && user?.uid) {
      subscribeToWebPush(user.uid);
    }

    const id = setInterval(() => {
      const current = getNotificationPermission();
      setPermission((prev) => {
        if (prev !== current) {
          // OS permission changed externally
          if (current !== 'granted') {
            // OS revoked — disable in-app too
            setNotificationsEnabled(false);
            localStorage.setItem('manit_self_notif_enabled', 'false');
          }
          return current;
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // toggleNotifications: instant toggle — OS permission + background web push subscribe
  const toggleNotifications = useCallback(async (profileName) => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      if (!notificationsEnabled) {
        // TURN ON
        const currentPerm = getNotificationPermission();

        if (currentPerm === 'denied') {
          // Already blocked — can't do anything
          setIsToggling(false);
          return;
        }

        // Step 1: Ask OS for permission (fast — just a browser dialog)
        const result = await requestNotificationPermission();
        setPermission(result);

        if (result !== 'granted') {
          setIsToggling(false);
          return;
        }

        // Step 2: Immediately update UI — toggle is ON!
        setNotificationsEnabled(true);
        localStorage.setItem('manit_self_notif_enabled', 'true');
        showToast('✅ Notifications activated! 🔔');
        scheduleSmartNotifications(() => ({ subjects, schedule, history }));

        // Step 3: Subscribe to web push in background (non-blocking)
        if (user?.uid && user.uid !== 'local') {
          subscribeToWebPushBackground(user.uid);
        }

        // Step 4: Show welcome notification (non-blocking)
        notifyWelcome(profileName || 'Student').catch(() => {});

      } else {
        // TURN OFF — instant, no async needed
        setNotificationsEnabled(false);
        localStorage.setItem('manit_self_notif_enabled', 'false');
        clearDailyReminder();
        clearSmartNotifications();
      }
    } catch (err) {
      console.error('[Toggle] Error:', err);
      showToast('❌ Failed to toggle notifications', 'error');
    } finally {
      setIsToggling(false);
    }
  }, [notificationsEnabled, isToggling, user, subjects, schedule, history, showToast]);

  // Show banner after 3s if OS permission not yet asked and not dismissed
  useEffect(() => {
    if (!isNotificationSupported()) return;
    if (bannerDismissed) return;
    if (permission === 'granted') return;
    if (permission === 'denied') return;

    const timer = setTimeout(() => setShowBanner(true), 500);
    return () => clearTimeout(timer);
  }, [permission, bannerDismissed]);

  const askPermission = useCallback(async (profileName) => {
    const result = await requestNotificationPermission(user?.uid);
    setPermission(result);
    setBannerDismissed(true);
    setShowBanner(false);
    if (result === 'granted') {
      await notifyWelcome(profileName || 'Student');
      showToast('✅ Thank you! Notifications activated successfully! 🔔');
      setNotificationsEnabled(true);
      localStorage.setItem('manit_self_notif_enabled', 'true');
    }
    return result;
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    setBannerDismissed(true);
    localStorage.setItem('manit_self_notif_banner_dismissed', 'true');
  }, []);

  const checkAttendanceAlerts = useCallback(async (subjects, getSubjectPercentage) => {
    if (permission !== 'granted') return;
    if (!notificationsEnabled) return;

    const alerted = JSON.parse(localStorage.getItem('manit_self_notif_alerted') || '{}');
    const now = Date.now();
    const COOLDOWN = 4 * 60 * 60 * 1000;

    for (const sub of subjects) {
      const pct = getSubjectPercentage(sub);
      const lastAlert = alerted[sub.id] || 0;
      if (now - lastAlert < COOLDOWN) continue;

      if (pct < 60) {
        await notifyCriticalAttendance(sub.code, pct);
        alerted[sub.id] = now;
      } else if (pct < 75) {
        await notifyLowAttendance(sub.code, pct);
        alerted[sub.id] = now;
      }
    }

    localStorage.setItem('manit_self_notif_alerted', JSON.stringify(alerted));
  }, [permission, notificationsEnabled]);

  const checkUnmarkedClasses = useCallback(async (unmarkedCount) => {
    if (permission !== 'granted') return;
    if (!notificationsEnabled) return;
    if (unmarkedCount === 0) return;

    const lastUnmarkedAlert = localStorage.getItem('manit_self_notif_unmarked_ts') || 0;
    const COOLDOWN = 2 * 60 * 60 * 1000;
    if (Date.now() - Number(lastUnmarkedAlert) < COOLDOWN) return;

    await notifyUnmarkedClasses(unmarkedCount);
    localStorage.setItem('manit_self_notif_unmarked_ts', Date.now().toString());
  }, [permission, notificationsEnabled]);

  const setupDailyReminder = useCallback((getOverallPct) => {
    if (permission !== 'granted' || !notificationsEnabled) {
      clearDailyReminder();
      clearSmartNotifications();
      return;
    }
    scheduleDailyReminder(getOverallPct, 20, 0);
    // Also keep smart notifications running
    scheduleSmartNotifications(() => ({ subjects, schedule, history }));
  }, [permission, notificationsEnabled, subjects, schedule, history]);

  const resetBannerDismiss = useCallback(() => {
    setBannerDismissed(false);
    localStorage.removeItem('manit_self_notif_banner_dismissed');
  }, []);

  const value = {
    permission,
    showBanner,
    isSupported: isNotificationSupported(),
    notificationsEnabled,
    isToggling,
    toggleNotifications,
    askPermission,
    dismissBanner,
    checkAttendanceAlerts,
    checkUnmarkedClasses,
    setupDailyReminder,
    resetBannerDismiss,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
