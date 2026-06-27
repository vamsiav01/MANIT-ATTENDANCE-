import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Target,
  CalendarCheck,
  ArrowRight,
  Flame,
  ShieldCheck,
  ShieldAlert,
  UserCircle,
  Share2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAttendance } from '../context/AttendanceContext';
import StatCard from '../components/StatCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  getSubjectPercentage,
  getOverallPercentage,
  classesCanMiss,
  classesNeeded,
  getPctClass,
  getProgressClass,
  getWeeklyTrend,
  getTodayName,
  getCurrentStreak,
} from '../utils/helpers';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem',
      }}>
        <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}%</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { subjects, history, schedule, profile } = useAttendance();
  const shareRef = React.useRef(null);
  const [isSharing, setIsSharing] = React.useState(false);
  const [showSharePreview, setShowSharePreview] = React.useState(false);

  const overall = getOverallPercentage(subjects);
  const dangerSubjects = subjects.filter((s) => getSubjectPercentage(s) < 75);
  const safeSubjects = subjects.filter((s) => getSubjectPercentage(s) >= 75);
  const todayName = getTodayName();
  const todaySchedule = schedule[todayName] || [];
  const todaySubjects = todaySchedule.map((id) => subjects.find((s) => s.id === id)).filter(Boolean);
  const weeklyTrend = getWeeklyTrend(history);
  const currentStreak = getCurrentStreak(history);

  const handleShare = () => {
    setShowSharePreview(true);
  };

  const downloadCard = async (type) => {
    if (!shareRef.current) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(shareRef.current, { backgroundColor: '#09090b', scale: 2 });
      
      if (type === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`MANIT_Attendance_${profile.name}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `MANIT_Attendance_${profile.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ position: 'relative' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Hey, {profile.name.split(' ')[0]}! 👋</h1>
          <p>Here's your attendance overview. {overall >= 75 ? "You're on track!" : "⚠️ Some subjects need attention."}</p>
        </div>
        <motion.button className="btn btn-primary" onClick={handleShare} disabled={isSharing} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Share2 size={16} /> {isSharing ? 'Generating...' : 'Share Progress'}
        </motion.button>
      </div>

      {/* Safe Skips Bunk Manager */}
      {todaySubjects.length > 0 && (
        <motion.div variants={itemVariants} style={{ marginTop: 24, padding: 20, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.03))', border: '1px solid rgba(34,197,94,0.15)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success-400)', marginBottom: 12 }}>
            <Target size={18} /> Safe Skips Today
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {todaySubjects.map(sub => {
              const target = sub.targetPct !== undefined ? sub.targetPct : 75;
              const canMiss = classesCanMiss(sub.attended, sub.totalClasses, target);
              const isSafe = canMiss > 0;
              return (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: isSafe ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isSafe ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.name || sub.code}</div>
                    <div style={{ fontSize: '0.72rem', color: isSafe ? 'var(--success-400)' : 'var(--danger-400)', marginTop: 2, fontWeight: 500 }}>
                      {isSafe ? `Can bunk ${canMiss} class${canMiss > 1 ? 'es' : ''}` : 'Do NOT bunk!'}
                    </div>
                  </div>
                  {isSafe ? <ShieldCheck size={18} style={{ color: 'var(--success-500)' }} /> : <AlertTriangle size={18} style={{ color: 'var(--danger-500)' }} />}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Share Card & Modal */}
      <div 
        style={{
          display: showSharePreview ? 'flex' : 'none',
          position: showSharePreview ? 'fixed' : 'absolute',
          inset: showSharePreview ? 0 : 'auto',
          top: showSharePreview ? 0 : -9999,
          left: showSharePreview ? 0 : -9999,
          zIndex: showSharePreview ? 9999 : -1,
          background: showSharePreview ? 'rgba(0,0,0,0.75)' : 'transparent',
          backdropFilter: showSharePreview ? 'blur(8px)' : 'none',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          padding: '40px 20px',
          overflowY: 'auto'
        }}
      >
        <div ref={shareRef} style={{
          width: 540, padding: 0, borderRadius: 32, 
          background: '#09090b', 
          color: 'white', fontFamily: 'Outfit, sans-serif',
          boxShadow: showSharePreview ? '0 25px 50px -12px rgba(0,0,0,0.5)' : 'none',
          overflow: 'hidden',
          position: 'relative',
          transform: showSharePreview && window.innerWidth < 600 ? `scale(${window.innerWidth / 580})` : 'scale(1)',
          transformOrigin: 'center'
        }}>
        {/* Clean Official Background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(9,9,11,1) 100%)' }} />
        
        {/* Subtle Top Glow */}
        <div style={{ position: 'absolute', top: -150, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)', zIndex: 0 }} />

        {/* Large Logo Watermark */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, zIndex: 0, opacity: 0.08, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/manit-logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        
        {/* Header with Logo */}
        <div style={{ position: 'relative', zIndex: 1, padding: '40px 40px 24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-block', padding: '6px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: '#f8fafc', marginBottom: 16 }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontWeight: 700 }}>
              Maulana Azad National Institute of Technology, Bhopal
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Attendance Report
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', margin: '10px 0 0 0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
              {profile.name} <span style={{ opacity: 0.5 }}>|</span> {profile.branch || 'Student'}
            </p>
          </div>
          <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <img src="/manit-logo.png" alt="MANIT Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>
        
        {/* Main Stats Row */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 40px', display: 'flex', gap: 20, marginBottom: 32 }}>
          {/* Overall Percentage Donut */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 32, flex: 1, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 20px rgba(255,255,255,0.02)' }}>
            <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 20 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle cx="70" cy="70" r="60" fill="none" 
                  stroke={overall >= 75 ? '#34d399' : overall >= 60 ? '#fbbf24' : '#f87171'} 
                  strokeWidth="12" 
                  strokeDasharray={`${(overall / 100) * 377} 377`} 
                  strokeLinecap="round" 
                  transform="rotate(-90 70 70)" 
                />
                <text x="70" y="80" textAnchor="middle" fontSize="34" fontWeight="800" fill="#ffffff">{overall}%</text>
              </svg>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Overall Score</div>
          </div>

          {/* Mini Stats Grid */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', borderRadius: 24, padding: '24px', border: '1px solid rgba(139,92,246,0.2)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#a78bfa', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subjects Tracked</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{subjects.length}</div>
            </div>
            <div style={{ display: 'flex', gap: 16, flex: 1 }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', borderRadius: 20, padding: '16px', border: '1px solid rgba(52, 211, 153, 0.2)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', lineHeight: 1, marginBottom: 4 }}>{safeSubjects.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#a7f3d0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safe</div>
              </div>
              <div style={{ background: dangerSubjects.length > 0 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(255,255,255,0.04)', borderRadius: 20, padding: '16px', border: dangerSubjects.length > 0 ? '1px solid rgba(248, 113, 113, 0.2)' : '1px solid rgba(255,255,255,0.08)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: dangerSubjects.length > 0 ? '#f87171' : '#94a3b8', lineHeight: 1, marginBottom: 4 }}>{dangerSubjects.length}</div>
                <div style={{ fontSize: '0.75rem', color: dangerSubjects.length > 0 ? '#fecaca' : '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {subjects.length > 0 && (
          <div style={{ position: 'relative', zIndex: 1, padding: '0 40px 40px 40px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 28, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, fontWeight: 700 }}>Performance Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {subjects.map(sub => {
                  const pct = getSubjectPercentage(sub);
                  const target = sub.targetPct !== undefined ? sub.targetPct : 75;
                  const canMiss = classesCanMiss(sub.attended, sub.totalClasses, target);
                  const needed = classesNeeded(sub.attended, sub.totalClasses, target);
                  
                  return (
                    <div key={sub.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: sub.color }} />
                          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>{sub.name || sub.code}</span>
                        </div>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: pct >= target ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: sub.color, borderRadius: 3 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                        <span>{sub.attended}/{sub.totalClasses} classes attended</span>
                        {pct >= target ? (
                          <span style={{ color: '#34d399' }}>Safe to miss {canMiss}</span>
                        ) : (
                          <span style={{ color: '#f87171' }}>Attend {needed} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.03)', padding: '20px 40px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#cbd5e1' }}>MANIT Attendance App</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Official Student Record</span>
        </div>
        </div>
        
        {/* Modal Controls */}
        {showSharePreview && (
          <div style={{ display: 'flex', gap: 16, marginTop: 24, zIndex: 10000 }}>
            <motion.button onClick={() => setShowSharePreview(false)} className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Cancel
            </motion.button>
            <motion.button onClick={() => downloadCard('image')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {isSharing ? 'Generating...' : 'Download Image'}
            </motion.button>
            <motion.button onClick={() => downloadCard('pdf')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {isSharing ? 'Generating...' : 'Download PDF'}
            </motion.button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <motion.div className="grid-4" variants={itemVariants} style={{ marginTop: 24 }}>
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={currentStreak}
          change={currentStreak >= 7 ? 'On Fire! 🔥' : 'Keep it up!'}
          changeType="up"
          color="orange"
        />
        <StatCard
          icon={Target}
          label="Overall Attendance"
          value={`${overall}%`}
          change={overall >= 75 ? 'Above 75% ✓' : 'Below 75% ✗'}
          changeType={overall >= 75 ? 'up' : 'down'}
          color={overall >= 75 ? 'green' : 'red'}
        />
        <StatCard
          icon={BookOpen}
          label="Total Subjects"
          value={subjects.length}
          color="blue"
        />
        <StatCard
          icon={ShieldCheck}
          label="Safe Subjects"
          value={safeSubjects.length}
          change="≥ 75%"
          changeType="up"
          color="green"
        />
        <StatCard
          icon={ShieldAlert}
          label="At Risk"
          value={dangerSubjects.length}
          change={dangerSubjects.length > 0 ? 'Need attention' : 'All clear!'}
          changeType={dangerSubjects.length > 0 ? 'down' : 'up'}
          color={dangerSubjects.length > 0 ? 'red' : 'green'}
        />
      </motion.div>

      {/* Today's Classes + Trend */}
      <motion.div className="grid-2" style={{ marginTop: 24 }} variants={itemVariants}>
        {/* Today's Classes */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-md">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarCheck size={18} style={{ color: 'var(--primary-400)' }} />
              Today's Classes — {todayName}
            </h3>
            <Link to="/today" className="btn btn-ghost btn-sm">
              Mark <ArrowRight size={14} />
            </Link>
          </div>
          {todaySubjects.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', padding: '16px 0' }}>🎉 No classes scheduled today!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todaySubjects.map((sub) => {
                const pct = getSubjectPercentage(sub);
                return (
                  <motion.div
                    key={sub.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-primary)',
                    }}
                    whileHover={{ x: 4, borderColor: sub.color + '30' }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: sub.color, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{sub.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>{sub.code}</span>
                      {sub.teacher && (
                        <div className="teacher-tag" style={{ marginTop: 2 }}>
                          <UserCircle size={11} />
                          <span>{sub.teacher}</span>
                        </div>
                      )}
                    </div>
                    <span className={getPctClass(pct)} style={{ fontWeight: 700, fontSize: '0.85rem' }}>{pct}%</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Trend */}
        <div className="glass-card chart-container">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-400)' }} />
            Your Weekly Trend
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="percentage" name="Attendance" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#a78bfa' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Subject Cards */}
      <motion.div variants={itemVariants} style={{ marginTop: 24 }}>
        <div className="flex items-center justify-between mb-md">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={18} style={{ color: 'var(--orange-500)' }} />
            Subject-wise Breakdown
          </h3>
          <Link to="/subjects" className="btn btn-ghost btn-sm">
            Manage <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {subjects.map((sub, idx) => {
            const pct = getSubjectPercentage(sub);
            const target = sub.targetPct !== undefined ? sub.targetPct : 75;
            const canMiss = classesCanMiss(sub.attended, sub.totalClasses, target);
            const needed = classesNeeded(sub.attended, sub.totalClasses, target);

            return (
              <motion.div
                key={sub.id}
                className="glass-card"
                style={{ padding: 18 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ borderColor: sub.color + '40', y: -4, boxShadow: `0 12px 40px rgba(0,0,0,0.12), 0 0 25px ${sub.color}15` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: sub.color }} />
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600 }}>{sub.name || sub.code}</h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{sub.code}</p>
                    </div>
                  </div>
                  <span className={getPctClass(pct)} style={{ fontSize: '1.2rem', fontWeight: 800 }}>{pct}%</span>
                </div>

                {sub.teacher && (
                  <div className="teacher-tag" style={{ marginBottom: 8 }}>
                    <UserCircle size={12} />
                    <span>{sub.teacher}</span>
                  </div>
                )}

                <div className="progress-bar" style={{ marginBottom: 10 }}>
                  <div className={`progress-fill ${getProgressClass(pct)}`} style={{ width: `${pct}%` }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                  <span>{sub.attended}/{sub.totalClasses} classes</span>
                  {pct >= target ? (
                    <span style={{ color: 'var(--success-400)' }}>Can miss {canMiss} more</span>
                  ) : (
                    <span style={{ color: 'var(--danger-400)' }}>Attend {needed} more</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚡ Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { to: '/timetable', icon: '📅', title: 'Timetable', desc: 'Manage weekly schedule' },
            { to: '/history', icon: '📋', title: 'History', desc: 'View past attendance' },
            { to: '/calculator', icon: '🧮', title: 'Calculator', desc: 'What-if simulator' },
            { to: '/analytics', icon: '📊', title: 'Analytics', desc: 'Charts & reports' },
          ].map((action) => (
            <Link key={action.to} to={action.to}>
              <motion.div
                className="glass-card"
                style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                whileHover={{ y: -3, borderColor: 'var(--primary-400)' }}
                whileTap={{ scale: 0.98 }}
              >
                <span style={{ fontSize: '1.4rem' }}>{action.icon}</span>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 600 }}>{action.title}</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{action.desc}</p>
                </div>
                <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
