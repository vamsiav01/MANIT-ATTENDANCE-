import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronLeft, ChevronRight, Check, X, CalendarOff, Undo2, Filter, UserCircle } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { getPeriodsForDay } from '../utils/sampleData';
import {
  formatDate,
  getSubjectPercentage,
  getPctClass,
} from '../utils/helpers';

export default function AttendanceHistory() {
  const { subjects, history, schedule, markPresent, markAbsent, markHoliday, undoMark, showToast } = useAttendance();
  const [selectedDate, setSelectedDate] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [customPeriods, setCustomPeriods] = useState({});

  // Get all dates with attendance data, sorted newest first
  const allDates = useMemo(() => {
    return Object.keys(history).sort((a, b) => b.localeCompare(a));
  }, [history]);

  // Filter dates that contain the selected subject
  const filteredDates = useMemo(() => {
    if (filterSubject === 'all') return allDates;
    return allDates.filter((dateKey) => history[dateKey]?.[filterSubject]);
  }, [allDates, filterSubject, history]);

  // Navigate dates
  const navigateDate = (direction) => {
    if (!selectedDate) {
      setSelectedDate(allDates[0] || '');
      return;
    }
    const idx = allDates.indexOf(selectedDate);
    const newIdx = direction === 'prev' ? idx + 1 : idx - 1;
    if (newIdx >= 0 && newIdx < allDates.length) {
      setSelectedDate(allDates[newIdx]);
    }
  };

  // Get day name from date
  const getDayName = (dateKey) => {
    const date = new Date(dateKey + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Handle marking for a past date
  const handleMark = (subId, type, dateKey) => {
    const dayName = getDayName(dateKey);
    const sub = subjects.find(s => s.id === subId);
    const p = customPeriods[`${dateKey}_${subId}`] ?? getPeriodsForDay(sub, dayName);

    if (history[dateKey]?.[subId]) {
      undoMark(subId, dateKey);
    }
    if (type === 'present') markPresent(subId, dateKey, p);
    else if (type === 'absent') markAbsent(subId, dateKey, p);
    else if (type === 'holiday') markHoliday(subId, dateKey);
    showToast(`Attendance updated for ${formatDate(dateKey)}`);
  };

  const handleUndo = (subId, dateKey) => {
    undoMark(subId, dateKey);
    showToast('Attendance undone');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <h1>Attendance History</h1>
        <p>View, edit, and manage your past attendance records.</p>
      </div>

      {/* Controls */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Date Picker */}
          <div className="form-group" style={{ flex: '0 0 auto' }}>
            <label className="form-label" style={{ marginBottom: 4 }}>Jump to Date</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              id="history-date-picker"
              style={{ width: 180 }}
            />
          </div>

          {/* Subject Filter */}
          <div className="form-group" style={{ flex: '0 0 auto' }}>
            <label className="form-label" style={{ marginBottom: 4 }}>
              <Filter size={11} style={{ marginRight: 4 }} />Filter by Subject
            </label>
            <select
              className="form-select"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              id="history-subject-filter"
              style={{ width: 200 }}
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.code} — {s.code}</option>
              ))}
            </select>
          </div>

          {/* Navigate */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignSelf: 'flex-end' }}>
            <motion.button
              className="btn btn-ghost btn-sm"
              onClick={() => navigateDate('prev')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!allDates.length}
            >
              <ChevronLeft size={16} /> Older
            </motion.button>
            <motion.button
              className="btn btn-ghost btn-sm"
              onClick={() => navigateDate('next')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!allDates.length}
            >
              Newer <ChevronRight size={16} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Selected Date Detail */}
      {selectedDate && history[selectedDate] && (
        <motion.div
          className="glass-card"
          style={{ padding: 22, marginBottom: 20, borderColor: 'rgba(59,130,246,0.2)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} style={{ color: 'var(--primary-400)' }} />
              {formatDate(selectedDate)} — {getDayName(selectedDate)}
            </h3>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--success-400)' }}>
                ✓ {Object.values(history[selectedDate]).filter((v) => (typeof v === 'string' ? v : v.status) === 'present').length} Present
              </span>
              <span style={{ color: 'var(--danger-400)' }}>
                ✗ {Object.values(history[selectedDate]).filter((v) => (typeof v === 'string' ? v : v.status) === 'absent').length} Absent
              </span>
              <span style={{ color: 'var(--holiday-400)' }}>
                📅 {Object.values(history[selectedDate]).filter((v) => (typeof v === 'string' ? v : v.status) === 'holiday').length} Holiday
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(history[selectedDate]).map(([subId, rawStatus]) => {
              const status = typeof rawStatus === 'string' ? rawStatus : rawStatus?.status;
              const sub = subjects.find((s) => s.id === subId);
              if (!sub) return null;
              if (filterSubject !== 'all' && filterSubject !== subId) return null;

              return (
                <div key={subId} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: status === 'present' ? 'rgba(34,197,94,0.06)' : status === 'absent' ? 'rgba(239,68,68,0.06)' : 'rgba(20,184,166,0.06)',
                  border: `1px solid ${status === 'present' ? 'rgba(34,197,94,0.15)' : status === 'absent' ? 'rgba(239,68,68,0.15)' : 'rgba(20,184,166,0.15)'}`,
                  flexWrap: 'wrap', gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sub.color }} />
                    <div>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{sub.name}</span>
                      <span className="badge badge-info" style={{ marginLeft: 8, fontSize: '0.65rem' }}>{sub.code}</span>
                      {sub.teacher && (
                        <div className="teacher-tag" style={{ marginTop: 2 }}>
                          <UserCircle size={11} /> <span>{sub.teacher}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(() => {
                      const dayName = getDayName(selectedDate);
                      const pKey = `${selectedDate}_${subId}`;
                      const defaultP = typeof rawStatus === 'object' && rawStatus.periods ? rawStatus.periods : getPeriodsForDay(sub, dayName);
                      const p = customPeriods[pKey] ?? defaultP;
                      return (
                        <span className="badge badge-day" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', marginRight: 10 }}>
                          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }} onClick={() => setCustomPeriods(prev => ({...prev, [pKey]: Math.max(1, p - 1)}))}>-</button>
                          <span>{p} period{p > 1 ? 's' : ''}</span>
                          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }} onClick={() => setCustomPeriods(prev => ({...prev, [pKey]: p + 1}))}>+</button>
                        </span>
                      );
                    })()}
                    <div className="attendance-toggle">
                      <motion.button
                        className={`att-present ${status === 'present' ? 'active' : ''}`}
                        onClick={() => handleMark(subId, 'present', selectedDate)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Check size={12} /> P
                      </motion.button>
                      <motion.button
                        className={`att-absent ${status === 'absent' ? 'active' : ''}`}
                        onClick={() => handleMark(subId, 'absent', selectedDate)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X size={12} /> A
                      </motion.button>
                      <motion.button
                        className={`att-holiday ${status === 'holiday' ? 'active' : ''}`}
                        onClick={() => handleMark(subId, 'holiday', selectedDate)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CalendarOff size={12} /> H
                      </motion.button>
                    </div>
                    <motion.button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleUndo(subId, selectedDate)}
                      title="Remove record"
                      style={{ color: 'var(--text-tertiary)' }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Undo2 size={14} />
                    </motion.button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* History List */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} style={{ color: 'var(--accent-400)' }} />
            All Records ({filteredDates.length} days)
          </h3>
        </div>

        {filteredDates.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <History size={40} />
            <p>No attendance history found.</p>
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table className="data-table" id="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Subjects</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Holiday</th>
                  <th>Day %</th>
                </tr>
              </thead>
              <tbody>
                {filteredDates.map((dateKey) => {
                  const dayData = history[dateKey];
                  const entries = Object.values(dayData);
                  const present = entries.filter((v) => (typeof v === 'string' ? v : v.status) === 'present').length;
                  const absent = entries.filter((v) => (typeof v === 'string' ? v : v.status) === 'absent').length;
                  const holiday = entries.filter((v) => (typeof v === 'string' ? v : v.status) === 'holiday').length;
                  const effective = present + absent;
                  const pct = effective > 0 ? Math.round((present / effective) * 100) : 0;
                  const isSelected = dateKey === selectedDate;

                  return (
                    <tr
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(59,130,246,0.08)' : undefined,
                      }}
                    >
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{formatDate(dateKey)}</td>
                      <td>{getDayName(dateKey)}</td>
                      <td>{entries.length}</td>
                      <td style={{ color: 'var(--success-400)', fontWeight: 600 }}>{present}</td>
                      <td style={{ color: 'var(--danger-400)', fontWeight: 600 }}>{absent}</td>
                      <td style={{ color: 'var(--holiday-400)', fontWeight: 600 }}>{holiday}</td>
                      <td>
                        <span className={getPctClass(pct)} style={{ fontWeight: 700 }}>{effective > 0 ? `${pct}%` : '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
