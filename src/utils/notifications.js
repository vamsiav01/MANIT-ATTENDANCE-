// ============================================================
//  MANIT Attendance — Smart Notification Utility
//  Morning: today's class schedule + attendance risk alerts
//  Evening: attendance summary / "not marked" reminder
// ============================================================

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
const MANIT_ICON = '/icon-192.png';
const MANIT_BADGE = '/icon-192.png';
const STORAGE_KEY = 'manit_self_notif_permission_asked';

// ── Permission helpers ──────────────────────────────────────

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export function isNotificationSupported() {
  return 'Notification' in window;
}

export async function requestNotificationPermission(userId) {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem(STORAGE_KEY, 'asked');
    
    if (permission === 'granted' && userId) {
      await subscribeToWebPush(userId);
    }
    
    return permission;
  } catch (err) {
    console.error('Error requesting permission', err);
    return 'denied';
  }
}

export function hasAskedPermission() {
  return localStorage.getItem(STORAGE_KEY) === 'asked';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToWebPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) return null;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    // Save to Firestore under pushSubscriptions collection
    await setDoc(doc(db, 'pushSubscriptions', userId), {
      subscription: JSON.parse(JSON.stringify(subscription)),
      updatedAt: new Date().toISOString()
    });
    console.log('Successfully saved Web Push subscription to Firestore');
    return subscription;
  } catch (err) {
    console.error('Failed to subscribe to web push:', err);
    import('react-hot-toast').then(({ toast }) => {
      toast.error('Failed to connect to notification server. Please check your VAPID keys.');
    });
    return null;
  }
}

// ── Show notification via Service Worker ─────────────────────

async function getActiveSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

export async function showNotification(title, options = {}) {
  if (getNotificationPermission() !== 'granted') return;

  const fullOptions = {
    icon: MANIT_ICON,
    badge: MANIT_BADGE,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
    ...options,
  };

  let isScheduled = false;

  try {
    const reg = await getActiveSW();
    isScheduled = !!fullOptions.timestampTrigger;
    const supportsTrigger = 'showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined';

    if (isScheduled) {
      if (supportsTrigger) {
        fullOptions.showTrigger = new TimestampTrigger(fullOptions.timestampTrigger);
        delete fullOptions.timestampTrigger;
      } else {
        // Experimental Background Triggers API not supported on this browser.
        // Abort to prevent it from showing immediately. The in-app setTimeout will handle it.
        return;
      }
    }

    if (reg) {
      await reg.showNotification(title, fullOptions);
    } else {
      delete fullOptions.timestampTrigger;
      new Notification(title, fullOptions);
    }
  } catch (err) {
    console.warn('Notification failed:', err);
    // If it was a scheduled notification that failed, DO NOT show it immediately as a fallback.
    if (!isScheduled) {
      try { 
        delete fullOptions.timestampTrigger;
        new Notification(title, fullOptions); 
      } catch {}
    }
  }
}

// ── Predefined notification templates ─────────────────────────

