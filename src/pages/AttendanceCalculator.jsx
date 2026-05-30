import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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

const fadeIn = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

export default function AttendanceCalculator() {
  const { subjects } = useAttendance();
  const [targetPct, setTargetPct] = useState(75);
  const [simulations, setSimulations] = useState({});

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
      const newAttended = sub.attended + sim.futureAttend;
      const newTotal = sub.totalClasses + sim.futureAttend + sim.futureMiss;
      const currentPct = getSubjectPercentage(sub);
      const newPct = newTotal > 0 ? Math.round((newAttended / newTotal) * 100) : 0;
      const meetsTarget = newPct >= targetPct;
      const canMiss = classesCanMiss(newAttended, newTotal, targetPct);
      const need = classesNeeded(newAttended, newTotal, targetPct);
      return { ...sub, sim, currentPct, newAttended, newTotal, newPct, meetsTarget, canMiss, need, change: newPct - currentPct };
    });
  }, [subjects, simulations, targetPct]);

  const currentOverall = getOverallPercentage(subjects);
  const simulatedOverall = useMemo(() => {
    let a = 0, t = 0;
    results.forEach((r) => { a += r.newAttended; t += r.newTotal; });
    return t > 0 ? Math.round((a / t) * 100) : 0;
  }, [results]);

  const meetingCount = results.filter((r) => r.meetsTarget).length;
  const hasSimulations = Object.keys(simulations).length > 0;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
      {/* ===== HEADER ===== */}
      <motion.div variants={fadeIn} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              boxShadow: '0 0 20px rgba(59,130,246,0.2)',
            }}>
              <Calculator size={20} />
            </div>
            Attendance Calculator
          </h1>
          <p>"What if" simulator — plan future classes and see your projected attendance.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasSimulations && (
            <motion.button className="btn btn-outline" onClick={resetAll}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <RotateCcw size={14} /> Reset All
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ===== STATS BAR ===== */}
      <motion.div variants={fadeIn} style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 16,
        marginBottom: 24, alignItems: 'stretch',
      }}>
        {/* Target Selector */}
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Target size={14} style={{ color: 'var(--primary-400)' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[60, 65, 70, 75, 80, 85].map((pct) => (
              <motion.button key={pct} onClick={() => setTargetPct(pct)}
                style={{
                  padding: '5px 8px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer',
                  fontWeight: targetPct === pct ? 800 : 500,
                  background: targetPct === pct ? 'var(--primary-500)' : 'transparent',
                  border: `1px solid ${targetPct === pct ? 'var(--primary-500)' : 'var(--border-primary)'}`,
                  color: targetPct === pct ? 'white' : 'var(--text-tertiary)',
                }}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              >{pct}%</motion.button>
            ))}
          </div>
        </div>

        {/* Big Overall Comparison */}
        <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Current</div>
            <span className={getPctClass(currentOverall)} style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentOverall}%</span>
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
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Simulated</div>
            <span className={getPctClass(simulatedOverall)} style={{ fontSize: '1.8rem', fontWeight: 800 }}>{simulatedOverall}%</span>
          </div>
        </div>

        {/* Meeting Target */}
        <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 90 }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Meeting</div>
          <span style={{
            fontSize: '1.8rem', fontWeight: 800,
            color: meetingCount === subjects.length ? 'var(--success-400)' : meetingCount === 0 ? 'var(--danger-400)' : 'var(--warning-400)',
          }}>
            {meetingCount}<span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>/{subjects.length}</span>
          </span>
        </div>

        {/* Quick Info */}
        <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 90 }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Required</div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-400)' }}>{targetPct}%</span>
        </div>
      </motion.div>

      {/* ===== SUBJECT TABLE ===== */}
      <motion.div variants={fadeIn} className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        {/* Table Header */}
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

        {/* Table Rows */}
        {results.map((res, idx) => {
          const hasSim = res.sim.futureAttend > 0 || res.sim.futureMiss > 0;
          return (
            <motion.div
              key={res.id}
              variants={fadeIn}
              style={{
                display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr 1.5fr 1fr 2fr',
                padding: '14px 20px', gap: 12, alignItems: 'center',
                borderBottom: '1px solid var(--border-primary)',
                background: hasSim
                  ? (res.meetsTarget ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)')
                  : 'transparent',
                transition: 'background 0.2s ease',
              }}
            >
              {/* Subject Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: res.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${res.color}60`,
                }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{res.code}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{res.name}</div>
                </div>
              </div>

              {/* Current % */}
              <div style={{ textAlign: 'center' }}>
                <span className={getPctClass(res.currentPct)} style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  {res.currentPct}%
                </span>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                  {res.attended}/{res.totalClasses}
                </div>
              </div>

              {/* + Attend counter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <motion.button onClick={() => updateSim(res.id, 'futureAttend', -1)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: 'var(--success-400)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                  <MinusCircle size={14} />
                </motion.button>
                <input type="number" min="0" value={res.sim.futureAttend || ''} placeholder="0"
                  onChange={(e) => setSimValue(res.id, 'futureAttend', e.target.value)}
                  style={{
                    width: 44, textAlign: 'center', fontSize: '0.95rem', fontWeight: 700,
                    padding: '4px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.2)',
                    background: res.sim.futureAttend > 0 ? 'rgba(34,197,94,0.06)' : 'transparent',
                    color: 'var(--success-400)', outline: 'none',
                  }} />
                <motion.button onClick={() => updateSim(res.id, 'futureAttend', 1)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: 'var(--success-400)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                  <PlusCircle size={14} />
                </motion.button>
              </div>

              {/* + Miss counter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <motion.button onClick={() => updateSim(res.id, 'futureMiss', -1)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-400)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                  <MinusCircle size={14} />
                </motion.button>
                <input type="number" min="0" value={res.sim.futureMiss || ''} placeholder="0"
                  onChange={(e) => setSimValue(res.id, 'futureMiss', e.target.value)}
                  style={{
                    width: 44, textAlign: 'center', fontSize: '0.95rem', fontWeight: 700,
                    padding: '4px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)',
                    background: res.sim.futureMiss > 0 ? 'rgba(239,68,68,0.06)' : 'transparent',
                    color: 'var(--danger-400)', outline: 'none',
                  }} />
                <motion.button onClick={() => updateSim(res.id, 'futureMiss', 1)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger-400)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                  <PlusCircle size={14} />
                </motion.button>
              </div>

              {/* New % */}
              <div style={{ textAlign: 'center' }}>
                <span className={getPctClass(res.newPct)} style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  {res.newPct}%
                </span>
                {res.change !== 0 && (
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 700,
                    color: res.change > 0 ? 'var(--success-400)' : 'var(--danger-400)',
                  }}>
                    {res.change > 0 ? '↑' : '↓'}{Math.abs(res.change)}%
                  </div>
                )}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {res.meetsTarget ? (
                  <>
                    <CheckCircle2 size={15} style={{ color: 'var(--success-400)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--success-400)', fontWeight: 600 }}>
                      Can miss {res.canMiss}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={15} style={{ color: 'var(--danger-400)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--danger-400)', fontWeight: 600 }}>
                      Need {res.need} more
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ===== HOW IT WORKS ===== */}
      <motion.div variants={fadeIn} className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Info size={16} style={{ color: 'var(--accent-400)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>How It Works</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
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

      {/* Responsive styles for smaller screens */}
      <style>{`
        @media (max-width: 900px) {
          .glass-card [style*="gridTemplateColumns: '2.5fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
