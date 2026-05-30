import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_SUBJECTS, DEFAULT_PROFILE, DAY_SCHEDULE, generateSampleHistory, buildScheduleFromSubjects } from '../utils/sampleData';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AttendanceContext = createContext();

const STORAGE_KEYS = {
  subjects: 'manit_self_subjects',
  profile: 'manit_self_profile',
  history: 'manit_self_history',
  schedule: 'manit_self_schedule',
};

export function AttendanceProvider({ children }) {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.subjects);
    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.profile);
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.history);
    if (saved) return JSON.parse(saved);
    return generateSampleHistory(DEFAULT_SUBJECTS);
  });

  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.schedule);
    return saved ? JSON.parse(saved) : DAY_SCHEDULE;
  });

  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [lastSynced, setLastSynced] = useState(null);
  const syncTimerRef = useRef(null);
  const dataLoadedFromCloudRef = useRef(false);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule)); }, [schedule]);

  // ---- Firebase Cloud Sync ----
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
          showToast('☁️ Data restored from cloud');
        } else {
          // First time — push local data to cloud
          await pushToCloud();
          showToast('☁️ Data backed up to cloud');
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
        subjects,
        profile,
        history,
        schedule,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch (err) {
      console.error('Cloud push failed:', err);
      setSyncStatus('error');
    }
  }, [user, firebaseReady, subjects, profile, history, schedule]);

  // Auto-sync with debounce
  useEffect(() => {
    if (!user || user.uid === 'local' || !firebaseReady || !dataLoadedFromCloudRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      pushToCloud();
    }, 3000);

    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [subjects, profile, history, schedule, pushToCloud]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const rebuildSchedule = (subs) => {
    setSchedule(buildScheduleFromSubjects(subs));
  };

  const addSubject = (subject) => {
    const newSubjects = [...subjects, subject];
    setSubjects(newSubjects);
    rebuildSchedule(newSubjects);
    showToast(`${subject.name} added`);
  };

  const updateSubject = (id, updates) => {
    const newSubjects = subjects.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSubjects(newSubjects);
    if (updates.days) rebuildSchedule(newSubjects);
  };

  const deleteSubject = (id) => {
    const sub = subjects.find((s) => s.id === id);
    const newSubjects = subjects.filter((s) => s.id !== id);
    setSubjects(newSubjects);
    rebuildSchedule(newSubjects);
    showToast(`${sub?.name || 'Subject'} removed`, 'error');
  };

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
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, totalClasses: s.totalClasses + periods } : s
      )
    );
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
          return {
            ...s,
            attended: wasPresent ? s.attended - periods : s.attended,
            totalClasses: s.totalClasses - periods,
          };
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

  const updateProfile = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    showToast('Profile updated');
  };

  const updateSchedule = (day, subjectIds) => {
    setSchedule((prev) => ({ ...prev, [day]: subjectIds }));
  };

  const resetData = () => {
    if (!window.confirm('Reset all data to sample defaults? This cannot be undone.')) return;
    const newHistory = generateSampleHistory(DEFAULT_SUBJECTS);
    setSubjects([...DEFAULT_SUBJECTS]);
    setProfile({ ...DEFAULT_PROFILE });
    setHistory(newHistory);
    setSchedule({ ...DAY_SCHEDULE });
    dataLoadedFromCloudRef.current = false;
    // Force localStorage update
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(DEFAULT_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(newHistory));
    localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(DAY_SCHEDULE));
    showToast('✅ Data reset to defaults');
  };

  // Manual backup export/import
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
        showToast('📦 Backup imported successfully');
      } catch (err) {
        showToast('Failed to import backup', 'error');
      }
    };
    reader.readAsText(file);
  };

  const forceSyncNow = () => {
    pushToCloud();
  };

  const value = {
    subjects, profile, history, schedule, toast,
    syncStatus, lastSynced,
    addSubject, updateSubject, deleteSubject,
    markPresent, markAbsent, markHoliday, undoMark,
    updateProfile, updateSchedule, resetData, showToast,
    exportBackup, importBackup, forceSyncNow,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error('useAttendance must be used within AttendanceProvider');
  return context;
}
