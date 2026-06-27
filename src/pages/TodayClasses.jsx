import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Check, X, CalendarOff, Undo2, Sparkles, UserCircle, PartyPopper } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { getPeriodsForDay } from '../utils/sampleData';
import {
  getTodayKey,
  getTodayName,
  getSubjectPercentage,
  getPctClass,
  classesCanMiss,
  classesNeeded,
  formatDate,
} from '../utils/helpers';

export default function TodayClasses() {
  const { subjects, history, schedule, markPresent, markAbsent, markHoliday, undoMark, showToast } = useAttendance();
  const [customPeriods, setCustomPeriods] = useState({});

  const todayKey = getTodayKey();
  const todayName = getTodayName();
  const todaySchedule = schedule[todayName] || [];
  const todayHistory = history[todayKey] || {};

  const todaySubjects = useMemo(() => {
    return todaySchedule
      .map((id) => subjects.find((s) => s.id === id))
      .filter(Boolean);
  }, [todaySchedule, subjects]);

  const markedCount = todaySubjects.filter((s) => todayHistory[s.id]).length;
  const allMarked = markedCount === todaySubjects.length && todaySubjects.length > 0;

  const handleMark = (subId, type) => {
    const sub = subjects.find(s => s.id === subId);
    const p = customPeriods[subId] ?? getPeriodsForDay(sub, todayName);
    if (todayHistory[subId]) {
      // Already marked, undo first
      undoMark(subId, todayKey);
    }
    if (type === 'present') markPresent(subId, todayKey, p);
    else if (type === 'absent') markAbsent(subId, todayKey, p);
    else if (type === 'holiday') markHoliday(subId, todayKey);
  };

  const handleUndo = (subId) => {
    undoMark(subId, todayKey);
    showToast('Attendance undone');
  };

  // Count total periods today
  const totalPeriods = todaySubjects.reduce((sum, sub) => sum + (customPeriods[sub.id] ?? getPeriodsForDay(sub, todayName)), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* All-Done Celebration */}
      <AnimatePresence>
        {allMarked && todaySubjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              textAlign: 'center', padding: '20px 24px', marginBottom: 16,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.08))',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ fontSize: '2rem', marginBottom: 8 }}
            >🎉</motion.div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success-400)' }}>All Done for Today!</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Great job tracking your attendance. Keep it up!</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="page-header">
        <h1>Today's Classes</h1>
        <p>{formatDate(todayKey)} — {todayName}. Mark your attendance for each class.</p>
      </div>

      {/* Status Banner */}
      <motion.div
        className="glass-card"
        style={{
          padding: '18px 24px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          borderColor: allMarked ? 'rgba(34,197,94,0.3)' : 'var(--border-primary)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {allMarked ? (
            <Sparkles size={20} style={{ color: 'var(--success-400)' }} />
          ) : (
            <CalendarCheck size={20} style={{ color: 'var(--primary-400)' }} />
          )}
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {allMarked ? '🎉 All classes marked for today!' : `${markedCount}/${todaySubjects.length} classes marked`}
            </span>
            {totalPeriods > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>
                ({totalPeriods} total periods)
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--success-400)' }}>
            ✓ {Object.values(todayHistory).filter((v) => (typeof v === 'string' ? v : v.status) === 'present').length} Present
          </span>
          <span style={{ color: 'var(--danger-400)' }}>
            ✗ {Object.values(todayHistory).filter((v) => (typeof v === 'string' ? v : v.status) === 'absent').length} Absent
          </span>
          <span style={{ color: 'var(--holiday-400)' }}>
            📅 {Object.values(todayHistory).filter((v) => (typeof v === 'string' ? v : v.status) === 'holiday').length} Holiday
          </span>
        </div>
      </motion.div>

      {/* Class Cards */}
      {todaySubjects.length === 0 ? (
        <div className="glass-card empty-state" style={{ padding: 60 }}>
          <Sparkles size={48} style={{ color: 'var(--primary-400)', marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No classes today!</h3>
          <p style={{ color: 'var(--text-tertiary)' }}>
            {todayName === 'Sunday' ? "It's Sunday — enjoy your day off! 🌴" : 'No subjects are scheduled for today.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {todaySubjects.map((sub, idx) => {
            const rawStatus = todayHistory[sub.id];
            const status = typeof rawStatus === 'string' ? rawStatus : rawStatus?.status;
            const pct = getSubjectPercentage(sub);
            const target = sub.targetPct !== undefined ? sub.targetPct : 75;
            const canMiss = classesCanMiss(sub.attended, sub.totalClasses, target);
            const needed = classesNeeded(sub.attended, sub.totalClasses, target);
            const isHoliday = status === 'holiday';

            return (
              <motion.div
                key={sub.id}
                className="glass-card"
                style={{
                  padding: 20,
                  borderColor: status === 'present' ? 'rgba(34,197,94,0.2)' : status === 'absent' ? 'rgba(239,68,68,0.2)' : isHoliday ? 'rgba(20,184,166,0.2)' : 'var(--border-primary)',
                  position: 'relative', overflow: 'hidden',
                }}
                initial={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ y: -3, boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 0 20px ${sub.color}10` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  {/* Left: Subject Info */}
                  <div style={{ flex: '1 1 250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: sub.color, flexShrink: 0 }} />
                      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{sub.name}</h3>
                    </div>

                    {/* Teacher */}
                    {sub.teacher && (
                      <div className="teacher-tag" style={{ marginBottom: 8 }}>
                        <UserCircle size={13} />
                        <span>{sub.teacher}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span className="badge badge-info">{sub.code}</span>
                      <span className={`badge ${pct >= target ? 'badge-success' : pct >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                        {pct}% attendance
                      </span>
                      <span className="badge" style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-tertiary)',
                        border: '1px solid var(--border-primary)',
                      }}>
                        {sub.attended}/{sub.totalClasses} classes
                      </span>
                      {(() => { 
                        const p = customPeriods[sub.id] ?? getPeriodsForDay(sub, todayName);
                        return (
                          <span className="badge badge-day" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px' }}>
                            <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }} onClick={() => setCustomPeriods(prev => ({...prev, [sub.id]: Math.max(1, p - 1)}))}>-</button>
                            <span>{p} period{p > 1 ? 's' : ''}</span>
                            <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }} onClick={() => setCustomPeriods(prev => ({...prev, [sub.id]: p + 1}))}>+</button>
                          </span>
                        ); 
                      })()}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                      {isHoliday ? (
                        <span style={{ color: 'var(--holiday-400)' }}>📅 Holiday — no attendance change</span>
                      ) : pct >= target ? (
                        <span style={{ color: 'var(--success-400)' }}>✓ Safe — can miss {canMiss} more class{canMiss !== 1 ? 'es' : ''}</span>
                      ) : (
                        <span style={{ color: 'var(--danger-400)' }}>⚠ Need to attend {needed} consecutive class{needed !== 1 ? 'es' : ''} to reach {target}%</span>
                      )}
                    </p>
                  </div>

                  {/* Right: Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {status ? (
                      <>
                        <motion.div
                          className="attendance-status-tag"
                          initial={{ scale: 0.5, opacity: 0, filter: 'blur(8px)' }}
                          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            background: status === 'present' ? 'rgba(34,197,94,0.15)' : status === 'absent' ? 'rgba(239,68,68,0.15)' : 'rgba(20,184,166,0.15)',
                            color: status === 'present' ? 'var(--success-400)' : status === 'absent' ? 'var(--danger-400)' : 'var(--holiday-400)',
                            border: `1px solid ${status === 'present' ? 'rgba(34,197,94,0.3)' : status === 'absent' ? 'rgba(239,68,68,0.3)' : 'rgba(20,184,166,0.3)'}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '📅 Holiday'}
                        </motion.div>
                        <motion.button
                          className="btn btn-ghost btn-icon"
                          onClick={() => handleUndo(sub.id)}
                          title="Undo"
                          style={{ color: 'var(--text-tertiary)' }}
                          whileHover={{ scale: 1.15, rotate: -15, color: 'var(--primary-400)' }}
                          whileTap={{ scale: 0.85, rotate: -30 }}
                        >
                          <Undo2 size={16} />
                        </motion.button>
                      </>
                    ) : (
                      <div className="attendance-toggle">
                        <motion.button
                          className="att-present"
                          onClick={() => handleMark(sub.id, 'present')}
                          whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Check size={14} style={{ marginRight: 4 }} /> Present
                        </motion.button>
                        <motion.button
                          className="att-absent"
                          onClick={() => handleMark(sub.id, 'absent')}
                          whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X size={14} style={{ marginRight: 4 }} /> Absent
                        </motion.button>
                        <motion.button
                          className="att-holiday"
                          onClick={() => handleMark(sub.id, 'holiday')}
                          whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(20,184,166,0.3)' }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <CalendarOff size={14} style={{ marginRight: 4 }} /> Holiday
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