export async function notifyLowAttendance(subjectCode, percentage) {
  await showNotification(`⚠️ ${subjectCode} attendance is low!`, {
    body: `Your attendance is ${percentage}% — below the 75% threshold. Attend more classes!`,
    tag: `low-attendance-${subjectCode}`,
    data: { url: '/subjects' },
    actions: [
      { action: 'view', title: 'View Subjects' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

export async function notifyCriticalAttendance(subjectCode, percentage) {
  await showNotification(`🚨 ${subjectCode} is critically low!`, {
    body: `Only ${percentage}% attendance! You may not be allowed to sit in exams.`,
    tag: `critical-attendance-${subjectCode}`,
    requireInteraction: true,
    data: { url: '/calculator' },
    actions: [
      { action: 'calc', title: 'Open Calculator' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

export async function notifyUnmarkedClasses(count) {
  await showNotification(`📋 ${count} class${count > 1 ? 'es' : ''} not marked today`, {
    body: "Don't forget to mark your attendance for today's classes!",
    tag: 'unmarked-today',
    data: { url: '/today' },
    actions: [
      { action: 'mark', title: 'Mark Now' },
      { action: 'dismiss', title: 'Later' },
    ],
  });
}

export async function notifyDailyReminder(overallPct) {
  const emoji = overallPct >= 75 ? '✅' : overallPct >= 60 ? '⚠️' : '🚨';
  await showNotification(`${emoji} Daily Attendance Check`, {
    body: `Your overall attendance is ${overallPct}%. Open the app to mark today's classes.`,
    tag: 'daily-reminder',
    data: { url: '/today' },
    actions: [{ action: 'open', title: 'Open App' }],
  });
}

export async function notifyWelcome(name) {
  await showNotification('🎉 Thank You!', {
    body: `Notifications successfully activated! You will now receive timely reminders, ${name || 'Student'}.`,
    tag: 'welcome',
    data: { url: '/' },
  });
}

// ── 🌅 MORNING NOTIFICATION: Today's class schedule + risk alert ──

export async function notifyMorningSchedule(todaySubjects, subjectDetails) {
  if (getNotificationPermission() !== 'granted') return;
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  if (!todaySubjects || todaySubjects.length === 0) {
    // No classes today
    await showNotification('🗓️ No Classes Today!', {
      body: `You have no scheduled classes on ${todayName}. Enjoy your free day! 😊`,
      tag: 'morning-schedule',
      data: { url: '/timetable' },
    });
    return;
  }

  // Build string of subjects and periods: e.g., "OS (2 periods), DBMS (1 period)"
  const classDetails = todaySubjects.map(sub => {
    const periods = sub.periodsPerDay?.[todayName] || 1;
    return `${sub.code} (${periods} period${periods > 1 ? 's' : ''})`;
  }).join(', ');

  // Check for at-risk subjects among today's classes
  const atRisk = todaySubjects.filter(sub => {
    const detail = subjectDetails.find(s => s.id === sub.id);
    if (!detail) return false;
    const pct = detail.totalClasses > 0
      ? Math.round((detail.attended / detail.totalClasses) * 100)
      : 100;
    return pct < 75;
  });

  if (atRisk.length > 0) {
    const riskNames = atRisk.map(s => {
      const detail = subjectDetails.find(d => d.id === s.id);
      const pct = detail ? Math.round((detail.attended / detail.totalClasses) * 100) : 0;
      return `${s.code} is at ${pct}%`;
    }).join(', ');

    await showNotification('🌅 Good Morning! Classes Today ⚠️', {
      body: `Today's Schedule: ${classDetails}.\n🚨 Warning: ${riskNames}. Don't miss these classes!`,
      tag: 'morning-schedule',
      requireInteraction: false,
      data: { url: '/today' },
      actions: [
        { action: 'mark', title: "View Today" },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  } else {
    await showNotification(`🌅 Good Morning! ${todaySubjects.length} Class${todaySubjects.length > 1 ? 'es' : ''} Today`, {
      body: `Today's Schedule: ${classDetails}.\n✅ All attendance looks good. Have a great day!`,
      tag: 'morning-schedule',
      data: { url: '/today' },
      actions: [
        { action: 'mark', title: 'View Today' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }
}

// ── 🌙 EVENING NOTIFICATION: Today's attendance summary ──

export async function notifyEveningSummary(markedToday, unmarkedCount, totalToday, overallPct, attendedToday, missedToday) {
  if (getNotificationPermission() !== 'granted') return;

  if (totalToday === 0) return; // No classes today, no evening summary needed

  if (unmarkedCount > 0) {
    // Haven't marked all classes
    await showNotification('🌙 Please Mark Your Attendance!', {
      body: `You still have ${unmarkedCount} class${unmarkedCount > 1 ? 'es' : ''} not marked for today. Open the app to mark them now!`,
      tag: 'evening-summary',
      requireInteraction: true,
      data: { url: '/today' },
      actions: [
        { action: 'mark', title: 'Mark Now' },
        { action: 'dismiss', title: 'Remind Later' },
      ],
    });
  } else {
    const emoji = overallPct >= 75 ? '✅' : overallPct >= 60 ? '⚠️' : '🚨';
    const summaryParts = [];
    if (attendedToday > 0) summaryParts.push(`Present: ${attendedToday}`);
    if (missedToday > 0) summaryParts.push(`Absent: ${missedToday}`);

    await showNotification(`🌙 Great job marking attendance!`, {
      body: `Today's stats: ${summaryParts.length ? summaryParts.join(', ') : 'No classes'}. Your overall attendance is now ${overallPct}%. ${emoji}`,
      tag: 'evening-summary',
      data: { url: '/' },
      actions: [
        { action: 'open', title: 'View Dashboard' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }
}

// ── Smart Scheduler (Morning 8 AM + Evening 9 PM) ────────────────

let smartPollTimer = null;

export function scheduleSmartNotifications(getAppData) {
  if (smartPollTimer) { clearInterval(smartPollTimer); smartPollTimer = null; }
  if (getNotificationPermission() !== 'granted') return;

  function checkAndFire() {
    const now = new Date();
    const h = now.getHours();
    const todayStr = now.toLocaleDateString('en-CA'); // Local date string YYYY-MM-DD
    const morningKey = `manit_morning_${todayStr}`;
    const eveningKey = `manit_evening_${todayStr}`;

    // Morning: Fire between 8 AM and 12 PM if not already fired today
    if (h >= 8 && h < 12 && !localStorage.getItem(morningKey)) {
      localStorage.setItem(morningKey, 'true');
      const { subjects, schedule, history } = getAppData();
      const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
      const todayItems = schedule[todayName] || [];
      const todaySubjects = todayItems.map(id => subjects.find(s => s.id === id)).filter(Boolean);
      notifyMorningSchedule(todaySubjects, subjects);
    }

    // Evening: Fire between 8 PM (20:00) and Midnight if not already fired today
    if (h >= 20 && h < 24 && !localStorage.getItem(eveningKey)) {
      localStorage.setItem(eveningKey, 'true');
      const { subjects, schedule, history } = getAppData();
      const todayHistory = history[todayStr] || {};
      const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySchedule = schedule[todayName] || [];

      let attendedToday = 0;
      let missedToday = 0;

      Object.values(todayHistory).forEach(entry => {
        const status = typeof entry === 'string' ? entry : entry?.status;
        if (status === 'present') attendedToday++;
        else if (status === 'absent') missedToday++;
      });

      const totalToday = todaySchedule.length;
      const markedCount = attendedToday + missedToday;
      const unmarkedCount = Math.max(0, totalToday - markedCount);
      const markedToday = markedCount > 0;

      const totalAttended = subjects.reduce((s, sub) => s + sub.attended, 0);
      const totalClasses = subjects.reduce((s, sub) => s + sub.totalClasses, 0);
      const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

      notifyEveningSummary(markedToday, unmarkedCount, totalToday, overallPct, attendedToday, missedToday);
    }
  }

  // Check immediately, then every 1 minute
  checkAndFire();
  smartPollTimer = setInterval(checkAndFire, 60000);
}

export function clearSmartNotifications() {
  if (smartPollTimer) { clearInterval(smartPollTimer); smartPollTimer = null; }
}

// ── Legacy daily reminder (kept for compatibility) ────────────

let dailyPollTimer = null;

export function scheduleDailyReminder(getOverallPct, hour = 20, minute = 0) {
  if (dailyPollTimer) { clearInterval(dailyPollTimer); dailyPollTimer = null; }
  if (getNotificationPermission() !== 'granted') return;

  function checkAndFire() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const todayStr = now.toLocaleDateString('en-CA');
    const key = `manit_daily_${hour}_${todayStr}`;

    // Fire within a 4-hour window of the scheduled time
    if (h >= hour && h < (hour + 4) && !localStorage.getItem(key)) {
      // If we specify minutes, make sure we passed the minute mark (only relevant in the first hour)
      if (h === hour && m < minute) return;
      
      localStorage.setItem(key, 'true');
      const pct = getOverallPct();
      notifyDailyReminder(pct);
    }
  }

  checkAndFire();
  dailyPollTimer = setInterval(checkAndFire, 60000);
}

export function clearDailyReminder() {
  if (dailyPollTimer) { clearInterval(dailyPollTimer); dailyPollTimer = null; }
}
