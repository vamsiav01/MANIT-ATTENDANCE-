import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, X, GripVertical, CalendarClock, BookOpen } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { DAYS_OF_WEEK, getPeriodsForDay, getTotalPeriodsPerWeek } from '../utils/sampleData';

const DAY_COLORS = {
  Monday: '#3b82f6',
  Tuesday: '#8b5cf6',
  Wednesday: '#22c55e',
  Thursday: '#f97316',
  Friday: '#eab308',
  Saturday: '#ef4444',
};

export default function Timetable() {
  const { subjects, schedule, updateSchedule } = useAttendance();
  const [editingDay, setEditingDay] = useState(null);

  const getSubjectById = (id) => subjects.find((s) => s.id === id);

  const removeFromDay = (day, subId) => {
    const updated = (schedule[day] || []).filter((id) => id !== subId);
    updateSchedule(day, updated);
  };

  const addToDay = (day, subId) => {
    const current = schedule[day] || [];
    if (!current.includes(subId)) {
      updateSchedule(day, [...current, subId]);
    }
    setEditingDay(null);
  };

  const availableForDay = (day) => {
    const current = schedule[day] || [];
    return subjects.filter((s) => !current.includes(s.id));
  };

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <h1>Weekly Timetable</h1>
        <p>Manage your weekly class schedule. Add or remove subjects from each day.</p>
      </div>

      {/* Timetable Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DAYS_OF_WEEK.map((day) => {
          const daySchedule = schedule[day] || [];
          const isToday = day === todayName;
          const dayColor = DAY_COLORS[day];

          return (
            <motion.div
              key={day}
              className="glass-card"
              style={{
                padding: '16px 20px',
                borderColor: isToday ? dayColor + '40' : 'var(--border-primary)',
                position: 'relative',
                overflow: 'visible',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ borderColor: dayColor + '30' }}
            >
              {/* Day Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: daySchedule.length > 0 ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: dayColor + '18', border: `1px solid ${dayColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: dayColor, fontWeight: 800, fontSize: '0.78rem',
                  }}>
                    {day.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {day}
                      {isToday && (
                        <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>TODAY</span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {daySchedule.length} class{daySchedule.length !== 1 ? 'es' : ''}
                      {daySchedule.reduce((sum, id) => {
                        const sub = getSubjectById(id);
                        return sum + getPeriodsForDay(sub || {}, day);
                      }, 0) > daySchedule.length && (
                        ` • ${daySchedule.reduce((sum, id) => {
                          const sub = getSubjectById(id);
                          return sum + getPeriodsForDay(sub || {}, day);
                        }, 0)} periods`
                      )}
                    </span>
                  </div>
                </div>

                <motion.button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingDay(editingDay === day ? null : day)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ color: dayColor }}
                >
                  <Plus size={14} /> Add
                </motion.button>
              </div>

              {/* Subject Pills */}
              {daySchedule.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {daySchedule.map((subId) => {
                    const sub = getSubjectById(subId);
                    if (!sub) return null;
                    return (
                      <motion.div
                        key={subId}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                          background: sub.color + '12', border: `1px solid ${sub.color}25`,
                          fontSize: '0.82rem',
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: sub.color }} />
                        <span style={{ fontWeight: 500 }}>{sub.code}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>{sub.name}</span>
                        {getPeriodsForDay(sub, day) > 1 && (
                          <span className="badge badge-day" style={{ fontSize: '0.6rem' }}>×{getPeriodsForDay(sub, day)}</span>
                        )}
                        {sub.teacher && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            — {sub.teacher}
                          </span>
                        )}
                        <button
                          onClick={() => removeFromDay(day, subId)}
                          style={{
                            background: 'transparent', color: 'var(--text-tertiary)',
                            marginLeft: 2, padding: 2, borderRadius: '50%',
                            display: 'flex', cursor: 'pointer',
                          }}
                          title={`Remove ${sub.code} from ${day}`}
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {daySchedule.length === 0 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 4 }}>
                  No classes scheduled
                </p>
              )}

              {/* Add Subject Dropdown */}
              <AnimatePresence>
                {editingDay === day && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: 12, overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: 12, borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
                    }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        Select a subject to add:
                      </p>
                      {availableForDay(day).length === 0 ? (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>All subjects are already added to {day}.</p>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {availableForDay(day).map((sub) => (
                            <motion.button
                              key={sub.id}
                              onClick={() => addToDay(day, sub.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                                background: sub.color + '10', border: `1px solid ${sub.color}20`,
                                color: 'var(--text-secondary)', fontSize: '0.82rem',
                                cursor: 'pointer', fontWeight: 500,
                              }}
                              whileHover={{ scale: 1.03, borderColor: sub.color + '50' }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: sub.color }} />
                              {sub.code} — {sub.name}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <motion.div
        className="glass-card"
        style={{ padding: 20, marginTop: 20 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarClock size={16} style={{ color: 'var(--accent-400)' }} />
          Weekly Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {subjects.map((sub) => {
            const daysWithSub = DAYS_OF_WEEK.filter((day) => (schedule[day] || []).includes(sub.id));
            const totalPeriods = getTotalPeriodsPerWeek(sub);

            return (
              <div key={sub.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-primary)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: sub.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{sub.code}</span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                    {daysWithSub.length} day{daysWithSub.length !== 1 ? 's' : ''} • {totalPeriods} period{totalPeriods !== 1 ? 's' : ''}/week
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
