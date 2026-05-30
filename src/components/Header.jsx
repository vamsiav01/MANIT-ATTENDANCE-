import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Menu,
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  BarChart3,
  Calendar,
  User,
  X,
  GraduationCap,
  Sun,
  Moon,
  CalendarClock,
  History,
  Calculator,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Download,
  Smartphone,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useTheme } from '../context/ThemeContext';
import { getSubjectPercentage, getTodayKey, getTodayName } from '../utils/helpers';

const pageNames = {
  '/': 'Dashboard',
  '/today': "Today's Classes",
  '/subjects': 'My Subjects',
  '/timetable': 'Timetable',
  '/history': 'Attendance History',
  '/calculator': 'Calculator',
  '/analytics': 'Analytics',
  '/calendar': 'Calendar',
  '/profile': 'My Profile',
};

const mobileNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/today', icon: CalendarCheck, label: "Today's Classes" },
  { path: '/subjects', icon: BookOpen, label: 'My Subjects' },
  { path: '/timetable', icon: CalendarClock, label: 'Timetable' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/calculator', icon: Calculator, label: 'Calculator' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Header() {
  const location = useLocation();
  const { subjects, history, schedule } = useAttendance();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const notifRef = useRef(null);

  // PWA Install Prompt
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const pageName = pageNames[location.pathname] || 'MANIT Attendance';
  const todayKey = getTodayKey();
  const todayName = getTodayName();
  const todaySchedule = schedule[todayName] || [];
  const todayHistory = history[todayKey] || {};

  // Build notifications
  const notifications = useMemo(() => {
    const notifs = [];

    // Danger subjects (<75%)
    subjects.forEach((sub) => {
      const pct = getSubjectPercentage(sub);
      if (pct < 60) {
        notifs.push({
          id: `danger-${sub.id}`,
          type: 'danger',
          icon: AlertTriangle,
          title: `${sub.code} is critically low`,
          desc: `Only ${pct}% attendance — immediate action needed`,
          link: '/subjects',
        });
      } else if (pct < 75) {
        notifs.push({
          id: `warn-${sub.id}`,
          type: 'warning',
          icon: ShieldAlert,
          title: `${sub.code} below 75%`,
          desc: `At ${pct}% — attend more classes to stay safe`,
          link: '/subjects',
        });
      }
    });

    // Unmarked today classes
    const unmarkedToday = todaySchedule.filter((id) => !todayHistory[id]);
    if (unmarkedToday.length > 0) {
      notifs.push({
        id: 'unmarked-today',
        type: 'info',
        icon: CalendarCheck,
        title: `${unmarkedToday.length} class${unmarkedToday.length > 1 ? 'es' : ''} not marked`,
        desc: `You have unmarked classes for today`,
        link: '/today',
      });
    }

    // All clear
    if (notifs.length === 0) {
      notifs.push({
        id: 'all-clear',
        type: 'success',
        icon: CheckCircle2,
        title: 'All clear!',
        desc: 'All subjects are above 75% and today is marked',
        link: '/',
      });
    }

    return notifs;
  }, [subjects, todaySchedule, todayHistory]);

  const dangerCount = notifications.filter((n) => n.type === 'danger' || n.type === 'warning' || n.type === 'info').length;

  // Click away to close notif panel
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const getNotifColor = (type) => {
    switch (type) {
      case 'danger': return 'var(--danger-400)';
      case 'warning': return 'var(--warning-400)';
      case 'info': return 'var(--primary-400)';
      case 'success': return 'var(--success-400)';
      default: return 'var(--text-secondary)';
    }
  };

  const getNotifBg = (type) => {
    switch (type) {
      case 'danger': return 'rgba(239,68,68,0.08)';
      case 'warning': return 'rgba(234,179,8,0.08)';
      case 'info': return 'rgba(59,130,246,0.08)';
      case 'success': return 'rgba(34,197,94,0.08)';
      default: return 'var(--bg-glass)';
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="header-breadcrumb">
            <span className="breadcrumb-prefix">My Attendance</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-page">{pageName}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="manit-header-badge" title="The Maulana Azad National Institute of Technology Bhopal">
            <GraduationCap size={14} />
            <span>MANIT Bhopal</span>
          </div>

          {/* Install App Button */}
          {installPrompt && !isInstalled && (
            <motion.button
              className="install-app-btn"
              onClick={handleInstallClick}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="install-app-btn"
            >
              <Download size={14} />
              Install App
            </motion.button>
          )}

          <button
            className={`theme-toggle ${theme}`}
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            id="theme-toggle-btn"
          >
            <div className="theme-toggle-knob">
              {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
            </div>
          </button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <motion.div
              className="header-notification"
              onClick={() => setNotifOpen(!notifOpen)}
              title={`${dangerCount} notifications`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="notification-bell"
            >
              <Bell size={18} />
              {dangerCount > 0 && <span className="notif-badge">{dangerCount}</span>}
            </motion.div>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className="notif-panel"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="notif-panel-header">
                    <span>Notifications</span>
                    <span className="notif-panel-count">{dangerCount}</span>
                  </div>
                  <div className="notif-panel-body">
                    {notifications.map((notif, idx) => {
                      const Icon = notif.icon;
                      return (
                        <Link
                          key={notif.id}
                          to={notif.link}
                          onClick={() => setNotifOpen(false)}
                        >
                          <motion.div
                            className="notif-item"
                            style={{ background: getNotifBg(notif.type) }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ x: 4 }}
                          >
                            <Icon size={16} style={{ color: getNotifColor(notif.type), flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                {notif.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                {notif.desc}
                              </div>
                            </div>
                            <ArrowRight size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="brand-icon-sm"><GraduationCap size={22} /></div>
              <div>
                <span style={{ fontWeight: 700 }}>MANIT</span>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>
                  Maulana Azad NIT, Bhopal
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            </div>

            <div className="mobile-theme-row">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </span>
              <button className={`theme-toggle ${theme}`} onClick={toggleTheme}>
                <div className="theme-toggle-knob">
                  {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                </div>
              </button>
            </div>

            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .app-header {
          position: fixed; top: 0; left: var(--sidebar-width); right: 0;
          height: var(--header-height); background: var(--header-bg);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-primary);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; z-index: 90; transition: background var(--transition-base);
        }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .mobile-menu-btn { display: none; background: transparent; color: var(--text-secondary); padding: 6px; }
        .header-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; }
        .breadcrumb-prefix { color: var(--text-tertiary); font-weight: 500; }
        .breadcrumb-sep { color: var(--text-tertiary); opacity: 0.4; }
        .breadcrumb-page { color: var(--text-primary); font-weight: 600; }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .manit-header-badge {
          display: flex; align-items: center; gap: 6px; padding: 5px 12px;
          border-radius: var(--radius-full); background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.15); color: var(--primary-400);
          font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em;
          cursor: default; transition: all var(--transition-fast);
        }
        .manit-header-badge:hover { background: rgba(59,130,246,0.15); box-shadow: 0 0 12px rgba(59,130,246,0.1); }
        .header-notification {
          position: relative; width: 36px; height: 36px; border-radius: var(--radius-sm);
          background: var(--bg-glass); border: 1px solid var(--border-primary);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);
        }
        .header-notification:hover { background: var(--bg-glass-hover); color: var(--text-primary); transform: translateY(-1px); }
        .notif-badge {
          position: absolute; top: -4px; right: -4px; width: 18px; height: 18px;
          border-radius: 50%; background: var(--danger-500); color: white;
          font-size: 0.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
        }
        /* Notification Panel */
        .notif-panel {
          position: absolute; top: calc(100% + 8px); right: 0; width: 340px;
          background: var(--bg-secondary); border: 1px solid var(--border-secondary);
          border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
          overflow: hidden; z-index: 200;
        }
        .notif-panel-header {
          padding: 14px 16px; border-bottom: 1px solid var(--border-primary);
          display: flex; align-items: center; justify-content: space-between;
          font-weight: 600; font-size: 0.88rem;
        }
        .notif-panel-count {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--primary-500); color: white;
          font-size: 0.65rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .notif-panel-body { padding: 8px; max-height: 360px; overflow-y: auto; }
        .notif-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: var(--radius-sm);
          margin-bottom: 4px; transition: all var(--transition-fast); cursor: pointer;
        }
        .notif-item:hover { opacity: 0.9; }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; display: none; }
        .mobile-menu {
          position: absolute; left: 0; top: 0; width: 280px; height: 100vh;
          background: var(--bg-secondary); border-right: 1px solid var(--border-primary); padding: 20px;
        }
        .mobile-menu-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-weight: 600; font-size: 0.95rem;
        }
        .mobile-menu-header button { margin-left: auto; background: transparent; color: var(--text-secondary); }
        .brand-icon-sm {
          width: 32px; height: 32px; border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
          display: flex; align-items: center; justify-content: center; color: white;
        }
        .mobile-theme-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; margin-bottom: 8px; border-radius: var(--radius-sm);
          background: var(--bg-glass); border: 1px solid var(--border-primary);
        }
        .mobile-nav-link {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px;
          border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 0.9rem;
          transition: all var(--transition-fast);
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: rgba(59,130,246,0.1); color: var(--primary-400);
        }
        @media (max-width: 768px) {
          .app-header { left: 0; }
          .mobile-menu-btn { display: flex; }
          .mobile-overlay { display: block; }
          .manit-header-badge { display: none; }
          .notif-panel { width: 300px; right: -60px; }
        }
      `}</style>
    </>
  );
}
