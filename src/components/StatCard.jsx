import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, change, changeType, color }) {
  const colorMap = {
    blue: {
      bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))',
      border: 'rgba(59, 130, 246, 0.25)',
      icon: '#3b82f6',
    },
    green: {
      bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
      border: 'rgba(34, 197, 94, 0.25)',
      icon: '#22c55e',
    },
    violet: {
      bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
      border: 'rgba(139, 92, 246, 0.25)',
      icon: '#8b5cf6',
    },
    orange: {
      bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))',
      border: 'rgba(249, 115, 22, 0.25)',
      icon: '#f97316',
    },
    red: {
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
      border: 'rgba(239, 68, 68, 0.25)',
      icon: '#ef4444',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      className="glass-card stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
    >
      <div
        className="stat-icon"
        style={{ background: c.bg, border: `1px solid ${c.border}` }}
      >
        <Icon size={22} style={{ color: c.icon }} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change !== undefined && (
          <div
            className="stat-change"
            style={{ color: changeType === 'up' ? '#4ade80' : '#f87171' }}
          >
            {changeType === 'up' ? '↑' : '↓'} {change}
          </div>
        )}
      </div>
    </motion.div>
  );
}
