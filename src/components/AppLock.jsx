import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Key, Shield, Mic, Fingerprint, Eye, EyeOff,
  Delete, CheckCircle2, XCircle, AlertTriangle, RotateCcw,
  GraduationCap, Loader2,
} from 'lucide-react';
import { useAppLock } from '../context/AppLockContext';

/* ─── Pattern Grid Component ─── */
const PATTERN_DOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function PatternGrid({ onComplete, isSetup }) {
  const svgRef = useRef(null);
  const [selected, setSelected] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const dotRefs = useRef([]);

  const getDotCenter = (idx) => {
    const el = dotRefs.current[idx];
    if (!el || !svgRef.current) return null;
    const svgRect = svgRef.current.getBoundingClientRect();
    const dotRect = el.getBoundingClientRect();
    return {
      x: dotRect.left - svgRect.left + dotRect.width / 2,
      y: dotRect.top - svgRect.top + dotRect.height / 2,
    };
  };

  const handlePointerDown = (idx) => {
    setSelected([idx]);
    setDrawing(true);
  };

  const handlePointerMove = useCallback((e) => {
    if (!drawing || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const cy = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    setCurrentPos({ x: cx, y: cy });

    // Hit-test dots
    PATTERN_DOTS.forEach((idx) => {
      if (selected.includes(idx)) return;
      const center = getDotCenter(idx);
      if (!center) return;
      const dist = Math.hypot(cx - center.x, cy - center.y);
      if (dist < 28) {
        setSelected((prev) => [...prev, idx]);
      }
    });
  }, [drawing, selected]);

  const handlePointerUp = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    setCurrentPos(null);
    if (selected.length >= 4) {
      onComplete(selected.join(''));
    }
    setTimeout(() => setSelected([]), 600);
  }, [drawing, selected, onComplete]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const COLS = 3;
  const SIZE = 220;
  const PADDING = 40;
  const STEP = (SIZE - PADDING * 2) / (COLS - 1);

  const getDotPos = (idx) => ({
    x: PADDING + (idx % COLS) * STEP,
    y: PADDING + Math.floor(idx / COLS) * STEP,
  });

  return (
    <div style={{ position: 'relative', userSelect: 'none', touchAction: 'none' }}>
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        style={{ display: 'block', margin: '0 auto' }}
      >
        {/* Lines between selected dots */}
        {selected.map((idx, i) => {
          if (i === 0) return null;
          const from = getDotPos(selected[i - 1]);
          const to = getDotPos(idx);
          return (
            <line
              key={`line-${i}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke="rgba(59,130,246,0.6)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
        {/* Live drawing line */}
        {drawing && selected.length > 0 && currentPos && (() => {
          const last = getDotPos(selected[selected.length - 1]);
          return (
            <line
              x1={last.x} y1={last.y}
              x2={currentPos.x} y2={currentPos.y}
              stroke="rgba(59,130,246,0.35)"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          );
        })()}
        {/* Dots */}
        {PATTERN_DOTS.map((idx) => {
          const pos = getDotPos(idx);
          const isSelected = selected.includes(idx);
          const selOrder = selected.indexOf(idx);
          return (
            <g key={idx}>
              <circle
                cx={pos.x} cy={pos.y} r={18}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerDown={() => handlePointerDown(idx)}
              />
              <circle
                cx={pos.x} cy={pos.y} r={isSelected ? 12 : 8}
                fill={isSelected ? 'var(--primary-500)' : 'rgba(255,255,255,0.15)'}
                stroke={isSelected ? 'var(--primary-400)' : 'rgba(255,255,255,0.25)'}
                strokeWidth={2}
                style={{ transition: 'all 0.15s' }}
              />
              {isSelected && (
                <circle
                  cx={pos.x} cy={pos.y} r={5}
                  fill="white"
                />
              )}
            </g>
          );
        })}
      </svg>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
        {selected.length === 0
          ? isSetup ? 'Draw your pattern (min 4 dots)' : 'Draw pattern to unlock'
          : `${selected.length} dots selected`}
      </p>
    </div>
  );
}

/* ─── PIN Pad ─── */
function PinPad({ onComplete, isSetup }) {
  const [pin, setPin] = useState('');
  const MAX = 4;

  const press = (d) => {
    if (pin.length >= MAX) return;
    const next = pin + d;
    setPin(next);
    if (next.length === MAX) {
      onComplete(next);
      setTimeout(() => setPin(''), 500);
    }
  };

  const del = () => setPin((p) => p.slice(0, -1));

  const KEYS = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [null, 0, 'del'],
  ];

  return (
    <div>
      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
        {Array.from({ length: MAX }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: pin.length > i ? 1.2 : 1 }}
            style={{
              width: 18, height: 18, borderRadius: '50%',
              background: pin.length > i ? 'var(--primary-500)' : 'rgba(255,255,255,0.15)',
              border: '2px solid ' + (pin.length > i ? 'var(--primary-400)' : 'rgba(255,255,255,0.25)'),
              transition: 'all 0.15s',
            }}
          />
        ))}
      </div>
      {/* Numpad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 220, margin: '0 auto' }}>
        {KEYS.flat().map((k, i) => {
          if (k === null) return <div key={i} />;
          if (k === 'del') return (
            <motion.button key={i} onClick={del}
              whileTap={{ scale: 0.88 }}
              style={{
                height: 60, borderRadius: 12, fontSize: '0.8rem',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--danger-400)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Delete size={18} />
            </motion.button>
          );
          return (
            <motion.button key={i} onClick={() => press(k.toString())}
              whileTap={{ scale: 0.88 }}
              style={{
                height: 60, borderRadius: 12, fontSize: '1.3rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {k}
            </motion.button>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 14 }}>
        {isSetup ? 'Choose a 4-digit PIN' : 'Enter your 4-digit PIN'}
      </p>
    </div>
  );
}

/* ─── Voice Lock ─── */
function VoiceLock({ onComplete, isSetup }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'done' | 'error'
  const [transcript, setTranscript] = useState('');
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = () => {
    if (!supported) return;
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setStatus('listening');
    rec.start();
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript.trim().toLowerCase();
      setTranscript(t);
      setStatus('done');
      onComplete(t);
    };
    rec.onerror = () => setStatus('error');
    rec.onend = () => {
      if (status === 'listening') setStatus('idle');
    };
  };

  if (!supported) return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <AlertTriangle size={32} style={{ color: 'var(--warning-400)', margin: '0 auto 12px' }} />
      <p style={{ color: 'var(--warning-400)', fontSize: '0.85rem' }}>Voice recognition not supported in this browser.</p>
    </div>
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.button
        onClick={startListening}
        whileTap={{ scale: 0.92 }}
        animate={status === 'listening' ? { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 1 } } : {}}
        style={{
          width: 90, height: 90, borderRadius: '50%', margin: '0 auto 20px',
          background: status === 'listening'
            ? 'linear-gradient(135deg, var(--danger-500), var(--danger-600))'
            : 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white',
          boxShadow: status === 'listening'
            ? '0 0 0 12px rgba(239,68,68,0.15), 0 0 0 24px rgba(239,68,68,0.07)'
            : '0 0 30px rgba(59,130,246,0.3)',
        }}
      >
        <Mic size={36} />
      </motion.button>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 8 }}>
        {status === 'idle' && (isSetup ? 'Tap to record your voice passphrase' : 'Tap to speak your passphrase')}
        {status === 'listening' && 'Listening... speak now'}
        {status === 'done' && `Captured: "${transcript}"`}
        {status === 'error' && 'Could not detect voice. Try again.'}
      </p>
      {isSetup && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
          Speak clearly, e.g. "Open MANIT attendance"
        </p>
      )}
    </div>
  );
}

/* ─── Biometric (WebAuthn) ─── */
function BiometricLock({ onComplete, isSetup }) {
  const [status, setStatus] = useState('idle');
  const [supported] = useState(() => !!window.PublicKeyCredential);

  const handleBiometric = async () => {
    if (!supported) return;
    setStatus('scanning');
    try {
      if (isSetup) {
        // Register
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const cred = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'MANIT Attendance' },
            user: {
              id: new TextEncoder().encode('manit-user'),
              name: 'manit@student.com',
              displayName: 'MANIT Student',
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
          },
        });
        if (cred) {
          localStorage.setItem('manit_biometric_id', btoa(String.fromCharCode(...new Uint8Array(cred.rawId))));
          setStatus('success');
          onComplete('BIOMETRIC_SETUP');
        }
      } else {
        // Authenticate
        const storedId = localStorage.getItem('manit_biometric_id');
        if (!storedId) { setStatus('error'); return; }
        const rawId = Uint8Array.from(atob(storedId), c => c.charCodeAt(0));
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{ id: rawId, type: 'public-key' }],
            userVerification: 'required',
            timeout: 60000,
          },
        });
        if (assertion) {
          setStatus('success');
          onComplete('BIOMETRIC_AUTH');
        }
      }
    } catch (err) {
      setStatus('error');
    }
  };

  if (!supported) return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <AlertTriangle size={32} style={{ color: 'var(--warning-400)', margin: '0 auto 12px' }} />
      <p style={{ color: 'var(--warning-400)', fontSize: '0.85rem' }}>
        Biometric auth not supported on this device/browser.
      </p>
    </div>
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.button
        onClick={handleBiometric}
        whileTap={{ scale: 0.92 }}
        animate={status === 'scanning' ? { scale: [1, 1.06, 1], transition: { repeat: Infinity, duration: 1.2 } } : {}}
        style={{
          width: 90, height: 90, borderRadius: '50%', margin: '0 auto 20px',
          background: status === 'success'
            ? 'linear-gradient(135deg, var(--success-500), var(--success-600))'
            : status === 'error'
            ? 'linear-gradient(135deg, var(--danger-500), var(--danger-600))'
            : 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white',
          boxShadow: '0 0 30px rgba(59,130,246,0.3)',
        }}
      >
        {status === 'scanning' ? <Loader2 size={36} className="spin-icon" /> :
         status === 'success' ? <CheckCircle2 size={36} /> :
         status === 'error' ? <XCircle size={36} /> :
         <Fingerprint size={36} />}
      </motion.button>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 8 }}>
        {status === 'idle' && (isSetup ? 'Tap to register your fingerprint/face' : 'Tap to authenticate')}
        {status === 'scanning' && 'Scanning...'}
        {status === 'success' && 'Authenticated successfully!'}
        {status === 'error' && 'Authentication failed. Try again.'}
      </p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
        Uses your device fingerprint, face ID, or PIN
      </p>
    </div>
  );
}

/* ─── Password Input ─── */
function PasswordLock({ onComplete, isSetup }) {
  const [val, setVal] = useState('');
  const [show, setShow] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (val.length >= 4) {
      onComplete(val);
      setVal('');
    }
  };

  return (
    <div>
      <form onSubmit={submit}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            type={show ? 'text' : 'password'}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={isSetup ? 'Create password (min 4 chars)' : 'Enter password'}
            autoFocus
            style={{
              width: '100%', padding: '14px 44px 14px 16px',
              borderRadius: 12, fontSize: '1rem',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-primary)', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button type="button" onClick={() => setShow(!show)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
            }}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <motion.button type="submit"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          disabled={val.length < 4}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700,
            background: val.length >= 4
              ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))'
              : 'rgba(255,255,255,0.05)',
            border: 'none', color: val.length >= 4 ? 'white' : 'var(--text-tertiary)',
            cursor: val.length >= 4 ? 'pointer' : 'not-allowed', fontSize: '0.95rem',
            fontFamily: 'inherit',
          }}
        >
          {isSetup ? 'Set Password' : 'Unlock'}
        </motion.button>
      </form>
    </div>
  );
}

/* ─── MAIN APP LOCK SCREEN ─── */
const LOCK_TABS = [
  { id: 'pin', label: 'PIN', icon: '🔢' },
  { id: 'pattern', label: 'Pattern', icon: '⚪' },
  { id: 'password', label: 'Password', icon: '🔑' },
  { id: 'biometric', label: 'Biometric', icon: '🤚' },
  { id: 'voice', label: 'Voice', icon: '🎙️' },
];

export function AppLockScreen() {
  const { lockType, isLocked, unlock, unlockDirect, hasSetup } = useAppLock();
  const [activeTab, setActiveTab] = useState(lockType);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { setActiveTab(lockType); }, [lockType]);

  const handleCredential = async (credential) => {
    if (credential === 'BIOMETRIC_AUTH' || credential === 'VOICE_AUTH') {
      unlockDirect();
      return;
    }
    const ok = await unlock(credential);
    if (ok) {
      setSuccess(true);
    } else {
      setError('Incorrect. Try again.');
      setTimeout(() => setError(''), 2000);
    }
  };

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Background glows */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 20% 20%, rgba(59,130,246,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.08) 0%, transparent 60%)',
        }} />

        {/* Lock Icon */}
        <motion.div
          animate={{ scale: success ? [1, 1.3, 0] : 1 }}
          transition={{ duration: 0.4 }}
          style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', marginBottom: 16,
            boxShadow: '0 0 40px rgba(59,130,246,0.25)',
          }}
        >
          <Lock size={30} />
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <GraduationCap size={18} style={{ color: 'var(--primary-400)' }} />
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>MANIT Attendance</span>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginBottom: 28 }}>App is locked</p>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'rgba(255,255,255,0.04)', borderRadius: 14,
          padding: 4, border: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'wrap', justifyContent: 'center', maxWidth: 380,
        }}>
          {LOCK_TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.93 }}
              style={{
                padding: '7px 12px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600,
                background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' : 'transparent',
                border: 'none', color: activeTab === tab.id ? 'white' : 'var(--text-tertiary)',
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.2s',
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Lock Panel */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            width: '100%', maxWidth: 320,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: 28,
          }}
        >
          {activeTab === 'pin' && <PinPad onComplete={handleCredential} isSetup={false} />}
          {activeTab === 'pattern' && <PatternGrid onComplete={handleCredential} isSetup={false} />}
          {activeTab === 'password' && <PasswordLock onComplete={handleCredential} isSetup={false} />}
          {activeTab === 'biometric' && <BiometricLock onComplete={handleCredential} isSetup={false} />}
          {activeTab === 'voice' && <VoiceLock onComplete={handleCredential} isSetup={false} />}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--danger-400)', fontSize: '0.82rem',
              }}
            >
              <XCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── App Lock Settings Modal ─── */
export function AppLockSettings({ onClose }) {
  const { isLockEnabled, lockType, hasSetup, setupLock, enableLock, disableLock, resetLock } = useAppLock();
  const [mode, setMode] = useState('menu'); // 'menu' | 'setup'
  const [setupTab, setSetupTab] = useState('pin');
  const [setupStep, setSetupStep] = useState(1); // 1=create, 2=confirm
  const [firstCred, setFirstCred] = useState('');
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  const showMsg = (m, type = 'success') => {
    setMessage(m);
    setMsgType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSetupCredential = async (cred) => {
    if (setupTab === 'biometric') {
      await setupLock('biometric', 'BIOMETRIC_SETUP');
      showMsg('Biometric lock enabled!');
      setMode('menu');
      return;
    }
    if (setupTab === 'voice') {
      await setupLock('voice', cred);
      showMsg('Voice lock enabled!');
      setMode('menu');
      return;
    }
    if (setupStep === 1) {
      setFirstCred(cred);
      setSetupStep(2);
    } else {
      if (cred === firstCred) {
        await setupLock(setupTab, cred);
        showMsg(`${setupTab.charAt(0).toUpperCase() + setupTab.slice(1)} lock enabled!`);
        setMode('menu');
        setSetupStep(1);
        setFirstCred('');
      } else {
        showMsg("Credentials don't match. Try again.", 'error');
        setSetupStep(1);
        setFirstCred('');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {mode === 'menu' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              }}>
                <Shield size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem' }}>App Lock</h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>Secure your attendance data</p>
              </div>
            </div>

            {/* Status */}
            <div style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 16,
              background: isLockEnabled ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${isLockEnabled ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isLockEnabled ? <CheckCircle2 size={16} style={{ color: 'var(--success-400)' }} /> :
                  <XCircle size={16} style={{ color: 'var(--danger-400)' }} />}
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isLockEnabled ? 'var(--success-400)' : 'var(--danger-400)' }}>
                  App Lock {isLockEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {hasSetup && (
                <motion.button
                  onClick={isLockEnabled ? disableLock : enableLock}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                    background: isLockEnabled ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    border: `1px solid ${isLockEnabled ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
                    color: isLockEnabled ? 'var(--danger-400)' : 'var(--success-400)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {isLockEnabled ? 'Disable' : 'Enable'}
                </motion.button>
              )}
            </div>

            {hasSetup && (
              <div style={{
                padding: '10px 16px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                fontSize: '0.82rem', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Key size={14} style={{ color: 'var(--primary-400)' }} />
                Current lock: <strong style={{ color: 'var(--text-primary)' }}>
                  {LOCK_TABS.find(t => t.id === lockType)?.label || lockType}
                </strong>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <motion.button
                onClick={() => { setMode('setup'); setSetupStep(1); setFirstCred(''); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
              >
                <Shield size={16} /> {hasSetup ? 'Change Lock' : 'Set Up App Lock'}
              </motion.button>
              {hasSetup && (
                <motion.button
                  onClick={() => { if (window.confirm('Reset App Lock? This will disable all locks.')) { resetLock(); showMsg('Lock reset.'); } }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-outline"
                  style={{ justifyContent: 'center', color: 'var(--danger-400)', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  <RotateCcw size={16} /> Reset App Lock
                </motion.button>
              )}
            </div>

            {message && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  marginTop: 14, padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem',
                  background: msgType === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${msgType === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: msgType === 'success' ? 'var(--success-400)' : 'var(--danger-400)',
                }}
              >
                {message}
              </motion.div>
            )}

            <button onClick={onClose} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
              Close
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <button onClick={() => setMode('menu')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>
                ←
              </button>
              <h2 style={{ margin: 0, fontSize: '1.05rem' }}>
                {setupStep === 1 ? 'Create Lock' : 'Confirm Lock'}
              </h2>
              {setupStep === 2 && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>(Confirm again)</span>}
            </div>

            {/* Tab bar for setup */}
            <div style={{
              display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap',
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4,
            }}>
              {LOCK_TABS.map((tab) => (
                <motion.button key={tab.id}
                  onClick={() => { setSetupTab(tab.id); setSetupStep(1); setFirstCred(''); }}
                  whileTap={{ scale: 0.93 }}
                  style={{
                    flex: '1 1 auto', padding: '7px 8px', borderRadius: 8,
                    fontSize: '0.7rem', fontWeight: 600,
                    background: setupTab === tab.id ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' : 'transparent',
                    border: 'none', color: setupTab === tab.id ? 'white' : 'var(--text-tertiary)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {tab.icon} {tab.label}
                </motion.button>
              ))}
            </div>

            <motion.div key={`${setupTab}-${setupStep}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {setupTab === 'pin' && <PinPad onComplete={handleSetupCredential} isSetup={true} />}
              {setupTab === 'pattern' && <PatternGrid onComplete={handleSetupCredential} isSetup={true} />}
              {setupTab === 'password' && <PasswordLock onComplete={handleSetupCredential} isSetup={true} />}
              {setupTab === 'biometric' && <BiometricLock onComplete={handleSetupCredential} isSetup={true} />}
              {setupTab === 'voice' && <VoiceLock onComplete={handleSetupCredential} isSetup={true} />}
            </motion.div>

            {message && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  marginTop: 14, padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem',
                  background: msgType === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${msgType === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: msgType === 'success' ? 'var(--success-400)' : 'var(--danger-400)',
                }}
              >
                {message}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

export default AppLockScreen;
