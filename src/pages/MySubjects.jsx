import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit3, Trash2, X, BookOpen, TrendingDown, TrendingUp,
  UserCircle, Clock, Check, Calendar, ChevronLeft, ChevronRight, Undo2, Sparkles,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { DAYS_OF_WEEK, getPeriodsForDay, getTotalPeriodsPerWeek } from '../utils/sampleData';
import {
  generateId, getSubjectPercentage, classesCanMiss, classesNeeded,
  getPctClass, getProgressClass, getDaysInMonth, getFirstDayOfMonth, formatDate,
} from '../utils/helpers';

const SUBJECT_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#eab308', '#ef4444', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MySubjects() {
  const { subjects, addSubject, updateSubject, deleteSubject, history, markPresent, markAbsent, markHoliday, undoMark } = useAttendance();
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [calendarSubId, setCalendarSubId] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    name: '', code: '', teacher: '', days: [],
    periodsPerDay: {}, totalClasses: 0, attended: 0, color: '',
  });

  const openAdd = () => {
    setEditingSub(null);
    setFormData({ name: '', code: '', teacher: '', days: [], periodsPerDay: {}, totalClasses: 0, attended: 0, color: '' });
    setShowModal(true);
  };

  const openEdit = (sub) => {
    setEditingSub(sub);
    const ppd = typeof sub.periodsPerDay === 'object' && sub.periodsPerDay !== null
      ? { ...sub.periodsPerDay }
      : {};
    // If old format (number), convert
    if (typeof sub.periodsPerDay === 'number') {
      (sub.days || []).forEach((d) => { ppd[d] = sub.periodsPerDay; });
    }
    setFormData({
      name: sub.name, code: sub.code, teacher: sub.teacher || '',
      days: sub.days || [], periodsPerDay: ppd,
      totalClasses: sub.totalClasses, attended: sub.attended, color: sub.color || '',
    });
    setShowModal(true);
  };

  const toggleDay = (day) => {
    setFormData((prev) => {
      const newDays = prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day];
      const newPpd = { ...prev.periodsPerDay };
      if (!prev.days.includes(day)) { newPpd[day] = 1; }
      else { delete newPpd[day]; }
      return { ...prev, days: newDays, periodsPerDay: newPpd };
    });
  };

  const setDayPeriods = (day, value) => {
    setFormData((prev) => ({
      ...prev,
      periodsPerDay: { ...prev.periodsPerDay, [day]: Math.max(1, Number(value) || 1) },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;
    const payload = {
      name: formData.name, code: formData.code, teacher: formData.teacher,
      days: formData.days, periodsPerDay: formData.periodsPerDay,
      totalClasses: Number(formData.totalClasses), attended: Number(formData.attended),
    };
    if (editingSub) {
      if (formData.color && formData.color !== editingSub.color) payload.color = formData.color;
      updateSubject(editingSub.id, payload);
    } else {
      addSubject({
        id: generateId(), ...payload,
        color: formData.color || SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this subject?')) deleteSubject(id);
  };

  // Confetti burst state
  const [confettiSubId, setConfettiSubId] = useState(null);

  const triggerConfetti = useCallback((subId) => {
    setConfettiSubId(subId);
    setTimeout(() => setConfettiSubId(null), 800);
  }, []);

  const quickIncrement = (subId, field) => {
    const sub = subjects.find((s) => s.id === subId);
    if (!sub) return;
    if (field === 'attended') {
      updateSubject(subId, { attended: sub.attended + 1, totalClasses: sub.totalClasses + 1 });
      triggerConfetti(subId);
    }
    else if (field === 'absent') updateSubject(subId, { totalClasses: sub.totalClasses + 1 });
  };

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.9, filter: 'blur(4px)', transition: { duration: 0.2 } },
  };

  // ---- Subject Calendar Logic ----
  const calendarSub = subjects.find((s) => s.id === calendarSubId);
  const calDays = useMemo(() => {
    if (!calendarSubId) return [];
    const dim = getDaysInMonth(calYear, calMonth);
    const fd = getFirstDayOfMonth(calYear, calMonth);
    const days = [];
    for (let i = 0; i < fd; i++) days.push(null);
    for (let d = 1; d <= dim; d++) {
      const m = String(calMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${calYear}-${m}-${dayStr}`;
      const rawStatus = history[dateKey]?.[calendarSubId] || null;
      const status = typeof rawStatus === 'string' ? rawStatus : rawStatus?.status;
      days.push({ day: d, dateKey, status });
    }
    return days;
  }, [calendarSubId, calMonth, calYear, history]);

  const calStats = useMemo(() => {
    if (!calendarSubId) return { present: 0, absent: 0, holiday: 0 };
    let present = 0, absent = 0, holiday = 0;
    Object.values(history).forEach((dayData) => {
      const rawS = dayData[calendarSubId];
      const s = typeof rawS === 'string' ? rawS : rawS?.status;
      if (s === 'present') present++;
      else if (s === 'absent') absent++;
      else if (s === 'holiday') holiday++;
    });
    return { present, absent, holiday };
  }, [calendarSubId, history]);

  const cycleCalStatus = (dateKey) => {
    const rawCurrent = history[dateKey]?.[calendarSubId] || null;
    const current = typeof rawCurrent === 'string' ? rawCurrent : rawCurrent?.status;
    if (!current) markPresent(calendarSubId, dateKey);
    else if (current === 'present') { undoMark(calendarSubId, dateKey); markAbsent(calendarSubId, dateKey); }
    else if (current === 'absent') { undoMark(calendarSubId, dateKey); markHoliday(calendarSubId, dateKey); }
    else { undoMark(calendarSubId, dateKey); }
  };

  const getStatusColor = (status) => {
    if (status === 'present') return 'rgba(34,197,94,0.3)';
    if (status === 'absent') return 'rgba(239,68,68,0.3)';
    if (status === 'holiday') return 'rgba(20,184,166,0.3)';
    return 'transparent';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1>My Subjects</h1>
          <p>Manage your subjects and track attendance for each one.</p>
        </div>
        <motion.button className="btn btn-primary" onClick={openAdd} id="add-subject-btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Plus size={16} /> Add Subject
        </motion.button>
      </div>

      {/* Subject Cards */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {subjects.map((sub, idx) => {
            const pct = getSubjectPercentage(sub);
            const canMiss = classesCanMiss(sub.attended, sub.totalClasses);
            const needed = classesNeeded(sub.attended, sub.totalClasses);
            const totalPeriods = getTotalPeriodsPerWeek(sub);

            return (
              <motion.div key={sub.id} className="glass-card" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}
                variants={cardVariants}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ borderColor: sub.color + '40', y: -4, boxShadow: `0 12px 40px rgba(0,0,0,0.15), 0 0 25px ${sub.color}15` }} layout
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: sub.color + '20', border: `1px solid ${sub.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={20} style={{ color: sub.color }} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sub.name}</h4>
                      <span className="badge badge-info" style={{ marginTop: 4 }}>{sub.code}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <motion.button className="btn btn-ghost btn-icon" onClick={() => { setCalendarSubId(sub.id); setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); }} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} title="Subject Calendar">
                      <Calendar size={14} style={{ color: 'var(--holiday-400)' }} />
                    </motion.button>
                    <motion.button className="btn btn-ghost btn-icon" onClick={() => openEdit(sub)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                      <Edit3 size={14} style={{ color: 'var(--primary-400)' }} />
                    </motion.button>
                    <motion.button className="btn btn-ghost btn-icon" onClick={() => handleDelete(sub.id)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                      <Trash2 size={14} style={{ color: 'var(--danger-400)' }} />
                    </motion.button>
                  </div>
                </div>

                {sub.teacher && (<div className="teacher-tag" style={{ marginBottom: 10 }}><UserCircle size={14} /><span>{sub.teacher}</span></div>)}

                {sub.days && sub.days.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
                    {sub.days.map((day) => (
                      <span key={day} className="badge badge-day">
                        {day.slice(0, 3)}{getPeriodsForDay(sub, day) > 1 ? ` ×${getPeriodsForDay(sub, day)}` : ''}
                      </span>
                    ))}
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4 }}>
                      <Clock size={11} /> {totalPeriods} periods/week
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span className={getPctClass(pct)} style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{pct}%</span>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className={`progress-fill ${getProgressClass(pct)}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  <span>📚 Total: <strong style={{ color: 'var(--text-secondary)' }}>{sub.totalClasses}</strong></span>
                  <span>✓ Attended: <strong style={{ color: 'var(--success-400)' }}>{sub.attended}</strong></span>
                  <span>✗ Missed: <strong style={{ color: 'var(--danger-400)' }}>{sub.totalClasses - sub.attended}</strong></span>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: pct >= 75 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${pct >= 75 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', marginBottom: 14 }}>
                  {pct >= 75 ? (
                    <><TrendingUp size={16} style={{ color: 'var(--success-400)' }} /><span style={{ color: 'var(--success-400)', fontWeight: 600 }}>Can miss {canMiss} more class{canMiss !== 1 ? 'es' : ''}</span></>
                  ) : (
                    <><TrendingDown size={16} style={{ color: 'var(--danger-400)' }} /><span style={{ color: 'var(--danger-400)', fontWeight: 600 }}>Attend {needed} consecutive class{needed !== 1 ? 'es' : ''} to reach 75%</span></>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
                  <motion.button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => quickIncrement(sub.id, 'attended')} whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }} whileTap={{ scale: 0.93 }}>
                    <Check size={14} /> Attended
                  </motion.button>
                  <motion.button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => quickIncrement(sub.id, 'absent')} whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239,68,68,0.3)' }} whileTap={{ scale: 0.93 }}>
                    <X size={14} /> Absent
                  </motion.button>
                  {/* Confetti burst effect */}
                  <AnimatePresence>
                    {confettiSubId === sub.id && (
                      <>
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={`confetti-${i}`}
                            style={{
                              position: 'absolute', width: 6, height: 6, borderRadius: i % 2 === 0 ? '50%' : '2px',
                              background: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#ef4444'][i],
                              left: '25%', top: '50%', zIndex: 10,
                            }}
                            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                            animate={{
                              scale: [0, 1.5, 0.8],
                              x: (Math.cos((i * Math.PI) / 4) * 50) + (Math.random() * 20 - 10),
                              y: (Math.sin((i * Math.PI) / 4) * 40) + (Math.random() * 20 - 10),
                              opacity: [1, 1, 0],
                              rotate: Math.random() * 360,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {subjects.length === 0 && (
        <div className="glass-card empty-state" style={{ padding: 60 }}>
          <BookOpen size={48} />
          <p>No subjects added. Click "Add Subject" to get started.</p>
        </div>
      )}

      {/* ====== Add/Edit Modal ====== */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={20} style={{ color: 'var(--primary-400)' }} />
                  {editingSub ? 'Edit Subject' : 'Add New Subject'}
                </h2>
                <motion.button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
                  <X size={18} />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Subject Name</label>
                    <input type="text" className="form-input" placeholder="e.g. Compiler Design" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required id="subject-name-input" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Subject Code</label>
                      <input type="text" className="form-input" placeholder="e.g. CS401" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required id="subject-code-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teacher Name</label>
                      <input type="text" className="form-input" placeholder="e.g. Dr. Sharma" value={formData.teacher} onChange={(e) => setFormData({ ...formData, teacher: e.target.value })} id="teacher-name-input" />
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div className="form-group">
                    <label className="form-label">Subject Color</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {SUBJECT_COLORS.map((c) => (
                        <motion.button type="button" key={c} onClick={() => setFormData({ ...formData, color: c })}
                          style={{ width: 28, height: 28, borderRadius: 6, background: c, border: formData.color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', position: 'relative' }}
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        >
                          {formData.color === c && <Check size={14} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />}
                        </motion.button>
                      ))}
                      <input type="color" value={formData.color || '#3b82f6'} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                        title="Pick custom color"
                      />
                    </div>
                  </div>

                  {/* Days + Per-Day Periods */}
                  <div className="form-group">
                    <label className="form-label">Days & Periods Per Day</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = formData.days.includes(day);
                        return (
                          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label className={`day-checkbox ${isSelected ? 'selected' : ''}`} style={{ flex: '1 1 auto', margin: 0 }}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleDay(day)} />
                              <div className="day-check-indicator">
                                {isSelected && <Check size={12} color="white" />}
                              </div>
                              <span>{day}</span>
                            </label>
                            {isSelected && (
                              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                              >
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Periods:</span>
                                <input type="number" className="form-input" min="1" max="6"
                                  value={formData.periodsPerDay[day] || 1}
                                  onChange={(e) => setDayPeriods(day, e.target.value)}
                                  style={{ width: 56, padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}
                                />
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Total Classes</label>
                      <input type="number" className="form-input" min="0" value={formData.totalClasses} onChange={(e) => setFormData({ ...formData, totalClasses: e.target.value })} id="total-classes-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Classes Attended</label>
                      <input type="number" className="form-input" min="0" value={formData.attended} onChange={(e) => setFormData({ ...formData, attended: e.target.value })} id="attended-classes-input" />
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <motion.button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Cancel</motion.button>
                  <motion.button type="submit" className="btn btn-primary" id="save-subject-btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>{editingSub ? 'Update' : 'Add Subject'}</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== Subject Calendar Modal ====== */}
      <AnimatePresence>
        {calendarSubId && calendarSub && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCalendarSubId(null)}>
            <motion.div className="modal" style={{ maxWidth: 480 }} initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: calendarSub.color }} />
                  {calendarSub.code} — Calendar
                </h2>
                <motion.button className="btn btn-ghost btn-icon" onClick={() => setCalendarSubId(null)} whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
                  <X size={18} />
                </motion.button>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.08)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success-400)' }}>{calStats.present}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Present</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--danger-400)' }}>{calStats.absent}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Absent</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', background: 'rgba(20,184,166,0.08)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--holiday-400)' }}>{calStats.holiday}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Holiday</div>
                </div>
              </div>

              {/* Month Nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <motion.button className="btn btn-ghost btn-sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ChevronLeft size={16} /></motion.button>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{MONTH_NAMES[calMonth]} {calYear}</span>
                <motion.button className="btn btn-ghost btn-sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ChevronRight size={16} /></motion.button>
              </div>

              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 0' }}>{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {calDays.map((cell, idx) => {
                  if (!cell) return <div key={`e-${idx}`} />;
                  const today = new Date();
                  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const isToday = cell.dateKey === todayKey;
                  return (
                    <motion.div key={cell.dateKey} onClick={() => cycleCalStatus(cell.dateKey)}
                      style={{
                        aspectRatio: '1', borderRadius: 6, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: getStatusColor(cell.status),
                        border: isToday ? `2px solid ${calendarSub.color}` : '1px solid transparent',
                        transition: 'all 0.15s ease', fontSize: '0.82rem',
                      }}
                      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                    >
                      <span style={{ fontWeight: isToday ? 700 : 500 }}>{cell.day}</span>
                      {cell.status && (
                        <span style={{ fontSize: '0.5rem', marginTop: 1 }}>
                          {cell.status === 'present' ? '✓' : cell.status === 'absent' ? '✗' : '📅'}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                <span>Click to cycle: None → ✓ → ✗ → 📅 → None</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
