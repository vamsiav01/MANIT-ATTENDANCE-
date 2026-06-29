import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Wheel from '@uiw/react-color-wheel';
import { hexToHsva, hsvaToHex } from '@uiw/color-convert';
import {
  User, Save, BookOpen, CloudOff, Cloud, Download, Upload,
  CheckCircle2, Loader2, AlertTriangle, RefreshCw, LogOut, Shield,
  Bell, BellOff, Lock, RotateCcw, Trash2,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useAppLock } from '../context/AppLockContext';
import { useTheme } from '../context/ThemeContext';
import { BRANCHES, YEARS, SECTIONS, SEMESTERS, PROGRAMS } from '../utils/sampleData';
import { getOverallPercentage, getSubjectPercentage } from '../utils/helpers';
import { AppLockSettings } from '../components/AppLock';
import { notifyMorningSchedule, notifyEveningSummary } from '../utils/notifications';

export default function Profile() {
  const { profile, subjects, schedule, updateProfile, syncStatus, lastSynced, exportBackup, importBackup, forceSyncNow, resetData } = useAttendance();
  const { user, signOut, deleteAccount, firebaseReady } = useAuth();
  const { permission, notificationsEnabled, toggleNotifications } = useNotifications();
  const { isLockEnabled, hasSetup, lockType, disableLock, enableLock, resetLock } = useAppLock();
  const { accentColor, setColorPreset, setCustomColor } = useTheme();
  const [formData, setFormData] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hsva, setHsva] = useState({ h: 214, s: 43, v: 90, a: 1 });
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const overall = getOverallPercentage(subjects);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      try {
        await deleteAccount();
      } catch (err) {
        alert(err.message || "Failed to delete account. Please sign out and sign in again.");
      }
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (file) importBackup(file);
    e.target.value = '';
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <Loader2 size={14} className="spin-icon" />;
      case 'synced': return <CheckCircle2 size={14} />;
      case 'error': return <AlertTriangle size={14} />;
      default: return <Cloud size={14} />;
    }
  };

  const getSyncColor = () => {
    switch (syncStatus) {
      case 'syncing': return 'var(--primary-400)';
      case 'synced': return 'var(--success-400)';
      case 'error': return 'var(--danger-400)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getSyncText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Syncing...';
      case 'synced': return lastSynced ? `Synced ${new Date(lastSynced).toLocaleTimeString()}` : 'Synced';
      case 'error': return 'Sync failed';
      default: return 'Not syncing';
    }
  };

  const isHttp = window.location.protocol === 'http:' && window.location.hostname !== 'localhost';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information, account, and backup settings.</p>
      </div>

      {/* Bottom padding so FAB doesn't overlap content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 12 : 16,
        alignItems: 'start',
        width: '100%',
        overflow: 'hidden',
        paddingBottom: isMobile ? 80 : 0,
      }}>
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, overflow: 'hidden' }}>

          {/* Personal Information */}
          <div className="glass-card" style={{ padding: isMobile ? 16 : 28 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <User size={18} style={{ color: 'var(--primary-400)' }} />
              Personal Information
            </h3>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} id="profile-name-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Scholar Number</label>
                  <input type="text" className="form-input" value={formData.scholarNo}
                    onChange={(e) => setFormData({ ...formData, scholarNo: e.target.value })} id="profile-scholar-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 12 }}>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="form-select" 
                      value={BRANCHES.includes(formData.branch) ? formData.branch : 'OTHER'}
                      onChange={(e) => {
                        if (e.target.value === 'OTHER') setFormData({ ...formData, branch: '' });
                        else setFormData({ ...formData, branch: e.target.value });
                      }} id="profile-branch-select">
                      <option value="" disabled>Select Branch</option>
                      {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                      <option value="OTHER">Other (Type Manually)</option>
                    </select>
                    {!BRANCHES.includes(formData.branch) && (
                      <input type="text" className="form-input" style={{ marginTop: 8 }} placeholder="Type branch name..." 
                        value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} 
                        id="profile-branch-input" autoFocus />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Program</label>
                    <select className="form-select" value={formData.program || ''}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      id="profile-program-input">
                      {PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: isMobile ? 8 : 12 }}>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <select className="form-select" 
                      value={SECTIONS.includes(formData.section) ? formData.section : 'OTHER'}
                      onChange={(e) => {
                        if (e.target.value === 'OTHER') setFormData({ ...formData, section: '' });
                        else setFormData({ ...formData, section: e.target.value });
                      }} id="profile-section-select">
                      <option value="" disabled>Select Section</option>
                      {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="OTHER">Other</option>
                    </select>
                    {!SECTIONS.includes(formData.section) && (
                      <input type="text" className="form-input" style={{ marginTop: 8 }} placeholder="Type section..." 
                        value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })} 
                        id="profile-section-input" autoFocus />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select className="form-select" value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      id="profile-year-input">
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select className="form-select" value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) || e.target.value })}
                      id="profile-semester-input">
                      {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" id="save-profile-btn"
                style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
                <Save size={16} /> {saved ? 'Saved ✓' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Account & Backup */}
          <div className="glass-card" style={{ padding: isMobile ? 16 : 28 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Shield size={18} style={{ color: 'var(--accent-400)' }} />
              Account &amp; Backup
            </h3>

            {user && user.uid !== 'local' ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                borderRadius: 'var(--radius-md)', background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.15)', marginBottom: 16,
              }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.82rem',
                  }}>{user.displayName?.[0]?.toUpperCase() || '?'}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user.displayName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                  {user.provider === 'google.com' ? 'Google' : 'Email'}
                </span>
              </div>
            ) : (
              <div style={{
                padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.15)', marginBottom: 16,
                fontSize: '0.82rem', color: 'var(--warning-400)',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <CloudOff size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ wordBreak: 'break-word', lineHeight: 1.5 }}>Guest mode — data saved locally only. Sign in to enable cloud backup.</span>
              </div>
            )}

            {user && user.uid !== 'local' && firebaseReady && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: getSyncColor() }}>
                  {getSyncIcon()}
                  <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{getSyncText()}</span>
                </div>
                <motion.button className="btn btn-ghost btn-sm" onClick={forceSyncNow}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{ color: 'var(--primary-400)' }}>
                  <RefreshCw size={14} /> Sync Now
                </motion.button>
              </div>
            )}

            {/* Backup Buttons — stack on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <motion.button className="btn btn-outline" onClick={exportBackup}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ justifyContent: 'center' }} id="export-backup-btn">
                <Download size={16} /> Export JSON
              </motion.button>
              <motion.button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ justifyContent: 'center' }} id="import-backup-btn">
                <Upload size={16} /> Import JSON
              </motion.button>
            </div>
            <motion.button className="btn btn-outline" onClick={resetData}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ justifyContent: 'center', width: '100%', borderColor: 'rgba(239,68,68,0.5)', color: 'var(--danger-400)' }} id="reset-data-btn">
              <RotateCcw size={16} /> Reset App Data
            </motion.button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" style={{ display: 'none' }} />
            <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Export/Import your data as a JSON file for manual backup.
            </p>

            {user && user.uid !== 'local' && (
              <>
                <motion.button className="btn btn-outline" onClick={signOut}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 16, borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.05)' }} whileTap={{ scale: 0.98 }} id="profile-sign-out-btn">
                  <LogOut size={16} /> Sign Out
                </motion.button>
                <motion.button className="btn btn-danger" onClick={handleDeleteAccount}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} id="profile-delete-account-btn">
                  <Trash2 size={16} /> Delete Account
                </motion.button>
              </>
            )}

            {user && user.uid === 'local' && (
              <motion.button className="btn btn-outline" onClick={handleDeleteAccount}
                style={{ width: '100%', justifyContent: 'center', marginTop: 16, borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger-400)' }}
                whileHover={{ scale: 1.02, background: 'rgba(239,68,68,0.1)' }} whileTap={{ scale: 0.98 }} id="profile-delete-guest-btn">
                <Trash2 size={16} /> Delete Guest Data
              </motion.button>
            )}
          </div>

          {/* Settings: Notifications + App Lock */}
          <div className="glass-card" style={{ padding: isMobile ? 16 : 22 }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Shield size={16} style={{ color: 'var(--primary-400)' }} />
              Settings
            </h3>

            {/* Theme Settings */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Theme Accent</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { name: 'Ocean Blue', primary: '#3b82f6', accent: '#8b5cf6' },
                  { name: 'Midnight Violet', primary: '#8b5cf6', accent: '#ec4899' },
                  { name: 'Sakura Pink', primary: '#f43f5e', accent: '#f97316' },
                  { name: 'Forest Green', primary: '#10b981', accent: '#3b82f6' },
                  { name: 'Cyber Yellow', primary: '#eab308', accent: '#f97316' }
                ].map((preset) => (
                  <motion.button
                    key={preset.name}
                    type="button"
                    onClick={() => setColorPreset(preset)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})`,
                      border: accentColor?.name === preset.name ? '2px solid var(--text-primary)' : '2px solid var(--bg-secondary)',
                      boxShadow: '0 0 0 2px var(--border-primary)',
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    title={preset.name}
                  />
                ))}
                
                {/* Custom Color Wheel */}
                <div style={{ position: 'relative' }}>
                  <motion.div 
                    style={{ position: 'relative', width: 32, height: 32, cursor: 'pointer' }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    title="Custom Color"
                    onClick={() => {
                      if (accentColor?.name === 'Custom') {
                        try { setHsva(hexToHsva(accentColor.primary)); } catch(e) {}
                      }
                      setShowColorPicker(!showColorPicker);
                    }}
                  >
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: accentColor?.name === 'Custom' ? accentColor.primary : 'conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)',
                        border: accentColor?.name === 'Custom' ? '2px solid var(--text-primary)' : '2px solid var(--bg-secondary)',
                        boxShadow: '0 0 0 2px var(--border-primary)',
                        pointerEvents: 'none'
                      }}
                    />
                  </motion.div>

                  <AnimatePresence>
                    {showColorPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                          position: 'absolute', top: 40, left: isMobile ? -140 : 0, zIndex: 50,
                          background: 'var(--bg-card)', padding: 16, borderRadius: 16,
                          border: '1px solid var(--border-secondary)',
                          boxShadow: 'var(--shadow-lg)'
                        }}
                      >
                        <Wheel 
                          color={hsva}
                          onChange={(color) => {
                            setHsva({ ...hsva, ...color.hsva });
                            const hex = hsvaToHex({ ...hsva, ...color.hsva });
                            setCustomColor(hex, hex);
                          }}
                        />
                        <button 
                          onClick={() => setShowColorPicker(false)}
                          style={{
                            marginTop: 12, width: '100%', padding: '8px', borderRadius: 8,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600
                          }}
                        >
                          Done
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Notifications</p>

              {permission === 'unsupported' ? (
                <div style={{
                  padding: 14, borderRadius: 10,
                  background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
                  fontSize: '0.78rem', color: 'var(--warning-400)', lineHeight: 1.6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} /> Push Not Supported
                  </div>
                  Your browser or current connection does not support push notifications. In-app alerts will still work!
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)',
                    marginBottom: 8, overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {notificationsEnabled
                        ? <Bell size={16} style={{ color: 'var(--primary-400)' }} />
                        : <BellOff size={16} style={{ color: 'var(--text-tertiary)' }} />}
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Push Notifications</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Low attendance &amp; daily reminders</div>
                      </div>
                    </div>
                    <label className="native-toggle" htmlFor="profile-notif-toggle" title={notificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}>
                      <input
                        type="checkbox"
                        id="profile-notif-toggle"
                        checked={notificationsEnabled}
                        onChange={() => toggleNotifications(profile.name)}
                      />
                      <span className="native-toggle-track" />
                      <span className="native-toggle-thumb" />
                    </label>
                  </div>
                  {permission === 'default' && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--primary-400)' }}>
                      <Bell size={14} /> Toggle ON above to enable push notifications
                    </div>
                  )}
                  {permission === 'denied' && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.73rem', color: 'var(--danger-400)', lineHeight: 1.6 }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>Blocked. Go to <b>Phone Settings → Apps → Chrome → Notifications</b> and tap Allow, then toggle ON here.</span>
                    </div>
                  )}
                  {permission === 'granted' && notificationsEnabled && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--success-400)' }}>
                      <CheckCircle2 size={14} /> Push notifications are active
                    </div>
                  )}
                  {permission === 'granted' && !notificationsEnabled && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--warning-400)' }}>
                      <BellOff size={14} /> Paused — toggle ON to re-enable
                    </div>
                  )}
                  {permission === 'granted' && notificationsEnabled && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button
                        onClick={() => {
                          const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                          const todayItems = schedule[todayName] || [];
                          const todaySubjects = todayItems.map(id => subjects.find(s => s.id === id)).filter(Boolean);
                          notifyMorningSchedule(todaySubjects, subjects);
                        }}
                        style={{ flex: 1, background: 'rgba(59,130,246,0.1)', color: 'var(--primary-400)', border: '1px solid rgba(59,130,246,0.2)', padding: '10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Test Morning Alert
                      </button>
                      <button
                        onClick={() => {
                          const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                          const todayItems = schedule[todayName] || [];
                          const todaySubjects = todayItems.map(id => subjects.find(s => s.id === id)).filter(Boolean);
                          const overallPct = getOverallPercentage(subjects);
                          // Mocking all attended for the test
                          notifyEveningSummary(true, 0, overallPct, todaySubjects.length, 0);
                        }}
                        style={{ flex: 1, background: 'rgba(139,92,246,0.1)', color: 'var(--accent-400)', border: '1px solid rgba(139,92,246,0.2)', padding: '10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Test Evening Alert
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* App Lock */}
            <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-primary)' }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>App Lock</p>
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: isLockEnabled ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isLockEnabled ? 'rgba(34,197,94,0.2)' : 'var(--border-primary)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Lock size={16} style={{ color: isLockEnabled ? 'var(--success-400)' : 'var(--text-tertiary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      App Lock {isLockEnabled ? <span style={{ color: 'var(--success-400)' }}>ON</span> : <span style={{ color: 'var(--text-tertiary)' }}>OFF</span>}
                    </div>
                    {hasSetup && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        Type: {lockType?.charAt(0).toUpperCase() + lockType?.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
                {hasSetup && (
                  <label className="native-toggle toggle-success" htmlFor="profile-lock-toggle" title={isLockEnabled ? 'Lock ON' : 'Lock OFF'}>
                    <input
                      type="checkbox"
                      id="profile-lock-toggle"
                      checked={isLockEnabled}
                      onChange={isLockEnabled ? disableLock : enableLock}
                    />
                    <span className="native-toggle-track" />
                    <span className="native-toggle-thumb" />
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  onClick={() => setShowLockModal(true)}
                  whileTap={{ scale: 0.96 }}
                  id="profile-setup-lock-btn"
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                    border: 'none', color: 'white', fontWeight: 600, fontSize: '0.82rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Shield size={14} /> {hasSetup ? 'Change Lock' : 'Set Up Lock'}
                </motion.button>
                {hasSetup && (
                  <motion.button
                    onClick={() => { if (window.confirm('Reset App Lock? This will turn off all lock protection.')) resetLock(); }}
                    whileTap={{ scale: 0.96 }}
                    id="profile-reset-lock-btn"
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      color: 'var(--danger-400)', fontWeight: 600, fontSize: '0.82rem',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <RotateCcw size={14} /> Reset Lock
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN — shown first on mobile ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, order: isMobile ? -1 : 0, minWidth: 0, overflow: 'hidden' }}>

          {/* Profile Summary Card */}
          <div className="glass-card" style={{ padding: isMobile ? '20px 16px' : 28, textAlign: 'center' }}>
            <div style={{
              width: isMobile ? 64 : 80, height: isMobile ? 64 : 80,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: isMobile ? '1rem' : '1.2rem',
              margin: '0 auto 12px', boxShadow: '0 0 30px rgba(59,130,246,0.2)',
              overflow: 'hidden',
            }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.name}</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', marginTop: 4 }}>
              Scholar No: {profile.scholarNo}
            </p>

            {/* Badges — split into 2 rows to prevent overflow */}
            <div style={{ marginTop: 12 }}>
              {/* Row 1: Program + Branch */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 6 }}>
                {profile.program && (
                  <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger-400)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {profile.program}
                  </span>
                )}
                {/* Show wrapped branch to avoid cutoff */}
                <span className="badge badge-info" style={{ whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.2 }}>
                  {profile.branch}
                </span>
              </div>
              {/* Row 2: Section, Year, Semester */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-warning">Sec {profile.section}</span>
                <span className="badge badge-success">Year {profile.year}</span>
                <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--accent-400)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  Sem {profile.semester}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: '16px 0', borderTop: '1px solid var(--border-primary)' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Overall Attendance
              </p>
              <span style={{
                fontSize: '2.5rem', fontWeight: 800,
                color: overall >= 75 ? '#22c55e' : overall >= 60 ? '#eab308' : '#ef4444',
              }}>{overall}%</span>
            </div>
          </div>

          {/* Subject Summary */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <BookOpen size={16} style={{ color: 'var(--accent-400)' }} />
              Subject Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subjects.map((sub) => {
                const pct = getSubjectPercentage(sub);
                const pctColor = pct >= 75 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444';
                return (
                  <div key={sub.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.03)',
                    width: '100%', boxSizing: 'border-box',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sub.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub.name || sub.code}
                      {sub.name && sub.code !== sub.name && (
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 4 }}>({sub.code})</span>
                      )}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', flexShrink: 0, color: pctColor }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* App Lock Modal */}
      {showLockModal && <AppLockSettings onClose={() => setShowLockModal(false)} />}
    </motion.div>
  );
}
