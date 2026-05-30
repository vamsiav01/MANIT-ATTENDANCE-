import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  BarChart3,
  Calendar,
  GraduationCap,
  RotateCcw,
  User,
  Sun,
  Moon,
  CalendarClock,
  History,
  Calculator,
  LogOut,
  Palette,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ColorCustomizer from './ColorCustomizer';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/today', icon: CalendarCheck, label: "Today's Classes" },
  { path: '/subjects', icon: BookOpen, label: 'My Subjects' },
  { path: '/timetable', icon: CalendarClock, label: 'Timetable' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/calculator', icon: Calculator, label: 'Calculator' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/profile', icon: User, label: 'My Profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const { resetData, profile } = useAttendance();
  const { theme, toggleTheme, accentColor } = useTheme();
  const { user, signOut } = useAuth();
  const [showCustomizer, setShowCustomizer] = useState(false);

  const displayName = user?.displayName || profile.name;
  const photoURL = user?.photoURL;
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <aside className="sidebar">
        {/* Logo & Branding */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <GraduationCap size={28} />
          </div>
          <div className="brand-text">
            <h1>MANIT</h1>
            <span>Maulana Azad NIT, Bhopal</span>
          </div>
        </div>

        {/* Student Info Mini */}
        <div className="sidebar-student">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-full)',
                objectFit: 'cover', flexShrink: 0,
              }}
            />
          ) : (
            <div className="student-avatar">{initials}</div>
          )}
          <div className="student-info">
            <span className="student-name">{displayName}</span>
            <span className="student-detail">
              {user?.email === 'guest@local' ? 'Guest Mode' : `${profile.branch} • Year ${profile.year}`}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">MENU</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} className="nav-link-wrapper">
                <motion.div
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      className="nav-active-bg"
                      layoutId="activeNav"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={19} className="nav-icon" />
                  <span>{item.label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="sidebar-footer">
          {/* Theme Toggle */}
          <div className="sidebar-theme-row">
            <div className="sidebar-theme-label">
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </div>
            <button
              className={`theme-toggle ${theme}`}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              id="sidebar-theme-toggle"
            >
              <div className="theme-toggle-knob">
                {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
              </div>
            </button>
          </div>

          {/* Customize Colors */}
          <button className="nav-link" onClick={() => setShowCustomizer(true)} title="Customize theme colors" id="customize-colors-btn">
            <Palette size={19} className="nav-icon" style={{ color: accentColor.primary }} />
            <span>Customize</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: accentColor.primary }} />
              <div style={{ width: 10, height: 10, borderRadius: 3, background: accentColor.accent }} />
            </div>
          </button>

          <button className="nav-link" onClick={resetData} title="Reset to sample data">
            <RotateCcw size={19} className="nav-icon" />
            <span>Reset Data</span>
          </button>

          {/* Sign Out */}
          {user && user.uid !== 'local' && (
            <button className="nav-link" onClick={signOut} title="Sign out" id="sign-out-btn">
              <LogOut size={19} className="nav-icon" />
              <span>Sign Out</span>
            </button>
          )}
          {user && user.uid === 'local' && (
            <button className="nav-link" onClick={signOut} title="Switch to sign in" id="switch-account-btn">
              <LogOut size={19} className="nav-icon" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        <style>{`
          .sidebar {
            position: fixed; left: 0; top: 0; width: var(--sidebar-width); height: 100vh;
            background: var(--sidebar-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-right: 1px solid var(--border-primary);
            display: flex; flex-direction: column; z-index: 100; overflow-y: auto;
            transition: background var(--transition-base);
          }
          .sidebar-brand { display: flex; align-items: center; gap: 12px; padding: 24px 20px 16px; }
          .brand-icon {
            width: 44px; height: 44px; border-radius: var(--radius-md);
            background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
            display: flex; align-items: center; justify-content: center;
            color: white; flex-shrink: 0; box-shadow: 0 0 20px rgba(59,130,246,0.25);
          }
          .brand-text h1 {
            font-size: 1.15rem; font-weight: 800; letter-spacing: 0.04em;
            background: linear-gradient(135deg, var(--primary-300), var(--accent-400));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; line-height: 1.2;
          }
          .brand-text span {
            font-size: 0.6rem; color: var(--text-tertiary); text-transform: uppercase;
            letter-spacing: 0.06em; display: block; line-height: 1.3;
          }
          .sidebar-student {
            display: flex; align-items: center; gap: 10px; padding: 14px 20px;
            margin: 0 12px; border-radius: var(--radius-md);
            background: rgba(255,255,255,0.03); border: 1px solid var(--border-primary);
          }
          [data-theme="light"] .sidebar-student { background: rgba(0,0,0,0.02); }
          .student-avatar {
            width: 36px; height: 36px; border-radius: var(--radius-full);
            background: linear-gradient(135deg, var(--primary-600), var(--accent-600));
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 0.7rem; font-weight: 700; flex-shrink: 0;
          }
          .student-info { display: flex; flex-direction: column; overflow: hidden; }
          .student-name {
            font-size: 0.82rem; font-weight: 600; color: var(--text-primary);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .student-detail { font-size: 0.68rem; color: var(--text-tertiary); }
          .sidebar-nav { flex: 1; padding: 16px 12px; }
          .nav-section-label {
            font-size: 0.65rem; font-weight: 700; color: var(--text-tertiary);
            text-transform: uppercase; letter-spacing: 0.12em; padding: 8px 12px 10px;
          }
          .nav-link-wrapper { text-decoration: none; }
          .nav-link {
            position: relative; display: flex; align-items: center; gap: 12px;
            padding: 11px 14px; border-radius: var(--radius-sm);
            color: var(--text-secondary); font-size: 0.88rem; font-weight: 500;
            transition: color var(--transition-fast); cursor: pointer;
            background: transparent; width: 100%; text-align: left; border: none;
          }
          .nav-link:hover { color: var(--text-primary); }
          .nav-link.active { color: white; }
          [data-theme="light"] .nav-link.active { color: var(--primary-600); }
          .nav-active-bg {
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1));
            border: 1px solid rgba(59,130,246,0.2); border-radius: var(--radius-sm); z-index: -1;
          }
          .nav-icon { flex-shrink: 0; }
          .sidebar-footer { padding: 12px; border-top: 1px solid var(--border-primary); }
          .sidebar-theme-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 14px; margin-bottom: 4px; border-radius: var(--radius-sm);
            background: var(--bg-glass); border: 1px solid var(--border-primary);
          }
          .sidebar-theme-label {
            display: flex; align-items: center; gap: 8px; font-size: 0.82rem;
            color: var(--text-secondary); font-weight: 500;
          }
          .sidebar-footer .nav-link { color: var(--text-tertiary); font-size: 0.82rem; }
          .sidebar-footer .nav-link:hover { color: var(--text-primary); }
          @media (max-width: 768px) { .sidebar { display: none; } }
        `}</style>
      </aside>

      <ColorCustomizer isOpen={showCustomizer} onClose={() => setShowCustomizer(false)} />
    </>
  );
}
