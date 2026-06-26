import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, BookOpen, Plus, X, ChevronRight, ChevronLeft,
  GraduationCap, CheckCircle2, Sparkles,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { BRANCHES, YEARS, SECTIONS, SEMESTERS, PROGRAMS } from '../utils/sampleData';

const SUBJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#22c55e', '#f97316',
  '#eab308', '#ef4444', '#14b8a6', '#ec4899',
  '#6366f1', '#06b6d4',
];

const STEPS = [
  { id: 'welcome', title: 'Welcome!', icon: Sparkles },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'done', title: "You're All Set!", icon: CheckCircle2 },
];

function StepIndicator({ currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
      {STEPS.map((step, i) => {
        const active = i === currentStep;
        const done = i < currentStep;
        return (
          <React.Fragment key={step.id}>
            <div style={{
              width: active ? 32 : 28, height: active ? 32 : 28,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? 'var(--success-500)' : active ? 'var(--primary-500)' : 'rgba(255,255,255,0.08)',
              border: `2px solid ${done ? 'var(--success-500)' : active ? 'var(--primary-500)' : 'rgba(255,255,255,0.15)'}`,
              transition: 'all 0.3s', fontSize: '0.72rem', fontWeight: 700, color: 'white',
            }}>
              {done ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                height: 2, width: 32,
                background: done ? 'var(--success-500)' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OnboardingWizard() {
  const { completeOnboarding } = useAttendance();
  const [step, setStep] = useState(0);

  const [profileData, setProfileData] = useState({
    name: '', scholarNo: '', branch: 'Computer Science & Engineering',
    program: 'Bachelor', section: 'A', year: 3, semester: 5,
  });

  const [subjects, setSubjects] = useState([]);
  const [newSub, setNewSub] = useState({ name: '', code: '', teacher: '' });
  const [addingSubject, setAddingSubject] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);

  const canGoNext = () => {
    if (step === 1) return profileData.name.trim().length > 0 && profileData.scholarNo.trim().length > 0;
    return true;
  };

  const addSubject = () => {
    if (!newSub.name.trim()) return;
    const sub = {
      id: `sub_${Date.now()}`,
      name: newSub.name.trim(),
      code: newSub.code.trim().toUpperCase(),
      teacher: newSub.teacher.trim(),
      days: [],
      periodsPerDay: {},
      totalClasses: 0,
      attended: 0,
      color: SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length],
    };
    setSubjects(prev => [...prev, sub]);
    setNewSub({ name: '', code: '', teacher: '' });
    setColorIdx(prev => prev + 1);
    setAddingSubject(false);
  };

  const removeSubject = (id) => setSubjects(prev => prev.filter(s => s.id !== id));

  const finish = () => {
    completeOnboarding(profileData, subjects);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, rgba(10,14,26,0.98) 0%, rgba(20,10,40,0.98) 100%)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '90vh',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24, padding: 32, overflowY: 'auto',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(59,130,246,0.4)',
          }}>
            {React.createElement(STEPS[step].icon, { size: 24, color: 'white' })}
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{STEPS[step].title}</h2>
        </div>

        <StepIndicator currentStep={step} />

        <AnimatePresence mode="wait">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
                Welcome to <strong style={{ color: 'var(--primary-400)' }}>MANIT Attendance Tracker</strong>!<br />
                Let's set up your account in 2 quick steps.<br />
                You can change everything later in your Profile.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { emoji: '📊', text: 'Track attendance for all your subjects' },
                  { emoji: '🔔', text: 'Get smart alerts when attendance drops' },
                  { emoji: '🤖', text: 'Ask the AI for advice anytime' },
                  { emoji: '📅', text: 'View your attendance calendar history' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Profile */}
          {step === 1 && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" type="text" placeholder="e.g. Rahul Sharma"
                    value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} id="onboard-name" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Scholar Number *</label>
                  <input className="form-input" type="text" placeholder="e.g. 2210110001"
                    value={profileData.scholarNo} onChange={e => setProfileData(p => ({ ...p, scholarNo: e.target.value }))} id="onboard-scholar" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="form-select" 
                      value={BRANCHES.includes(profileData.branch) ? profileData.branch : 'OTHER'}
                      onChange={(e) => {
                        if (e.target.value === 'OTHER') setProfileData({ ...profileData, branch: '' });
                        else setProfileData({ ...profileData, branch: e.target.value });
                      }} id="onboard-branch-select">
                      <option value="" disabled>Select Branch</option>
                      {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                      <option value="OTHER">Other (Type Manually)</option>
                    </select>
                    {!BRANCHES.includes(profileData.branch) && (
                      <motion.input initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        type="text" className="form-input" style={{ marginTop: 8 }} placeholder="Type your branch..." 
                        value={profileData.branch} onChange={(e) => setProfileData({ ...profileData, branch: e.target.value })} 
                        id="onboard-branch-input" autoFocus />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Program</label>
                    <select className="form-select" value={profileData.program} onChange={e => setProfileData(p => ({ ...p, program: e.target.value }))} id="onboard-program">
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <select className="form-select" 
                      value={SECTIONS.includes(profileData.section) ? profileData.section : 'OTHER'}
                      onChange={(e) => {
                        if (e.target.value === 'OTHER') setProfileData({ ...profileData, section: '' });
                        else setProfileData({ ...profileData, section: e.target.value });
                      }} id="onboard-section-select">
                      <option value="" disabled>Select</option>
                      {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="OTHER">Other</option>
                    </select>
                    {!SECTIONS.includes(profileData.section) && (
                      <motion.input initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        type="text" className="form-input" style={{ marginTop: 8 }} placeholder="Type section..." 
                        value={profileData.section} onChange={(e) => setProfileData({ ...profileData, section: e.target.value.toUpperCase() })} 
                        id="onboard-section-input" autoFocus />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select className="form-select" value={profileData.year} onChange={e => setProfileData(p => ({ ...p, year: e.target.value }))} id="onboard-year">
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select className="form-select" value={profileData.semester} onChange={e => setProfileData(p => ({ ...p, semester: e.target.value }))} id="onboard-semester">
                      {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Done */}
          {step === 2 && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <CheckCircle2 size={40} style={{ color: 'var(--success-400)' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Profile Created!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>
                  You're ready to start tracking your attendance. You can add your subjects from the Dashboard or My Subjects page.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)', padding: 16, borderRadius: 12, textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Next Steps:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={12} style={{ color: 'var(--primary-400)' }} />
                      </div>
                      <span style={{ fontSize: '0.88rem' }}>Add your subjects & time table</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GraduationCap size={12} style={{ color: 'var(--accent-400)' }} />
                      </div>
                      <span style={{ fontSize: '0.88rem' }}>Maintain 75% attendance!</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          {step > 0 && step < 2 && (
            <button onClick={() => setStep(s => s - 1)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} id="onboard-back-btn">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < 2 && (
            <button onClick={() => setStep(s => s + 1)} disabled={!canGoNext()} className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', opacity: canGoNext() ? 1 : 0.5 }} id="onboard-next-btn">
              Next <ChevronRight size={16} />
            </button>
          )}
          {step === 2 && (
            <button onClick={finish} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '1rem' }} id="onboard-finish-btn">
              <Sparkles size={18} /> Start Tracking!
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
