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
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAttendance } from '../context/AttendanceContext';
import StatCard from '../components/StatCard';
import {
  getSubjectPercentage,
  getOverallPercentage,
  classesCanMiss,
  classesNeeded,
  getPctClass,
  getProgressClass,
  getWeeklyTrend,
  getTodayName,
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
  const overall = getOverallPercentage(subjects);
  const dangerSubjects = subjects.filter((s) => getSubjectPercentage(s) < 75);
  const safeSubjects = subjects.filter((s) => getSubjectPercentage(s) >= 75);
  const todayName = getTodayName();
  const todaySchedule = schedule[todayName] || [];
  const todaySubjects = todaySchedule.map((id) => subjects.find((s) => s.id === id)).filter(Boolean);
  const weeklyTrend = getWeeklyTrend(history);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div className="page-header">
        <h1>Hey, {profile.name.split(' ')[0]}! 👋</h1>
        <p>Here's your attendance overview. {overall >= 75 ? "You're on track!" : "⚠️ Some subjects need attention."}</p>
      </div>

      {/* Stat Cards */}
      <motion.div className="grid-4" variants={itemVariants}>
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
            const canMiss = classesCanMiss(sub.attended, sub.totalClasses);
            const needed = classesNeeded(sub.attended, sub.totalClasses);

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
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600 }}>{sub.code}</h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{sub.name}</p>
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
                  {pct >= 75 ? (
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
