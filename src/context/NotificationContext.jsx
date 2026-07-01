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
  subscribeToWebPushBackground,
} from '../utils/notifications';
import { useAttendance } from './AttendanceContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { subjects, schedule, history, showToast } = useAttendance();
  const { user } = useAuth();

  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem('manit_self_notif_banner_dismissed') === 'true'
  );

  // Source of truth: both OS and user preference must be true
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const osPerm = getNotificationPermission();
    const stored = localStorage.getItem('manit_self_notif_enabled');
    return osPerm === 'granted' && stored === 'true';
  });

  // Use a ref to track if we are inside a toggle so syncPermission doesn't override
  const isTogglingRef = useRef(false);

  // Sync OS permission state with toggle (visibilitychange + polling)
  useEffect(() => {
    if (!isNotificationSupported()) return;

    const syncPermission = () => {
      // Never override the state while the user is actively toggling
      if (isTogglingRef.current) return;

      const current = getNotificationPermission();
      setPermission(current);

      if (current !== 'granted') {
        // OS permission was revoked from phone Settings — disable toggle
        setNotificationsEnabled(false);
        localStorage.setItem('manit_self_notif_enabled', 'false');
      } else {
        // OS is granted — read what user last chose in-app
        const stored = localStorage.getItem('manit_self_notif_enabled');
        setNotificationsEnabled(stored === 'true');
      }
    };

    syncPermission();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncPermission();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const id = setInterval(syncPermission, 3000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(id);
    };
  }, []);

  const toggleNotifications = useCallback(async (profileName) => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    try {
      if (!notificationsEnabled) {
        // ── TURN ON ───────────────────────────────────────────
        const currentPerm = getNotificationPermission();

        if (currentPerm === 'denied') {
          // OS has blocked this — user must go to Settings
          isTogglingRef.current = false;
          return;
        }

        // Ask OS for permission (shows browser dialog if not yet asked)
        const result = await requestNotificationPermission();
        setPermission(result);

        if (result !== 'granted') {
          isTogglingRef.current = false;
          return;
        }

        // Immediately flip the toggle ON
        localStorage.setItem('manit_self_notif_enabled', 'true');
        setNotificationsEnabled(true);
        showToast('✅ Notifications activated! 🔔');
        scheduleSmartNotifications(() => ({ subjects, schedule, history }));

        // Subscribe web push in background (non-blocking)
        if (user?.uid && user.uid !== 'local') {
          subscribeToWebPushBackground(user.uid);
        }

        // Show welcome notification (non-blocking)
        notifyWelcome(profileName || 'Student').catch(() => {});

      } else {
        // ── TURN OFF ──────────────────────────────────────────
        localStorage.setItem('manit_self_notif_enabled', 'false');
        setNotificationsEnabled(false);
        clearDailyReminder();
        clearSmartNotifications();
      }
    } catch (err) {
      console.error('[Toggle] Error:', err);
      showToast('❌ Failed to toggle notifications', 'error');
    } finally {
      isTogglingRef.current = false;
    }
  }, [notificationsEnabled, user, subjects, schedule, history, showToast]);

  // Show permission banner after 0.5s if not yet asked
  useEffect(() => {
    if (!isNotificationSupported()) return;
    if (bannerDismissed || permission === 'granted' || permission === 'denied') return;
    const timer = setTimeout(() => setShowBanner(true), 500);
    return () => clearTimeout(timer);
  }, [permission, bannerDismissed]);

  const askPermission = useCallback(async (profileName) => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setBannerDismissed(true);
    setShowBanner(false);
    if (result === 'granted') {
      localStorage.setItem('manit_self_notif_enabled', 'true');
      setNotificationsEnabled(true);
      notifyWelcome(profileName || 'Student').catch(() => {});
      showToast('✅ Thank you! Notifications activated! 🔔');
    }
    return result;
  }, [showToast]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    setBannerDismissed(true);
    localStorage.setItem('manit_self_notif_banner_dismissed', 'true');
  }, []);

  const checkAttendanceAlerts = useCallback(async (subs, getSubjectPercentage) => {
    if (permission !== 'granted' || !notificationsEnabled) return;
    const alerted = JSON.parse(localStorage.getItem('manit_self_notif_alerted') || '{}');
    const now = Date.now();
    const COOLDOWN = 4 * 60 * 60 * 1000;
    for (const sub of subs) {
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
    if (permission !== 'granted' || !notificationsEnabled || unmarkedCount === 0) return;
    const lastAlert = localStorage.getItem('manit_self_notif_unmarked_ts') || 0;
    const COOLDOWN = 2 * 60 * 60 * 1000;
    if (Date.now() - Number(lastAlert) < COOLDOWN) return;
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
    scheduleSmartNotifications(() => ({ subjects, schedule, history }));
  }, [permission, notificationsEnabled, subjects, schedule, history]);

  const resetBannerDismiss = useCallback(() => {
    setBannerDismissed(false);
    localStorage.removeItem('manit_self_notif_banner_dismissed');
  }, []);

  return (
    <NotificationContext.Provider value={{
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
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
