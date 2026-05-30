import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, AlertCircle, WifiOff, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Rich animated background for login
function LoginBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

    // Stars
    const stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
        brightness: Math.random() * 0.7 + 0.3,
      });
    }

    // Glowing orbs
    const orbs = [];
    for (let i = 0; i < 8; i++) {
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 30 + 15,
        hue: Math.random() > 0.5 ? 220 : 270,
        opacity: Math.random() * 0.2 + 0.1,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Network particles
    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        r: Math.random() * 2.5 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        hue: 200 + Math.random() * 80,
      });
    }

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      // Stars
      stars.forEach((s) => {
        const twinkle = Math.sin(time * 60 * s.speed + s.phase) * 0.5 + 0.5;
        const alpha = s.brightness * twinkle;
        const sz = s.size * (0.7 + twinkle * 0.5);
        
        ctx.beginPath();
        // 4-point star
        ctx.moveTo(s.x, s.y - sz * 2.5);
        ctx.lineTo(s.x + sz * 0.4, s.y - sz * 0.4);
        ctx.lineTo(s.x + sz * 2.5, s.y);
        ctx.lineTo(s.x + sz * 0.4, s.y + sz * 0.4);
        ctx.lineTo(s.x, s.y + sz * 2.5);
        ctx.lineTo(s.x - sz * 0.4, s.y + sz * 0.4);
        ctx.lineTo(s.x - sz * 2.5, s.y);
        ctx.lineTo(s.x - sz * 0.4, s.y - sz * 0.4);
        ctx.closePath();
        ctx.fillStyle = `rgba(180, 200, 255, ${alpha})`;
        ctx.fill();
      });

      // Orbs
      orbs.forEach((o) => {
        const dx = mouseX - o.x;
        const dy = mouseY - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300) {
          o.vx += dx * 0.0001;
          o.vy += dy * 0.0001;
        }
        o.x += o.vx;
        o.y += o.vy;
        o.vx *= 0.998;
        o.vy *= 0.998;
        if (o.x < -60) o.x = canvas.width + 60;
        if (o.x > canvas.width + 60) o.x = -60;
        if (o.y < -60) o.y = canvas.height + 60;
        if (o.y > canvas.height + 60) o.y = -60;

        const pulse = Math.sin(time * 40 * 0.015 + o.pulsePhase) * 0.3 + 0.7;
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3);
        const a = o.opacity * pulse;
        grad.addColorStop(0, `hsla(${o.hue}, 80%, 65%, ${a * 2})`);
        grad.addColorStop(0.3, `hsla(${o.hue}, 70%, 55%, ${a})`);
        grad.addColorStop(0.7, `hsla(${o.hue}, 60%, 50%, ${a * 0.3})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${o.hue}, 80%, 75%, ${a * 2.5})`;
        ctx.fill();
      });

      // Particles + connections
      particles.forEach((p, i) => {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += dx * 0.00015;
          p.vy += dy * 0.00015;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.997;
        p.vy *= 0.997;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(150, 180, 255, ${0.15 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });

      // Mouse glow ring
      const mg = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 150);
      mg.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
      mg.addColorStop(0.5, 'rgba(139, 92, 246, 0.04)');
      mg.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 150, 0, Math.PI * 2);
      ctx.fillStyle = mg;
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, skipAuth, error, clearError, firebaseReady } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseReady) { skipAuth(); return; }
    setLoading(true);
    clearError();
    try {
      if (isRegister) await signUpWithEmail(formData.email, formData.password, formData.name);
      else await signInWithEmail(formData.email, formData.password);
    } catch (err) { /* error set in context */ }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!firebaseReady) { skipAuth(); return; }
    setLoading(true);
    clearError();
    try { await signInWithGoogle(); }
    catch (err) { /* error set in context */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <LoginBackground />

      {/* Gradient orbs */}
      <div style={{ position: 'fixed', top: '-15%', left: '-5%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'floatOrb1 12s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: '30vw', height: '30vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'floatOrb2 16s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', top: '40%', left: '60%', width: '25vw', height: '25vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', animation: 'floatOrb1 20s ease-in-out infinite reverse' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}
      >
        {/* Brand */}
        <motion.div style={{ textAlign: 'center', marginBottom: 36 }}
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <motion.div
            style={{
              width: 88, height: 88, borderRadius: 20,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: 'white',
              boxShadow: '0 0 60px rgba(59,130,246,0.4), 0 0 120px rgba(139,92,246,0.2)',
            }}
            animate={{ rotate: [0, -4, 4, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 5, repeat: Infinity, repeatDelay: 2 }}
          >
            <GraduationCap size={44} />
          </motion.div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>
            MANIT Attendance
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', marginTop: 8 }}>
            Maulana Azad National Institute of Technology, Bhopal
          </p>
          <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <Sparkles size={13} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Smart Attendance Tracking System</span>
            <Sparkles size={13} style={{ color: '#a78bfa' }} />
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div
          style={{
            padding: 36, borderRadius: 20,
            background: 'rgba(17, 24, 39, 0.75)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(59,130,246,0.08)',
          }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          {/* Status */}
          {!firebaseReady && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.78rem', color: '#facc15' }}>
              <WifiOff size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: 3 }}>Offline Mode Available</strong>
                <span style={{ opacity: 0.8 }}>Firebase not configured. Click "Enter App" to start — your data saves on this device.</span>
              </div>
            </motion.div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#f87171' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PRIMARY Button */}
          <motion.button onClick={firebaseReady ? handleGoogle : skipAuth} disabled={loading}
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 14,
              background: firebaseReady ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: firebaseReady ? '1px solid rgba(255,255,255,0.12)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              fontSize: '1rem', fontWeight: 700, color: 'white', cursor: 'pointer', marginBottom: 20,
              boxShadow: firebaseReady ? 'none' : '0 0 40px rgba(59,130,246,0.3), 0 4px 20px rgba(0,0,0,0.2)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(59,130,246,0.4)' }}
            whileTap={{ scale: 0.98 }} id="primary-login-btn"
          >
            {firebaseReady ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </>
            ) : (
              <>
                <GraduationCap size={22} />
                {loading ? 'Loading...' : 'Enter App'}
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>

          {/* Email form only when Firebase is configured */}
          {firebaseReady && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  or {isRegister ? 'create account' : 'sign in with email'}
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <AnimatePresence>
                    {isRegister && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <div style={{ position: 'relative' }}>
                          <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                          <input type="text" className="form-input" placeholder="Full Name" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ paddingLeft: 44 }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input type="email" className="form-input" placeholder="Email address" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} required style={{ paddingLeft: 44 }} />
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input type={showPassword ? 'text' : 'password'} className="form-input"
                      placeholder={isRegister ? 'Create password (6+ chars)' : 'Password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required minLength={6} style={{ paddingLeft: 44, paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', border: 'none' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <motion.button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', color: 'white', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer' }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
                  </motion.button>
                </div>
              </form>

              <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => { setIsRegister(!isRegister); clearError(); }}
                  style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  {isRegister ? 'Sign In' : 'Register'}
                </button>
              </div>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <motion.button onClick={skipAuth}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 24px', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', width: '100%' }}
                  whileHover={{ scale: 1.02, borderColor: 'rgba(59,130,246,0.3)' }}
                  whileTap={{ scale: 0.98 }}>
                  👤 Continue as Guest (offline)
                </motion.button>
              </div>
            </>
          )}

          {!firebaseReady && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: 16, lineHeight: 1.7 }}>
                To enable Google Sign-In & cloud sync, configure Firebase in<br />
                <code style={{ fontSize: '0.68rem', color: '#60a5fa', background: 'rgba(59,130,246,0.08)', padding: '2px 8px', borderRadius: 4 }}>src/config/firebase.js</code>
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -50px) scale(1.15); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 40px) scale(1.1); }
          66% { transform: translate(30px, -30px) scale(0.85); }
        }
      `}</style>
    </div>
  );
}
