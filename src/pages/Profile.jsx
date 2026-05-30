import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Save, GraduationCap, BookOpen, Cloud, CloudOff, Download, Upload,
  CheckCircle2, Loader2, AlertTriangle, RefreshCw, LogOut, Shield,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { BRANCHES, YEARS, SECTIONS } from '../utils/sampleData';
import { getOverallPercentage, getSubjectPercentage, getPctClass } from '../utils/helpers';

export default function Profile() {
  const { profile, subjects, updateProfile, syncStatus, lastSynced, exportBackup, importBackup, forceSyncNow } = useAttendance();
  const { user, signOut, firebaseReady } = useAuth();
  const [formData, setFormData] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const overall = getOverallPercentage(subjects);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      <div className="grid-2">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile Form */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <User size={18} style={{ color: 'var(--primary-400)' }} />
              Personal Information
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="form-select" value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })} id="profile-branch-select">
                      {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <select className="form-select" value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })} id="profile-section-select">
                      {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select className="form-select" value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} id="profile-year-select">
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <input type="number" className="form-input" min="1" max="8" value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })} id="profile-semester-input" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" id="save-profile-btn"
                style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
                <Save size={16} /> {saved ? 'Saved ✓' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Account & Backup */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Shield size={18} style={{ color: 'var(--accent-400)' }} />
              Account & Backup
            </h3>

            {/* Account Info */}
            {user && user.uid !== 'local' ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 16,
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user.displayName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{user.email}</div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  {user.provider === 'google.com' ? 'Google' : 'Email'}
                </span>
              </div>
            ) : (
              <div style={{
                padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.15)', marginBottom: 16,
                fontSize: '0.82rem', color: 'var(--warning-400)',
              }}>
                <CloudOff size={14} style={{ marginRight: 6 }} />
                Guest mode — data saved locally only. Sign in to enable cloud backup.
              </div>
            )}

            {/* Sync Status */}
            {user && user.uid !== 'local' && firebaseReady && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
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

            {/* Backup Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
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
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Export/Import your data as a JSON file for manual backup.
            </p>

            {/* Sign Out */}
            {user && user.uid !== 'local' && (
              <motion.button className="btn btn-danger" onClick={signOut}
                style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} id="profile-sign-out-btn">
                <LogOut size={16} /> Sign Out
              </motion.button>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Overall Card */}
          <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1.2rem',
              margin: '0 auto 16px', boxShadow: '0 0 30px rgba(59,130,246,0.2)',
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
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <span className="badge badge-info">{profile.branch}</span>
              <span className="badge badge-warning">Sec {profile.section}</span>
              <span className="badge badge-success">Year {profile.year}</span>
              <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--accent-400)', border: '1px solid rgba(139,92,246,0.2)' }}>
                Sem {profile.semester}
              </span>
            </div>
            <div style={{ marginTop: 20, padding: '16px 0', borderTop: '1px solid var(--border-primary)' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Overall Attendance
              </p>
              <span className={getPctClass(overall)} style={{ fontSize: '2.5rem', fontWeight: 800 }}>{overall}%</span>
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
                return (
                  <div key={sub.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.03)',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: sub.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500 }}>{sub.code}</span>
                    <span className={getPctClass(pct)} style={{ fontWeight: 700, fontSize: '0.82rem' }}>{pct}%</span>
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
    </motion.div>
  );
}
