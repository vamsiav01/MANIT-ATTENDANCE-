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

  // toggleNotifications: if turning ON → request OS permission first
  const toggleNotifications = useCallback(async (profileName) => {
    const currentPerm = getNotificationPermission();

    if (!notificationsEnabled) {
      // User wants to TURN ON
      if (currentPerm === 'denied') {
        return;
      }
      if (currentPerm !== 'granted') {
        const result = await requestNotificationPermission(user?.uid);
        setPermission(result);
        if (result !== 'granted') return;
      }
      await notifyWelcome(profileName || 'Student');
      showToast('✅ Thank you! Notifications activated successfully! 🔔');
      setNotificationsEnabled(true);
      localStorage.setItem('manit_self_notif_enabled', 'true');
      // Start smart morning + evening notifications
      scheduleSmartNotifications(() => ({ subjects, schedule, history }));
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('manit_self_notif_enabled', 'false');
      clearDailyReminder();
      clearSmartNotifications();
    }
  }, [notificationsEnabled]);

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
