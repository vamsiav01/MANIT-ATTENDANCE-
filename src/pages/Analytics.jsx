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

const tooltipStyle = {
  background: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  fontSize: '0.8rem',
};

export default function Analytics() {
  const { subjects, history } = useAttendance();
  const overall = getOverallPercentage(subjects);
  const weeklyTrend = getWeeklyTrend(history);

  // Bar chart data
  const barData = useMemo(() => {
    return subjects.map((sub) => ({
      name: sub.code,
      fullName: sub.name,
      percentage: getSubjectPercentage(sub),
      fill: sub.color,
    }));
  }, [subjects]);

  // Pie chart data — includes holiday count
  const pieData = useMemo(() => {
    let totalAttended = 0, totalMissed = 0, totalHoliday = 0;
    subjects.forEach((s) => { totalAttended += s.attended; totalMissed += (s.totalClasses - s.attended); });
    // Count holidays from history
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

  // Radar data
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
          padding: '24px 28px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          borderColor: overall >= 75 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
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
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {subjects.map((sub) => {
            const pct = getSubjectPercentage(sub);
            return (
              <motion.div key={sub.id} style={{ textAlign: 'center' }} whileHover={{ scale: 1.1 }}>
                <div className={getPctClass(pct)} style={{ fontSize: '1.1rem', fontWeight: 700 }}>{pct}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{sub.code}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card chart-container">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} style={{ color: 'var(--primary-400)' }} />
            Subject-wise Attendance
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={barData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card chart-container">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} style={{ color: 'var(--accent-400)' }} />
            Attendance Radar
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Attendance" dataKey="attendance" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card chart-container">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: 'var(--success-400)' }} />
            Weekly Trend
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
              <Line type="monotone" dataKey="percentage" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card chart-container">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Attended vs Missed vs Holiday
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>📋 Detailed Breakdown</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" id="analytics-table">
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
                const canMissVal = classesCanMiss(sub.attended, sub.totalClasses);
                const neededVal = classesNeeded(sub.attended, sub.totalClasses);

                return (
                  <tr key={sub.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sub.color }} />
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
                      {pct >= 75 ? (
                        <span style={{ color: 'var(--success-400)', fontSize: '0.82rem' }}>Can miss {canMissVal}</span>
                      ) : (
                        <span style={{ color: 'var(--danger-400)', fontSize: '0.82rem' }}>Need {neededVal} more</span>
                      )}
                    </td>
                    <td>
                      {pct >= 75 ? (
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
    </motion.div>
  );
}
