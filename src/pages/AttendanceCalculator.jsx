import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Target, Sparkles, AlertTriangle, RotateCcw,
  BookOpen, ArrowRight, TrendingUp, TrendingDown, CheckCircle2,
  XCircle, MinusCircle, PlusCircle, Info,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import {
  getSubjectPercentage, classesCanMiss, classesNeeded,
  getPctClass, getProgressClass, getOverallPercentage,
} from '../utils/helpers';
import Confetti from 'react-confetti';

const fadeIn = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

export default function AttendanceCalculator() {
  const { subjects, schedule } = useAttendance();
  const [subjectTargetPct, setSubjectTargetPct] = useState(null);
  const [overallTargetPct, setOverallTargetPct] = useState(75);
  const [simulations, setSimulations] = useState({});
  const [tab, setTab] = useState('standard');
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');

  const calculateVacation = () => {
    if (!vacationStart || !vacationEnd) return;
    const start = new Date(vacationStart + 'T00:00:00');
    const end = new Date(vacationEnd + 'T00:00:00');
    if (end < start) return alert("End date must be after start date");

    const newSim = {};
    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let current = new Date(start);
    while (current <= end) {
      const dayName = daysMap[current.getDay()];
      const dailySubs = schedule[dayName] || [];
      
      dailySubs.forEach(subId => {
        const sub = subjects.find(s => s.id === subId);
        if (sub) {
          const periods = typeof sub.periodsPerDay === 'object' ? (sub.periodsPerDay[dayName] || 1) : (sub.periodsPerDay || 1);
          if (!newSim[subId]) newSim[subId] = { futureAttend: 0, futureMiss: 0 };
          newSim[subId].futureMiss += periods;
        }
      });
      current.setDate(current.getDate() + 1);
    }
    setSimulations(newSim);
  };

  const getSim = (subId) => simulations[subId] || { futureAttend: 0, futureMiss: 0 };

  const updateSim = (subId, field, delta) => {
    setSimulations((prev) => {
      const old = prev[subId] || { futureAttend: 0, futureMiss: 0 };
      return { ...prev, [subId]: { ...old, [field]: Math.max(0, (old[field] || 0) + delta) } };
    });
  };

  const setSimValue = (subId, field, value) => {
    setSimulations((prev) => ({
      ...prev,
      [subId]: { ...getSim(subId), [field]: Math.max(0, Number(value) || 0) },
    }));
  };

  const resetAll = () => setSimulations({});
  const resetOne = (subId) => setSimulations((prev) => { const n = { ...prev }; delete n[subId]; return n; });

  const results = useMemo(() => {
    return subjects.map((sub) => {
      const sim = getSim(sub.id);
      const activeTarget = subjectTargetPct !== null ? subjectTargetPct : (sub.targetPct !== undefined ? sub.targetPct : 75);
      const newAttended = sub.attended + sim.futureAttend;
      const newTotal = sub.totalClasses + sim.futureAttend + sim.futureMiss;
      const currentPct = getSubjectPercentage(sub);
      const newPct = newTotal > 0 ? Math.round((newAttended / newTotal) * 100) : 0;
      const meetsTarget = newPct >= activeTarget;
      const canMiss = classesCanMiss(newAttended, newTotal, activeTarget);
      const need = classesNeeded(newAttended, newTotal, activeTarget);
      return { ...sub, sim, currentPct, newAttended, newTotal, newPct, meetsTarget, canMiss, need, change: newPct - currentPct, activeTarget };
    });
  }, [subjects, simulations, subjectTargetPct]);

  const currentOverall = getOverallPercentage(subjects);
  const simulatedOverall = useMemo(() => {
    let a = 0, t = 0;
    results.forEach((r) => { a += r.newAttended; t += r.newTotal; });
    return t > 0 ? Math.round((a / t) * 100) : 0;
  }, [results]);

  const meetingCount = results.filter((r) => r.meetsTarget).length;
  const hasSimulations = Object.keys(simulations).length > 0;

  const overallReq = useMemo(() => {
    let a = 0, t = 0;
    results.forEach((r) => { a += r.newAttended; t += r.newTotal; });
    return classesNeeded(a, t, overallTargetPct);
  }, [results, overallTargetPct]);

  const [showConfetti, setShowConfetti] = useState(false);

  React.useEffect(() => {
    if (hasSimulations && simulatedOverall >= overallTargetPct && simulatedOverall > currentOverall) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [simulatedOverall, overallTargetPct, hasSimulations, currentOverall]);

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />}
      {/* ===== HEADER ===== */}
      <motion.div variants={fadeIn} className="calc-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              boxShadow: '0 0 20px rgba(59,130,246,0.2)', flexShrink: 0,
            }}>
              <Calculator size={20} />
            </div>
            Attendance Calculator
          </h1>
          <p>"What if" simulator — plan future classes and see your projected attendance.</p>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className={`btn ${tab === 'standard' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('standard')} style={{ fontSize: '0.8rem' }}>Standard Mode</button>
            <button className={`btn ${tab === 'vacation' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setTab('vacation'); setSimulations({}); }} style={{ fontSize: '0.8rem' }}>🏖️ Vacation Mode</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {hasSimulations && (
            <motion.button className="btn btn-outline" onClick={resetAll}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <RotateCcw size={14} /> Reset
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ===== VACATION PANEL ===== */}
      <AnimatePresence>
        {tab === 'vacation' && (
          <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 20 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: 'hidden' }}>
            <div className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', border: '1px solid var(--primary-500)', background: 'linear-gradient(135deg, rgba(59,130,246,0.05), transparent)' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>Start Date</label>
                <input type="date" value={vacationStart} onChange={(e) => setVacationStart(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'white', outline: 'none' }} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>End Date</label>
                <input type="date" value={vacationEnd} onChange={(e) => setVacationEnd(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'white', outline: 'none' }} />
              </div>
              <button className="btn btn-primary" onClick={calculateVacation} style={{ height: 42 }}>
                Simulate Impact
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== STATS BAR ===== */}
      <motion.div variants={fadeIn} className="calc-stats-grid">
        {/* Row 1 — Subject Target Selector (full width always) */}
        <div className="glass-card calc-target-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Target size={14} style={{ color: 'var(--primary-400)' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject Targets</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <motion.button onClick={() => setSubjectTargetPct(null)}
              style={{
                padding: '5px 8px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer',
                fontWeight: subjectTargetPct === null ? 800 : 500,
                background: subjectTargetPct === null ? 'var(--primary-500)' : 'transparent',
                border: `1px solid ${subjectTargetPct === null ? 'var(--primary-500)' : 'var(--border-primary)'}`,
                color: subjectTargetPct === null ? 'white' : 'var(--text-tertiary)',
              }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            >Individual</motion.button>
            {[60, 65, 70, 75, 80, 85, 90, 95, 100].map((pct) => (
              <motion.button key={pct} onClick={() => setSubjectTargetPct(pct)}
                style={{
                  padding: '5px 8px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer',
                  fontWeight: subjectTargetPct === pct ? 800 : 500,
                  background: subjectTargetPct === pct ? 'var(--primary-500)' : 'transparent',
                  border: `1px solid ${subjectTargetPct === pct ? 'var(--primary-500)' : 'var(--border-primary)'}`,
                  color: subjectTargetPct === pct ? 'white' : 'var(--text-tertiary)',
                }}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              >{pct}%</motion.button>
            ))}
          </div>
        </div>

        {/* Row 1.5 — Overall Target Selector (full width always) */}
        <div className="glass-card calc-target-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Target size={14} style={{ color: 'var(--accent-400)' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Target</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[60, 65, 70, 75, 80, 85, 90, 95, 100].map((pct) => (
              <motion.button key={pct} onClick={() => setOverallTargetPct(pct)}
                style={{
                  padding: '5px 8px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer',
                  fontWeight: overallTargetPct === pct ? 800 : 500,
                  background: overallTargetPct === pct ? 'var(--accent-500)' : 'transparent',
                  border: `1px solid ${overallTargetPct === pct ? 'var(--accent-500)' : 'var(--border-primary)'}`,
                  color: overallTargetPct === pct ? 'white' : 'var(--text-tertiary)',
                }}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              >{pct}%</motion.button>
            ))}
          </div>
        </div>

        {/* Row 2 — Overall Comparison (full width always) */}
        <div className="glass-card calc-overall-card">
          <div className="calc-stat-block">
            <div className="calc-stat-label">Current</div>
            <span className={`${getPctClass(currentOverall)} calc-stat-num`}>{currentOverall}%</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ArrowRight size={20} style={{ color: hasSimulations ? 'var(--primary-400)' : 'var(--text-tertiary)', opacity: hasSimulations ? 1 : 0.3 }} />
            {hasSimulations && simulatedOverall !== currentOverall && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                background: simulatedOverall > currentOverall ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: simulatedOverall > currentOverall ? 'var(--success-400)' : 'var(--danger-400)',
              }}>
                {simulatedOverall > currentOverall ? '+' : ''}{simulatedOverall - currentOverall}%
              </span>
            )}
          </div>
          <div className="calc-stat-block">
            <div className="calc-stat-label">Simulated</div>
            <span className={`${getPctClass(simulatedOverall)} calc-stat-num`}>{simulatedOverall}%</span>
          </div>
        </div>

        {/* Row 3 — Meeting Target */}
        <div className="glass-card calc-mini-stat">
          <div className="calc-stat-label">Meeting Target</div>
          <span className="calc-stat-num" style={{
            color: meetingCount === subjects.length ? 'var(--success-400)' : meetingCount === 0 ? 'var(--danger-400)' : 'var(--warning-400)',
          }}>
            {meetingCount}<span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>/{subjects.length}</span>
          </span>
        </div>

        {/* Row 3 — Required */}
        <div className="glass-card calc-mini-stat">
          <div className="calc-stat-label">Required Overall</div>
          {overallReq > 0 ? (
            <span className="calc-stat-num" style={{ color: 'var(--danger-400)', fontSize: '1rem' }}>+{overallReq} classes</span>
          ) : (
            <span className="calc-stat-num" style={{ color: 'var(--success-400)', fontSize: '1rem' }}>Achieved!</span>
          )}
        </div>
      </motion.div>

      {/* ===== SUBJECT CARDS — DESKTOP TABLE / MOBILE CARDS ===== */}
      {/* Desktop Table */}
      <motion.div variants={fadeIn} className="glass-card calc-table-desktop" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr 1.5fr 1fr 2fr',
          padding: '14px 20px', gap: 12,
          background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-primary)',
          fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>Subject</span>
          <span style={{ textAlign: 'center' }}>Now</span>
          <span style={{ textAlign: 'center' }}>+ Attend</span>
          <span style={{ textAlign: 'center' }}>+ Miss</span>
          <span style={{ textAlign: 'center' }}>New %</span>
          <span>Status</span>
        </div>

        {results.map((res) => {
          const hasSim = res.sim.futureAttend > 0 || res.sim.futureMiss > 0;
          return (
            <motion.div
              key={res.id}
              variants={fadeIn}
              style={{
                display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr 1.5fr 1fr 2fr',
                padding: '14px 20px', gap: 12, alignItems: 'center',
                borderBottom: '1px solid var(--border-primary)',
                background: hasSim ? (res.meetsTarget ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)') : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: res.color, flexShrink: 0, boxShadow: `0 0 6px ${res.color}60` }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.name || res.code}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                    {res.name && res.code !== res.name ? `${res.code} - ` : ''}Target: {res.activeTarget}%
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span className={getPctClass(res.currentPct)} style={{ fontWeight: 700, fontSize: '0.92rem' }}>{res.currentPct}%</span>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{res.attended}/{res.totalClasses}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <motion.button onClick={() => updateSim(res.id, 'futureAttend', -1)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: 'var(--success-400)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                  <MinusCircle size={14} />
                </motion.button>
                <input type="number" min="0" value={res.sim.futureAttend || ''} placeholder="0"
                  onChange={(e) => setSimValue(res.id, 'futureAttend', e.target.value)}
                  style={{ width: 44, textAlign: 'center', fontSize: '0.95rem', fontWeight: 700, padding: '4px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.2)', background: res.sim.futureAttend > 0 ? 'rgba(34,197,94,0.06)' : 'transparent', color: 'var(--success-400)', outline: 'none' }} />
                <motion.button onClick={() => updateSim(res.id, 'futureAttend', 1)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: 'var(--success-400)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                  <PlusCircle size={14} />
                </motion.button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <motion.button onClick={() => updateSim(res.id, 'futureMiss', -1)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-400)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                  <MinusCircle size={14} />
                </motion.button>
                <input type="number" min="0" value={res.sim.futureMiss || ''} placeholder="0"
                  onChange={(e) => setSimValue(res.id, 'futureMiss', e.target.value)}
                  style={{ width: 44, textAlign: 'center', fontSize: '0.95rem', fontWeight: 700, padding: '4px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: res.sim.futureMiss > 0 ? 'rgba(239,68,68,0.06)' : 'transparent', color: 'var(--danger-400)', outline: 'none' }} />
                <motion.button onClick={() => updateSim(res.id, 'futureMiss', 1)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-400)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                  <PlusCircle size={14} />
                </motion.button>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span className={getPctClass(res.newPct)} style={{ fontWeight: 800, fontSize: '1.1rem' }}>{res.newPct}%</span>
                {res.change !== 0 && (
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: res.change > 0 ? 'var(--success-400)' : 'var(--danger-400)' }}>
                    {res.change > 0 ? '↑' : '↓'}{Math.abs(res.change)}%
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {res.meetsTarget ? (
                  <>
                    <CheckCircle2 size={15} style={{ color: 'var(--success-400)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--success-400)', fontWeight: 600 }}>Can miss {res.canMiss}</span>
                  </>
                ) : (
                  <>
                    <XCircle size={15} style={{ color: 'var(--danger-400)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--danger-400)', fontWeight: 600 }}>Need {res.need} more</span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Mobile Cards Layout */}
      <motion.div variants={fadeIn} className="calc-cards-mobile" style={{ marginBottom: 20, flexDirection: 'column', gap: 12, width: '100%' }}>
        {results.map((res) => {
          const hasSim = res.sim.futureAttend > 0 || res.sim.futureMiss > 0;
          return (
            <div key={res.id} className="glass-card" style={{
              padding: '16px',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              borderColor: hasSim ? (res.meetsTarget ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border-primary)',
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: res.color, boxShadow: `0 0 8px ${res.color}70` }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{res.name || res.code}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      {res.name && res.code !== res.name ? `${res.code} - ` : ''}<span style={{ color: 'var(--primary-400)' }}>Target: {res.activeTarget}%</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Now</div>
                    <span className={getPctClass(res.currentPct)} style={{ fontWeight: 700, fontSize: '1rem' }}>{res.currentPct}%</span>
                  </div>
                  <ArrowRight size={16} style={{ color: hasSim ? 'var(--primary-400)' : 'var(--text-tertiary)', opacity: hasSim ? 1 : 0.3 }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>New</div>
                    <span className={getPctClass(res.newPct)} style={{ fontWeight: 800, fontSize: '1rem' }}>{res.newPct}%</span>
                  </div>
                </div>
              </div>

              {/* Simulators */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {/* Attend */}
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '10px 8px', minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--success-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>+ Attend</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <motion.button onClick={() => updateSim(res.id, 'futureAttend', -1)}
                      style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--success-400)', cursor: 'pointer', flexShrink: 0 }}
                      whileTap={{ scale: 0.85 }}>
                      <MinusCircle size={16} />
                    </motion.button>
                    <input type="number" min="0" value={res.sim.futureAttend || ''} placeholder="0"
                      onChange={(e) => setSimValue(res.id, 'futureAttend', e.target.value)}
                      style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, padding: '4px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.2)', background: 'transparent', color: 'var(--success-400)', outline: 'none', minWidth: 0 }} />
                    <motion.button onClick={() => updateSim(res.id, 'futureAttend', 1)}
                      style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--success-400)', cursor: 'pointer', flexShrink: 0 }}
                      whileTap={{ scale: 0.85 }}>
                      <PlusCircle size={16} />
                    </motion.button>
                  </div>
                </div>
                {/* Miss */}
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 8px', minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--danger-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>+ Miss</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <motion.button onClick={() => updateSim(res.id, 'futureMiss', -1)}
                      style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger-400)', cursor: 'pointer', flexShrink: 0 }}
                      whileTap={{ scale: 0.85 }}>
                      <MinusCircle size={16} />
                    </motion.button>
                    <input type="number" min="0" value={res.sim.futureMiss || ''} placeholder="0"
                      onChange={(e) => setSimValue(res.id, 'futureMiss', e.target.value)}
                      style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, padding: '4px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: 'var(--danger-400)', outline: 'none', minWidth: 0 }} />
                    <motion.button onClick={() => updateSim(res.id, 'futureMiss', 1)}
                      style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger-400)', cursor: 'pointer', flexShrink: 0 }}
                      whileTap={{ scale: 0.85 }}>
                      <PlusCircle size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: res.meetsTarget ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${res.meetsTarget ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {res.meetsTarget ? (
                    <CheckCircle2 size={15} style={{ color: 'var(--success-400)' }} />
                  ) : (
                    <XCircle size={15} style={{ color: 'var(--danger-400)' }} />
                  )}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: res.meetsTarget ? 'var(--success-400)' : 'var(--danger-400)' }}>
                    {res.meetsTarget ? `Can skip ${res.canMiss} classes` : `Attend ${res.need} more classes`}
                  </span>
                </div>
                {res.change !== 0 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: res.change > 0 ? 'var(--success-400)' : 'var(--danger-400)' }}>
                    {res.change > 0 ? '↑' : '↓'}{Math.abs(res.change)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ===== HOW IT WORKS ===== */}
      <motion.div variants={fadeIn} className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Info size={16} style={{ color: 'var(--accent-400)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>How It Works</span>
        </div>
        <div className="calc-how-grid">
          {[
            { icon: <Target size={16} />, title: '1. Set Target', desc: 'Choose target % (MANIT needs 75%)' },
            { icon: <Calculator size={16} />, title: '2. Simulate', desc: 'Use +/- buttons to add future classes' },
            { icon: <Sparkles size={16} />, title: '3. See Result', desc: 'Instantly see projected percentage' },
          ].map((s) => (
            <div key={s.title} style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>



    </motion.div>
  );
}
