import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  BellOff,
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
  Palette,
  Trash2,
  LogOut,
  Shield,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useAppLock } from '../context/AppLockContext';
import ColorCustomizer from './ColorCustomizer';
import { AppLockSettings } from './AppLock';
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
  '/trash': 'Trash',
};

const mobileNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/today', icon: CalendarCheck, label: "Today's Classes" },
  { path: '/subjects', icon: BookOpen, label: 'My Subjects' },
  { path: '/timetable', icon: CalendarClock, label: 'Timetable' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/calculator', icon: Calculator, label: 'Calculator' },
  { path: '/analytics', icon: TrendingUp, label: 'Analytics' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/trash', icon: Trash2, label: 'Trash' },
];

/* ─── Inline Toggle Switch ─── */
function ToggleSwitch({ checked, onChange, color = 'var(--primary-500)' }) {
  return (
    <motion.button
      onClick={onChange}
      style={{
        width: 42, height: 24, borderRadius: 12, flexShrink: 0,
        background: checked ? color : 'rgba(255,255,255,0.12)',
        border: '1px solid ' + (checked ? color : 'rgba(255,255,255,0.15)'),
        cursor: 'pointer', padding: 2, position: 'relative',
        transition: 'background 0.25s, border-color 0.25s',
      }}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      />
    </motion.button>
  );
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjects, history, schedule, bin } = useAttendance();
  const trashCount = bin?.length || 0;
  const { theme, toggleTheme, accentColor } = useTheme();
  const { user, signOut } = useAuth();
  const { permission, showBanner, askPermission, dismissBanner, notificationsEnabled, toggleNotifications } = useNotifications();
  const { isLockEnabled, hasSetup, lockApp, setShowLockSettings } = useAppLock();
  const { profile } = useAttendance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const notifRef = useRef(null);

  // Listen for SW navigation messages (from notification clicks)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event) => {
      if (event.data?.type === 'NAVIGATE') {
        navigate(event.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [navigate]);

  // PWA Install Prompt
  useEffect(() => {
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
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const pageName = pageNames[location.pathname] || 'MANIT Attendance';
  const todayKey = getTodayKey();
  const todayName = getTodayName();
  const todaySchedule = schedule[todayName] || [];
  const todayHistory = history[todayKey] || {};

  // Build notifications
  const notifications = useMemo(() => {
    const notifs = [];

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
            <img src="/manit-logo.png" alt="MANIT Logo" style={{ width: 16, height: 16, objectFit: 'contain' }} />
            <span>MANIT Bhopal</span>
          </div>

          {/* Install App Button */}
          {installPrompt && (
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
              <span className="install-text">Install App</span>
            </motion.button>
          )}

          {/* App Lock button (desktop) */}
          <motion.button
            className="header-icon-btn"
            onClick={() => setShowLockModal(true)}
            title="App Lock"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            id="app-lock-btn"
          >
            {isLockEnabled ? <Lock size={16} style={{ color: 'var(--success-400)' }} /> : <Shield size={16} />}
          </motion.button>

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
              className={`header-notification ${permission !== 'granted' ? 'notif-pulse' : ''}`}
              onClick={() => setNotifOpen(!notifOpen)}
              title={`${dangerCount} notifications`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="notification-bell"
            >
              {!notificationsEnabled
                ? <BellOff size={18} style={{ color: 'var(--text-tertiary)' }} />
                : permission !== 'granted'
                ? <BellRing size={18} />
                : <Bell size={18} />}
              {dangerCount > 0 && notificationsEnabled && <span className="notif-badge">{dangerCount}</span>}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Notification On/Off Toggle */}
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        {notificationsEnabled ? 'ON' : 'OFF'}
                      </span>
                      <ToggleSwitch
                        checked={notificationsEnabled}
                        onChange={toggleNotifications}
                      />
                      {dangerCount > 0 && <span className="notif-panel-count">{dangerCount}</span>}
                    </div>
                  </div>

                  {!notificationsEnabled && (
                    <div style={{
                      padding: '10px 16px', fontSize: '0.78rem', color: 'var(--text-tertiary)',
                      textAlign: 'center', background: 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid var(--border-primary)',
                      display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
                    }}>
                      <BellOff size={14} /> Notifications are muted
                    </div>
                  )}

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
                            style={{
                              background: getNotifBg(notif.type),
                              opacity: notificationsEnabled ? 1 : 0.5,
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: notificationsEnabled ? 1 : 0.5, x: 0 }}
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

                  {/* Permission prompt if not granted */}
                  {permission !== 'granted' && (
                    <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-primary)' }}>
                      <motion.button
                        onClick={() => { askPermission(profile?.name); setNotifOpen(false); }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        style={{
                          width: '100%', padding: '8px', borderRadius: 8,
                          background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                          border: 'none', color: 'white', fontSize: '0.78rem', fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <BellRing size={14} /> Enable Push Notifications
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── Notification Permission Banner ─── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            className="notif-permission-banner"
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="notif-banner-icon">
              <BellRing size={22} />
            </div>
            <div className="notif-banner-content">
              <div className="notif-banner-title">Enable Notifications</div>
              <div className="notif-banner-desc">Get alerts when attendance drops below 75% and daily reminders.</div>
            </div>
            <div className="notif-banner-actions">
              <motion.button
                className="notif-banner-allow"
                onClick={() => askPermission(profile?.name)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                id="allow-notifications-btn"
              >
                Allow
              </motion.button>
              <motion.button
                className="notif-banner-dismiss"
                onClick={dismissBanner}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <X size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Mobile Slide Menu ─── */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <img src="/manit-logo.png" alt="MANIT Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
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

            {/* ── Mobile Settings Section ── */}
            <div className="mobile-menu-actions">
              <div className="mobile-menu-section-label">SETTINGS</div>

              {/* Notifications Toggle */}
              <div className="mobile-action-btn" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="mobile-action-icon" style={{
                    background: notificationsEnabled ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                  }}>
                    {notificationsEnabled
                      ? <Bell size={15} color="white" />
                      : <BellOff size={15} style={{ color: 'var(--text-tertiary)' }} />}
                  </div>
                  <span style={{ color: notificationsEnabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    Notifications
                  </span>
                </div>
                <ToggleSwitch checked={notificationsEnabled} onChange={toggleNotifications} />
              </div>

              {/* Enable Push Notifications (if not granted) */}
              {permission !== 'granted' && (
                <button
                  className="mobile-action-btn"
                  onClick={() => { setMobileMenuOpen(false); askPermission(profile?.name); }}
                  id="mobile-notif-btn"
                >
                  <div className="mobile-action-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', animation: 'bellPulse 2s ease-in-out infinite' }}>
                    <BellRing size={15} color="white" />
                  </div>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Enable Push Notifications</span>
                </button>
              )}

              {/* Install App (Mobile Menu Fallback) */}
              {installPrompt && (
                <button
                  className="mobile-action-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    installPrompt.prompt();
                    installPrompt.userChoice.then((choice) => {
                      if (choice.outcome === 'accepted') setIsInstalled(true);
                      setInstallPrompt(null);
                    });
                  }}
                >
                  <div className="mobile-action-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <Download size={15} color="white" />
                  </div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Install App</span>
                </button>
              )}

              {/* App Lock */}
              <button
                className="mobile-action-btn"
                onClick={() => { setMobileMenuOpen(false); setShowLockModal(true); }}
                id="mobile-app-lock-btn"
              >
                <div className="mobile-action-icon" style={{
                  background: isLockEnabled
                    ? 'linear-gradient(135deg, var(--success-500), var(--success-600))'
                    : 'rgba(255,255,255,0.06)',
                }}>
                  {isLockEnabled
                    ? <Lock size={15} color="white" />
                    : <Shield size={15} style={{ color: 'var(--text-tertiary)' }} />}
                </div>
                <span style={{ color: isLockEnabled ? 'var(--success-400)' : 'var(--text-secondary)' }}>
                  App Lock {isLockEnabled ? '(On)' : '(Off)'}
                </span>
                {hasSetup && isLockEnabled && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--success-400)', fontWeight: 600 }}>
                    Active
                  </span>
                )}
              </button>

              {/* Lock Now (if enabled) */}
              {isLockEnabled && hasSetup && (
                <button
                  className="mobile-action-btn"
                  onClick={() => { setMobileMenuOpen(false); lockApp(); }}
                  id="mobile-lock-now-btn"
                >
                  <div className="mobile-action-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>
                    <Lock size={15} style={{ color: 'var(--accent-400)' }} />
                  </div>
                  <span style={{ color: 'var(--accent-400)' }}>Lock Now</span>
                </button>
              )}

              {/* Customize */}
              <button
                className="mobile-action-btn"
                onClick={() => { setMobileMenuOpen(false); setShowCustomizer(true); }}
                id="mobile-customize-btn"
              >
                <div className="mobile-action-icon" style={{ background: `linear-gradient(135deg, ${accentColor.primary}, ${accentColor.accent})` }}>
                  <Palette size={15} color="white" />
                </div>
                <span>Customize</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: accentColor.primary }} />
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: accentColor.accent }} />
                </div>
              </button>

              {/* Trash */}
              <button
                className="mobile-action-btn"
                onClick={() => { setMobileMenuOpen(false); navigate('/trash'); }}
                id="mobile-trash-btn"
              >
                <div className="mobile-action-icon" style={{ background: trashCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)' }}>
                  <Trash2 size={15} style={{ color: trashCount > 0 ? 'var(--danger-400)' : 'var(--text-tertiary)' }} />
                </div>
                <span style={{ color: trashCount > 0 ? 'var(--danger-400)' : 'var(--text-secondary)' }}>Trash</span>
                {trashCount > 0 && (
                  <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9, background: 'var(--danger-500)', color: 'white', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                    {trashCount}
                  </span>
                )}
              </button>

              {/* Sign Out / Sign In */}
              {user && user.uid !== 'local' ? (
                <button
                  className="mobile-action-btn mobile-action-danger"
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  id="mobile-signout-btn"
                >
                  <div className="mobile-action-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <LogOut size={15} style={{ color: 'var(--danger-400)' }} />
                  </div>
                  <span>Sign Out</span>
                </button>
              ) : user && user.uid === 'local' ? (
                <button
                  className="mobile-action-btn mobile-action-primary"
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  id="mobile-signin-btn"
                >
                  <div className="mobile-action-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <LogOut size={15} style={{ color: 'var(--primary-400)' }} />
                  </div>
                  <span>Sign In</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Color Customizer Modal */}
      <ColorCustomizer isOpen={showCustomizer} onClose={() => setShowCustomizer(false)} />

      {/* App Lock Settings Modal */}
      {showLockModal && <AppLockSettings onClose={() => setShowLockModal(false)} />}

      {/* ─── Mobile Bottom Nav Bar ─── */}
      <nav className="mobile-bottom-nav">
        {[
          { path: '/', icon: LayoutDashboard, label: 'Home' },
          { path: '/today', icon: CalendarCheck, label: 'Today' },
          { path: '/subjects', icon: BookOpen, label: 'Subjects' },
          { path: '/calculator', icon: Calculator, label: 'Calc' },
          { path: '/analytics', icon: TrendingUp, label: 'Analytics' },
          { path: '/calendar', icon: Calendar, label: 'Calendar' },
          { path: '/profile', icon: User, label: 'Profile' },
        ].map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`mobile-bottom-nav-item ${location.pathname === path ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

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
        .header-icon-btn {
          width: 36px; height: 36px; border-radius: var(--radius-sm);
          background: var(--bg-glass); border: 1px solid var(--border-primary);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);
        }
        .header-icon-btn:hover { background: var(--bg-glass-hover); color: var(--text-primary); transform: translateY(-1px); }
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
          padding: 12px 16px; border-bottom: 1px solid var(--border-primary);
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
          background: var(--bg-secondary); border-right: 1px solid var(--border-primary);
          padding: 20px; overflow-y: auto;
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
          transition: all var(--transition-fast); text-decoration: none;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: rgba(59,130,246,0.1); color: var(--primary-400);
        }
        .mobile-menu-actions {
          margin-top: 12px; padding-top: 12px;
          border-top: 1px solid var(--border-primary);
          display: flex; flex-direction: column; gap: 2px;
        }
        .mobile-menu-section-label {
          font-size: 0.62rem; font-weight: 700; color: var(--text-tertiary);
          text-transform: uppercase; letter-spacing: 0.12em; padding: 6px 14px 8px;
        }
        .mobile-action-btn {
          display: flex; align-items: center; gap: 12px; padding: 11px 14px;
          border-radius: var(--radius-sm); background: transparent; border: none;
          color: var(--text-secondary); font-size: 0.88rem; font-weight: 500;
          cursor: pointer; width: 100%; text-align: left;
          transition: all var(--transition-fast); font-family: inherit;
        }
        .mobile-action-btn:hover { background: var(--bg-glass-hover); color: var(--text-primary); }
        .mobile-action-btn.mobile-action-danger:hover { background: rgba(239,68,68,0.08); color: var(--danger-400); }
        .mobile-action-btn.mobile-action-primary:hover { background: rgba(59,130,246,0.08); color: var(--primary-400); }
        .mobile-action-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .app-header { left: 0; padding: 0 16px; }
          .mobile-menu-btn { display: flex; }
          .mobile-overlay { display: block; }
          .manit-header-badge { display: none; }
          /* Fixed notification panel on mobile — no overflow */
          .notif-panel {
            position: fixed;
            top: var(--header-height);
            left: 8px;
            right: 8px;
            width: auto;
            border-radius: 0 0 var(--radius-lg) var(--radius-lg);
            max-height: calc(100vh - var(--header-height) - 80px);
            overflow-y: auto;
          }
          .notif-permission-banner {
            left: 0; right: 0; border-radius: 0;
            flex-direction: column; gap: 10px; padding: 12px 16px;
          }
          .notif-banner-actions { width: 100%; justify-content: flex-end; }
          .notif-banner-desc { white-space: normal; }
          /* Hide desktop lock button on mobile */
          #app-lock-btn { display: none; }
          /* Save space for Install App button */
          .install-text { display: none; }
          .install-app-btn { padding: 8px; border-radius: 50%; width: 34px; height: 34px; justify-content: center; }
        }
        /* Pulsing bell when no permission */
        @keyframes bellPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
        }
        .notif-pulse {
          animation: bellPulse 2s ease-in-out infinite;
          border-color: var(--primary-400) !important;
          color: var(--primary-400) !important;
        }
        /* Notification Permission Banner */
        .notif-permission-banner {
          position: fixed; top: var(--header-height);
          left: var(--sidebar-width); right: 0; z-index: 88;
          display: flex; align-items: center; gap: 16px; padding: 14px 28px;
          background: linear-gradient(135deg,
            rgba(59,130,246,0.15) 0%,
            rgba(139,92,246,0.1) 50%,
            rgba(59,130,246,0.08) 100%
          );
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(59,130,246,0.25);
          box-shadow: 0 4px 24px rgba(59,130,246,0.12);
        }
        @media (max-width: 768px) {
          .notif-permission-banner { left: 0; }
        }
        .notif-banner-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(59,130,246,0.3);
          animation: bellPulse 2s ease-in-out infinite;
        }
        .notif-banner-content { flex: 1; min-width: 0; }
        .notif-banner-title { font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
        .notif-banner-desc { font-size: 0.78rem; color: var(--text-secondary); }
        .notif-banner-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .notif-banner-allow {
          padding: 8px 20px; border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
          color: white; font-size: 0.82rem; font-weight: 700; border: none;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 16px rgba(59,130,246,0.25); white-space: nowrap;
        }
        .notif-banner-dismiss {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.08); border: 1px solid var(--border-primary);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-tertiary); cursor: pointer;
        }
      `}</style>
    </>
  );
}
