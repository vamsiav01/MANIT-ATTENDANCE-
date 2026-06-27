import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Download, Target, UserCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Cell, PieChart, Pie, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useAttendance } from '../context/AttendanceContext';
import ExportButton from '../components/ExportButton';
import {
  getSubjectPercentage,
  getOverallPercentage,
  classesCanMiss,
  classesNeeded,
  getPctClass,
  getProgressClass,
  getWeeklyTrend,
} from '../utils/helpers';

import { useTheme } from '../context/ThemeContext';

function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    isDark,
    tooltipStyle: {
      background: isDark ? 'rgba(17,24,39,0.96)' : 'rgba(255,255,255,0.98)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
      borderRadius: 10,
      fontSize: '0.8rem',
      color: isDark ? '#f1f5f9' : '#a6a8abff',
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.12)',
    },
    itemStyle: {
      color: isDark ? '#f1f5f9' : '#75777cff',
    },
    labelStyle: {
      color: isDark ? '#cbd5e1' : '#64748b',
    },
    gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
    axisColor: isDark ? '#cbd5e1' : '#64748b',
    polarGridColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  };
}

export default function Analytics() {
  const { subjects, history } = useAttendance();
  const overall = getOverallPercentage(subjects);
  const weeklyTrend = getWeeklyTrend(history);
  const { tooltipStyle, itemStyle, labelStyle, gridColor, axisColor, polarGridColor } = useChartTheme();

  const barData = useMemo(() => {
    return subjects.map((sub) => ({
      name: sub.code,
      fullName: sub.name,
      percentage: getSubjectPercentage(sub),
      fill: sub.color,
    }));
  }, [subjects]);

  const pieData = useMemo(() => {
    let totalAttended = 0, totalMissed = 0, totalHoliday = 0;
    subjects.forEach((s) => { totalAttended += s.attended; totalMissed += (s.totalClasses - s.attended); });
    Object.values(history).forEach((dayData) => {
      Object.values(dayData).forEach((rawStatus) => {
        const status = typeof rawStatus === 'string' ? rawStatus : rawStatus?.status;
        if (status === 'holiday') totalHoliday++;
      });
    });
    return [
      { name: 'Attended', value: totalAttended, fill: '#22c55e' },
      { name: 'Missed', value: totalMissed, fill: '#ef4444' },
      { name: 'Holiday', value: totalHoliday, fill: '#14b8a6' },
    ].filter((d) => d.value > 0);
  }, [subjects, history]);

  const radarData = useMemo(() => {
    return subjects.map((sub) => ({
      subject: sub.code,
      attendance: getSubjectPercentage(sub),
      fullMark: 100,
    }));
  }, [subjects]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1>Analytics</h1>
          <p>Deep dive into your attendance patterns and statistics.</p>
        </div>
        <ExportButton />
      </div>

      {/* Overall Banner */}
      <motion.div
        className="glass-card"
        style={{
          padding: '20px 24px',
          marginBottom: 20,
          borderColor: overall >= 75 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Top row: big % + threshold text */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Overall Attendance
            </p>
            <span className={getPctClass(overall)} style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
              {overall}%
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
              {overall >= 75 ? '✓ You are above the 75% threshold' : '⚠ Below 75% — attend more classes'}
            </p>
          </div>
          {/* Overall progress ring */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="36" cy="36" r="30" fill="none"
                stroke={overall >= 75 ? '#22c55e' : overall >= 60 ? '#eab308' : '#ef4444'}
                strokeWidth="6"
                strokeDasharray={`${(overall / 100) * 188.5} 188.5`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
              <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill="currentColor" style={{ fill: 'var(--text-primary)' }}>{overall}%</text>
            </svg>
          </div>
        </div>

        {/* Subject mini cards — scrollable row on mobile */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {subjects.map((sub) => {
            const pct = getSubjectPercentage(sub);
            return (
              <motion.div key={sub.id}
                style={{
                  textAlign: 'center', padding: '8px 14px', borderRadius: 10, flexShrink: 0,
                  background: sub.color + '10', border: `1px solid ${sub.color}25`,
                  minWidth: 64,
                }}
                whileHover={{ scale: 1.05 }}
              >
                <div className={getPctClass(pct)} style={{ fontSize: '1rem', fontWeight: 700 }}>{pct}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{sub.code}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card analytics-chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', marginBottom: 16 }}>
            <BarChart3 size={18} style={{ color: 'var(--primary-400)' }} />
            Subject-wise Attendance
          </h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={28} margin={{ left: 5, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card analytics-chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', marginBottom: 16 }}>
            <Target size={18} style={{ color: 'var(--accent-400)' }} />
            Attendance Radar
          </h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%" margin={{ left: 8, right: 8, top: 4, bottom: 4 }} style={{ background: 'transparent' }}>
                <PolarGrid stroke={polarGridColor} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: axisColor, fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 9 }} />
                <Radar name="Attendance" dataKey="attendance" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card analytics-chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', marginBottom: 16 }}>
            <TrendingUp size={18} style={{ color: 'var(--success-400)' }} />
            Weekly Trend
          </h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend} margin={{ left: 5, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
                <Line type="monotone" dataKey="percentage" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card analytics-chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', marginBottom: 16 }}>
            📊 Attended vs Missed vs Holiday
          </h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ left: 0, right: 0, top: 0, bottom: 0 }} style={{ background: 'transparent' }}>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius="55%" outerRadius="80%" paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '0.72rem', color: axisColor, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 80 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>📋 Detailed Breakdown</h3>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" id="analytics-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Teacher</th>
                <th>Attended</th>
                <th>Total</th>
                <th>Missed</th>
                <th>Percentage</th>
                <th>Can Miss / Need</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub) => {
                const pct = getSubjectPercentage(sub);
                const target = sub.targetPct !== undefined ? sub.targetPct : 75;
                const canMissVal = classesCanMiss(sub.attended, sub.totalClasses, target);
                const neededVal = classesNeeded(sub.attended, sub.totalClasses, target);

                return (
                  <tr key={sub.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sub.color, flexShrink: 0 }} />
                        {sub.name}
                      </div>
                    </td>
                    <td><span className="badge badge-info">{sub.code}</span></td>
                    <td>
                      {sub.teacher ? (
                        <div className="teacher-tag">
                          <UserCircle size={13} />
                          <span>{sub.teacher}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--success-400)', fontWeight: 600 }}>{sub.attended}</td>
                    <td>{sub.totalClasses}</td>
                    <td style={{ color: 'var(--danger-400)' }}>{sub.totalClasses - sub.attended}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className={`progress-fill ${getProgressClass(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={getPctClass(pct)} style={{ fontWeight: 700 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      {pct >= target ? (
                        <span style={{ color: 'var(--success-400)', fontSize: '0.82rem' }}>Can miss {canMissVal}</span>
                      ) : (
                        <span style={{ color: 'var(--danger-400)', fontSize: '0.82rem' }}>Need {neededVal} more</span>
                      )}
                    </td>
                    <td>
                      {pct >= target ? (
                        <span className="badge badge-success">Safe</span>
                      ) : pct >= 60 ? (
                        <span className="badge badge-warning">Warning</span>
                      ) : (
                        <span className="badge badge-danger">Danger</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .analytics-chart-card {
          padding: 20px;
          overflow: hidden;
        }
        .analytics-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 768px) {
          .analytics-chart-card {
            padding: 14px 12px;
          }
          .analytics-header-row {
            gap: 8px;
          }
        }
      `}</style>
    </motion.div>
  );
}
