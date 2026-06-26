import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_PROFILE, DAY_SCHEDULE, buildScheduleFromSubjects } from '../utils/sampleData';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { notifyLowAttendance, notifyCriticalAttendance, getNotificationPermission } from '../utils/notifications';

const AttendanceContext = createContext();

const STORAGE_KEYS = {
  subjects: 'manit_self_subjects',
  profile: 'manit_self_profile',
  history: 'manit_self_history',
  schedule: 'manit_self_schedule',
  bin: 'manit_self_bin',
  isSetup: 'manit_self_is_setup', // flag: user completed onboarding
};

const EMPTY_SCHEDULE = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
const BIN_EXPIRY_DAYS = 30;

export function AttendanceProvider({ children }) {
  const { user } = useAuth();

  // ── Start with EMPTY data for new users ──────────────────────
  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.subjects);
    return saved ? JSON.parse(saved) : [];
  });

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.profile);
    return saved ? JSON.parse(saved) : { ...DEFAULT_PROFILE, name: '', scholarNo: '' };
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.history);
    return saved ? JSON.parse(saved) : {};
  });

  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.schedule);
    return saved ? JSON.parse(saved) : EMPTY_SCHEDULE;
  });

  // ── Bin / Trash (30-day hold) ─────────────────────────────────
  const [bin, setBin] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.bin);
    return saved ? JSON.parse(saved) : [];
  });

  // Track if the user has completed onboarding
  const [isSetup, setIsSetup] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.isSetup) === 'true';
  });

  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSynced, setLastSynced] = useState(null);
  const syncTimerRef = useRef(null);
  const dataLoadedFromCloudRef = useRef(false);

  // ── Persist to localStorage ────────────────────────────────────
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.bin, JSON.stringify(bin)); }, [bin]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.isSetup, isSetup ? 'true' : 'false'); }, [isSetup]);

  // ── Firebase Cloud Sync ────────────────────────────────────────
  const firebaseReady = isFirebaseConfigured() && db;

  // Pull data from Firestore on login
  useEffect(() => {
    if (!user || user.uid === 'local' || !firebaseReady || dataLoadedFromCloudRef.current) return;

    const loadFromCloud = async () => {
      try {
        setSyncStatus('syncing');
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.subjects) setSubjects(data.subjects);
          if (data.profile) setProfile(data.profile);
          if (data.history) setHistory(data.history);
          if (data.schedule) setSchedule(data.schedule);
          if (data.bin) setBin(data.bin);
          // Returning user — mark as setup complete
          setIsSetup(true);
          localStorage.setItem(STORAGE_KEYS.isSetup, 'true');
          showToast('☁️ Data restored from cloud');
        } else {
          // Brand new user — push empty local data to cloud
          await pushToCloud();
          showToast('☁️ Account created. Complete setup below!');
        }

        dataLoadedFromCloudRef.current = true;
        setSyncStatus('synced');
        setLastSynced(new Date());
      } catch (err) {
        console.error('Cloud load failed:', err);
        setSyncStatus('error');
      }
    };

    loadFromCloud();
  }, [user, firebaseReady]);

  // Debounced push to cloud on data changes
  const pushToCloud = useCallback(async () => {
    if (!user || user.uid === 'local' || !firebaseReady) return;
    try {
      setSyncStatus('syncing');
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        subjects, profile, history, schedule, bin,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      console.error('Cloud push failed:', err);
      setSyncStatus('error');
    }
  }, [user, firebaseReady, subjects, profile, history, schedule, bin]);

  // Auto-sync with debounce
  useEffect(() => {
    if (!user || user.uid === 'local' || !firebaseReady || !dataLoadedFromCloudRef.current) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => { pushToCloud(); }, 3000);
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [subjects, profile, history, schedule, bin, pushToCloud]);

  // Auto-purge bin items older than 30 days on load
  useEffect(() => {
    const now = Date.now();
    const fresh = bin.filter(item => {
      const age = (now - item.deletedAt) / (1000 * 60 * 60 * 24);
      return age < BIN_EXPIRY_DAYS;
    });
    if (fresh.length !== bin.length) setBin(fresh);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const rebuildSchedule = (subs) => { setSchedule(buildScheduleFromSubjects(subs)); };

  // ── Subject CRUD ───────────────────────────────────────────────
  const addSubject = (subject) => {
    const newSubjects = [...subjects, subject];
    setSubjects(newSubjects);
    rebuildSchedule(newSubjects);
    showToast(`✅ ${subject.name} added`);
  };

  const updateSubject = (id, updates) => {
    const newSubjects = subjects.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSubjects(newSubjects);
    if (updates.days) rebuildSchedule(newSubjects);
  };

  // Move to bin instead of permanently deleting
  const deleteSubject = (id) => {
    const sub = subjects.find((s) => s.id === id);
    if (!sub) return;

    // Collect this subject's attendance history
    const subHistory = {};
    Object.entries(history).forEach(([dateKey, dayData]) => {
      if (dayData[id]) {
        subHistory[dateKey] = { [id]: dayData[id] };
      }
    });

    const binItem = {
      binId: `bin_${id}_${Date.now()}`,
      type: 'subject',
      deletedAt: Date.now(),
      subject: { ...sub },
      history: subHistory,
    };

    setBin(prev => [...prev, binItem]);
    const newSubjects = subjects.filter((s) => s.id !== id);
    setSubjects(newSubjects);
    rebuildSchedule(newSubjects);

    // Remove from history
    setHistory(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(dateKey => {
        if (updated[dateKey][id]) {
          updated[dateKey] = { ...updated[dateKey] };
          delete updated[dateKey][id];
          if (Object.keys(updated[dateKey]).length === 0) delete updated[dateKey];
        }
      });
      return updated;
    });

    showToast(`🗑️ ${sub.name} moved to Trash (restoreable for 30 days)`, 'warning');
  };

  // ── Trash / Bin operations ─────────────────────────────────────
  const restoreFromTrash = (binId) => {
    const item = bin.find(b => b.binId === binId);
    if (!item || item.type !== 'subject') return;

    const restored = item.subject;
    const newSubjects = [...subjects, restored];
    setSubjects(newSubjects);
    rebuildSchedule(newSubjects);

    // Restore history
    setHistory(prev => {
      const updated = { ...prev };
      Object.entries(item.history || {}).forEach(([dateKey, dayData]) => {
        updated[dateKey] = { ...(updated[dateKey] || {}), ...dayData };
      });
      return updated;
    });

    setBin(prev => prev.filter(b => b.binId !== binId));
    showToast(`✅ ${restored.name} restored successfully`);
  };

  const permanentlyDelete = (binId) => {
    setBin(prev => prev.filter(b => b.binId !== binId));
    showToast('🗑️ Permanently deleted');
  };

  const emptyTrash = () => {
    setBin([]);
    showToast('🗑️ Trash emptied');
  };

  // ── Attendance marking ─────────────────────────────────────────
  const markPresent = (subjectId, dateKey, periods = 1) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, attended: s.attended + periods, totalClasses: s.totalClasses + periods } : s
      )
    );
    setHistory((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) updated[dateKey] = {};
      updated[dateKey][subjectId] = { status: 'present', periods };
      return updated;
    });
  };

  const markAbsent = (subjectId, dateKey, periods = 1) => {
    setSubjects((prev) => {
      const updated = prev.map((s) =>
        s.id === subjectId ? { ...s, totalClasses: s.totalClasses + periods } : s
      );
      if (getNotificationPermission() === 'granted') {
        const sub = updated.find((s) => s.id === subjectId);
        if (sub) {
          const pct = sub.totalClasses > 0 ? Math.round((sub.attended / sub.totalClasses) * 100) : 0;
          const alertKey = `manit_alert_ts_${subjectId}`;
          const lastAlert = Number(localStorage.getItem(alertKey) || 0);
          const COOLDOWN = 60 * 60 * 1000;
          if (Date.now() - lastAlert > COOLDOWN) {
            if (pct < 60) { notifyCriticalAttendance(sub.code, pct); localStorage.setItem(alertKey, Date.now().toString()); }
            else if (pct < 75) { notifyLowAttendance(sub.code, pct); localStorage.setItem(alertKey, Date.now().toString()); }
          }
        }
      }
      return updated;
    });
    setHistory((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) updated[dateKey] = {};
      updated[dateKey][subjectId] = { status: 'absent', periods };
      return updated;
    });
  };

  const markHoliday = (subjectId, dateKey) => {
    setHistory((prev) => {
      const updated = { ...prev };
      if (!updated[dateKey]) updated[dateKey] = {};
      updated[dateKey][subjectId] = 'holiday';
      return updated;
    });
  };

  const undoMark = (subjectId, dateKey) => {
    const record = history[dateKey]?.[subjectId];
    if (!record) return;
    const status = typeof record === 'string' ? record : record.status;
    const periods = typeof record === 'string' ? 1 : (record.periods || 1);

    if (status !== 'holiday') {
      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id !== subjectId) return s;
          const wasPresent = status === 'present';
          return { ...s, attended: wasPresent ? s.attended - periods : s.attended, totalClasses: s.totalClasses - periods };
        })
      );
    }
    setHistory((prev) => {
      const updated = { ...prev };
      if (updated[dateKey]) {
        delete updated[dateKey][subjectId];
        if (Object.keys(updated[dateKey]).length === 0) delete updated[dateKey];
      }
      return updated;
    });
  };

  // ── Profile / Schedule ─────────────────────────────────────────
  const updateProfile = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    showToast('Profile updated');
  };

  const updateSchedule = (day, subjectIds) => {
    setSchedule((prev) => ({ ...prev, [day]: subjectIds }));
  };

  const completeOnboarding = (profileData, initialSubjects = []) => {
    setProfile(prev => ({ ...prev, ...profileData }));
    if (initialSubjects.length > 0) {
      setSubjects(initialSubjects);
      rebuildSchedule(initialSubjects);
    }
    setIsSetup(true);
    localStorage.setItem(STORAGE_KEYS.isSetup, 'true');
    showToast('🎉 Welcome to MANIT Attendance Tracker!');
  };

  // ── Reset → Bin snapshot ───────────────────────────────────────
  const resetData = () => {
    if (!window.confirm('Move all data to Trash? You can restore from the Trash page within 30 days.')) return;

    const snapshot = {
      binId: `bin_snapshot_${Date.now()}`,
      type: 'snapshot',
      deletedAt: Date.now(),
      subjects: [...subjects],
      history: { ...history },
      schedule: { ...schedule },
      profile: { ...profile },
      label: `Full backup – ${new Date().toLocaleDateString()}`,
    };

    setBin(prev => [...prev, snapshot]);
    setSubjects([]);
    setHistory({});
    setSchedule(EMPTY_SCHEDULE);
    setIsSetup(false);
    localStorage.setItem(STORAGE_KEYS.isSetup, 'false');
    localStorage.removeItem(STORAGE_KEYS.subjects);
    localStorage.removeItem(STORAGE_KEYS.history);
    localStorage.removeItem(STORAGE_KEYS.schedule);

    if (user && user.uid !== 'local' && firebaseReady) {
      setDoc(doc(db, 'users', user.uid), {
        subjects: [],
        history: {},
        schedule: EMPTY_SCHEDULE,
        profile,
        bin: [...bin, snapshot],
        updatedAt: new Date().toISOString(),
      });
    }

    showToast('📦 All data moved to Trash. Restore anytime within 30 days.', 'warning');
  };

  const restoreSnapshot = (binId) => {
    const item = bin.find(b => b.binId === binId);
    if (!item || item.type !== 'snapshot') return;
    setSubjects(item.subjects || []);
    setHistory(item.history || {});
    setSchedule(item.schedule || EMPTY_SCHEDULE);
    setProfile(prev => ({ ...prev, ...(item.profile || {}) }));
    setIsSetup(true);
    localStorage.setItem(STORAGE_KEYS.isSetup, 'true');
    setBin(prev => prev.filter(b => b.binId !== binId));
    showToast('✅ Data restored from snapshot');
  };

  // ── Backup Export / Import ─────────────────────────────────────
  const exportBackup = () => {
    const data = { subjects, profile, history, schedule, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `manit_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('📦 Backup exported');
  };

  const importBackup = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.subjects) setSubjects(data.subjects);
        if (data.profile) setProfile(data.profile);
        if (data.history) setHistory(data.history);
        if (data.schedule) setSchedule(data.schedule);
        setIsSetup(true);
        localStorage.setItem(STORAGE_KEYS.isSetup, 'true');
        showToast('📦 Backup imported successfully');
      } catch (err) {
        showToast('Failed to import backup', 'error');
      }
    };
    reader.readAsText(file);
  };

  const forceSyncNow = () => { pushToCloud(); };

  const isInitializing = Boolean(user && user.uid !== 'local' && firebaseReady && !dataLoadedFromCloudRef.current);

  const value = {
    subjects, profile, history, schedule, bin, toast,
    syncStatus, lastSynced, isSetup, isInitializing,
    addSubject, updateSubject, deleteSubject,
    markPresent, markAbsent, markHoliday, undoMark,
    updateProfile, updateSchedule,
    resetData, showToast,
    restoreFromTrash, permanentlyDelete, emptyTrash, restoreSnapshot,
    completeOnboarding,
    exportBackup, importBackup, forceSyncNow,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error('useAttendance must be used within AttendanceProvider');
  return context;
}
