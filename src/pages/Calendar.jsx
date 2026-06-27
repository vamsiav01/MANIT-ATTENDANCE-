import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { getDaysInMonth, getFirstDayOfMonth, formatDate } from '../utils/helpers';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarPage() {
  const { subjects, history, schedule, markPresent, markAbsent, markHoliday, undoMark } = useAttendance();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [periodsOverride, setPeriodsOverride] = useState({});
  const detailRef = useRef(null);


  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const m = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${m}-${dayStr}`;
      const dayHistory = history[dateKey];
      let present = 0, absent = 0, holiday = 0, total = 0;
      if (dayHistory) {
        Object.values(dayHistory).forEach((rawStatus) => {
          total++;
          const status = typeof rawStatus === 'string' ? rawStatus : rawStatus?.status;
          if (status === 'present') present++;
          else if (status === 'absent') absent++;
          else if (status === 'holiday') holiday++;
        });
      }
      // Exclude holidays from percentage calculation
      const nonHoliday = present + absent;
      const pct = nonHoliday > 0 ? Math.round((present / nonHoliday) * 100) : (holiday > 0 ? -1 : null);
      days.push({ day: d, dateKey, present, absent, holiday, total, pct });
    }
    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDay, history]);

  const selectedData = useMemo(() => {
    if (!selectedDate) return null;
    
    // Parse selectedDate (YYYY-MM-DD) carefully
    const [y, m, d] = selectedDate.split('-');
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeekName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    const dayHistory = history[selectedDate] || {};
    const scheduledIds = schedule[dayOfWeekName] || [];
    
    // Merge scheduled subjects + any extra subjects marked that day
    const allIds = Array.from(new Set([...scheduledIds, ...Object.keys(dayHistory)]));
    
    const entries = allIds.map((subId) => {
      const sub = subjects.find((s) => s.id === subId);
      if (!sub) return null;
      
      const rawStatus = dayHistory[subId];
      const status = rawStatus 
        ? (typeof rawStatus === 'string' ? rawStatus : rawStatus.status) 
        : 'unmarked';
        
      let periods = 1;
      if (rawStatus && typeof rawStatus === 'object') {
        periods = rawStatus.periods || 1;
      } else {
        const ppd = sub.periodsPerDay;
        if (typeof ppd === 'number') periods = ppd;
        else if (ppd && typeof ppd === 'object' && ppd[dayOfWeekName]) periods = ppd[dayOfWeekName];
      }
      
      return { subId, status, periods, subject: sub };
    }).filter(Boolean);

    return {
      entries,
      present: entries.filter((e) => e.status === 'present').length,
      absent: entries.filter((e) => e.status === 'absent').length,
      holiday: entries.filter((e) => e.status === 'holiday').length,
      unmarked: entries.filter((e) => e.status === 'unmarked').length,
    };
  }, [selectedDate, history, subjects, schedule]);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const getColor = (pct) => {
    if (pct === null) return 'transparent';
    if (pct === -1) return 'rgba(20,184,166,0.2)'; // All holiday
    if (pct >= 80) return 'rgba(34,197,94,0.25)';
    if (pct >= 50) return 'rgba(234,179,8,0.25)';
    return 'rgba(239,68,68,0.25)';
  };
  const getBorder = (pct) => {
    if (pct === null) return '1px solid transparent';
    if (pct === -1) return '1px solid rgba(20,184,166,0.3)';
    if (pct >= 80) return '1px solid rgba(34,197,94,0.35)';
    if (pct >= 50) return '1px solid rgba(234,179,8,0.35)';
    return '1px solid rgba(239,68,68,0.35)';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <h1>Calendar</h1>
        <p>Your attendance history at a glance. Click any day to see details.</p>
      </div>

      <div className="glass-card calendar-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <motion.button className="btn btn-ghost" onClick={prevMonth} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ChevronLeft size={20} />
          </motion.button>
          <h2 className="calendar-header" style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarIcon size={20} style={{ color: 'var(--primary-400)' }} />
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <motion.button className="btn btn-ghost" onClick={nextMonth} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ChevronRight size={20} />
          </motion.button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
          {DAY_NAMES.map((day) => (
            <div key={day} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 0' }}>{day}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {calendarDays.map((cell, idx) => {
            if (!cell.day) return <div key={`e-${idx}`} />;
            const isToday = cell.dateKey === todayKey;
            const isSelected = cell.dateKey === selectedDate;
            const isSunday = (idx % 7) === 0;

            return (
              <motion.div
                key={cell.dateKey}
                onClick={() => {
                  setSelectedDate(cell.dateKey);
                  setPeriodsOverride({});
                  // Auto-scroll to detail panel on mobile
                  if (window.innerWidth < 768) {
                    setTimeout(() => {
                      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(59,130,246,0.2)' : getColor(cell.pct),
                  border: isSelected ? '2px solid var(--primary-500)' : isToday ? '2px solid var(--primary-400)' : getBorder(cell.pct),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  opacity: isSunday ? 0.4 : 1, position: 'relative',
                }}
              >
                <span className="calendar-day-num" style={{ fontSize: '0.95rem', fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--primary-400)' : 'var(--text-primary)' }}>{cell.day}</span>
                {cell.total > 0 && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                    {cell.present > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success-400)' }} />}
                    {cell.absent > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger-400)' }} />}
                    {cell.holiday > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--holiday-400)' }} />}
                  </div>
                )}
                {isToday && <div style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: '50%', background: 'var(--primary-400)' }} />}
              </motion.div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { color: 'rgba(34,197,94,0.4)', label: 'All Present' },
            { color: 'rgba(234,179,8,0.4)', label: 'Mixed' },
            { color: 'rgba(239,68,68,0.4)', label: 'Missed Classes' },
            { color: 'rgba(20,184,166,0.4)', label: 'Holiday' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Details */}
      <AnimatePresence>
        {selectedDate && selectedData && (
          <motion.div ref={detailRef} className="glass-card" style={{ padding: 24, marginTop: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>📅 {formatDate(selectedDate)}</h3>
              <motion.button className="btn btn-ghost btn-icon" onClick={() => setSelectedDate(null)} whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
                <X size={16} />
              </motion.button>
            </div>

            {selectedData.entries.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No classes scheduled or recorded for this day.</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-400)' }}>{selectedData.present}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Present</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger-400)' }}>{selectedData.absent}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Absent</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--holiday-400)' }}>{selectedData.holiday}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Holiday</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>{selectedData.unmarked}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unmarked</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedData.entries.map((entry) => (
                    <motion.div key={entry.subId} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)',
                    }}
                    whileHover={{ x: 4 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.subject.color }} />
                        <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{entry.subject.name}</span>
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{entry.subject.code}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '2px 4px', marginRight: 4 }} title="Periods">
                          <button className="btn btn-ghost btn-sm" style={{ padding: 2, height: 22, width: 22, minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPeriodsOverride(prev => ({...prev, [entry.subId]: Math.max(1, (prev[entry.subId] !== undefined ? prev[entry.subId] : entry.periods) - 1)}))}>-</button>
                          <span style={{ fontSize: '0.8rem', width: 14, textAlign: 'center', fontWeight: 700 }}>{periodsOverride[entry.subId] !== undefined ? periodsOverride[entry.subId] : entry.periods}</span>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 2, height: 22, width: 22, minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPeriodsOverride(prev => ({...prev, [entry.subId]: (prev[entry.subId] !== undefined ? prev[entry.subId] : entry.periods) + 1}))}>+</button>
                        </div>

                        <button
                          onClick={() => { const p = periodsOverride[entry.subId] !== undefined ? periodsOverride[entry.subId] : entry.periods; entry.status === 'present' ? undoMark(entry.subId, selectedDate) : markPresent(entry.subId, selectedDate, p); }}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            background: entry.status === 'present' ? 'var(--success-500)' : 'rgba(34,197,94,0.1)',
                            color: entry.status === 'present' ? 'white' : 'var(--success-400)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {entry.status === 'present' ? '✓ Present' : 'Present'}
                        </button>
                        <button
                          onClick={() => { const p = periodsOverride[entry.subId] !== undefined ? periodsOverride[entry.subId] : entry.periods; entry.status === 'absent' ? undoMark(entry.subId, selectedDate) : markAbsent(entry.subId, selectedDate, p); }}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            background: entry.status === 'absent' ? 'var(--danger-500)' : 'rgba(239,68,68,0.1)',
                            color: entry.status === 'absent' ? 'white' : 'var(--danger-400)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {entry.status === 'absent' ? '✗ Absent' : 'Absent'}
                        </button>
                        <button
                          onClick={() => entry.status === 'holiday' ? undoMark(entry.subId, selectedDate) : markHoliday(entry.subId, selectedDate)}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            background: entry.status === 'holiday' ? 'var(--holiday-500)' : 'rgba(20,184,166,0.1)',
                            color: entry.status === 'holiday' ? 'white' : 'var(--holiday-400)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {entry.status === 'holiday' ? '📅 Holiday' : 'Holiday'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .calendar-card {
          padding: 24px;
        }
        @media (max-width: 768px) {
          .calendar-card {
            padding: 14px 10px;
          }
          .calendar-day-num {
            font-size: 0.75rem !important;
          }
          .calendar-header h2 {
            font-size: 0.95rem !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
