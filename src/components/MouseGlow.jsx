import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * MouseGlow — Immersive animated background with:
 * - Mouse-following gradient glow (large, very visible)
 * - Twinkling 4-pointed stars
 * - Glowing orbs/balls with pulsation
 * - Network particles with connection lines
 * - HIGHLY VISIBLE in both light and dark themes
 * - Accent-color aware
 */
export default function MouseGlow() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const { theme, accentColor } = useTheme();

  // Mouse glow follower (div)
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let animId;

    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      glow.style.transform = `translate(${currentX - 300}px, ${currentY - 300}px)`;
      animId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const isDark = theme === 'dark';

    const hexToRgb = (hex) => {
      try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
      } catch {
        return { r: 59, g: 130, b: 246 };
      }
    };

    const primaryRgb = hexToRgb(accentColor?.primary || '#3b82f6');
    const accentRgb = hexToRgb(accentColor?.accent || '#8b5cf6');

    // ====== STARS (120 twinkling 4-pointed stars) ======
    const stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.8,
        twinkleSpeed: Math.random() * 0.04 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        brightness: Math.random() * 0.6 + 0.3,
      });
    }

    // ====== GLOWING ORBS (16 pulsing balls) ======
    const orbs = [];
    for (let i = 0; i < 16; i++) {
      const usePrimary = Math.random() > 0.5;
      const rgb = usePrimary ? primaryRgb : accentRgb;
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 25 + 10,
        r: rgb.r, g: rgb.g, b: rgb.b,
        // MUCH higher opacity for light mode
        opacity: isDark ? (Math.random() * 0.2 + 0.1) : (Math.random() * 0.25 + 0.15),
        pulseSpeed: Math.random() * 0.02 + 0.008,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // ====== PARTICLES (55 connected dots) ======
    const particles = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 3 + 1,
        // MUCH higher opacity for light mode
        opacity: isDark ? (Math.random() * 0.6 + 0.25) : (Math.random() * 0.55 + 0.2),
        hue: Math.random() > 0.5 ? 220 : 270,
      });
    }

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      // ---- Stars ----
      stars.forEach((s) => {
        const twinkle = Math.sin(time * 60 * s.twinkleSpeed + s.twinklePhase) * 0.5 + 0.5;
        const alpha = s.brightness * twinkle;

        // LIGHT MODE: darker blue-purple stars, DARK MODE: bright white-blue
        const starColor = isDark
          ? `rgba(200, 215, 255, ${alpha})`
          : `rgba(60, 80, 180, ${alpha * 0.8})`;

        ctx.beginPath();
        const sz = s.size * (0.7 + twinkle * 0.5);
        // 4-pointed star shape
        ctx.moveTo(s.x, s.y - sz * 2.5);
        ctx.lineTo(s.x + sz * 0.45, s.y - sz * 0.45);
        ctx.lineTo(s.x + sz * 2.5, s.y);
        ctx.lineTo(s.x + sz * 0.45, s.y + sz * 0.45);
        ctx.lineTo(s.x, s.y + sz * 2.5);
        ctx.lineTo(s.x - sz * 0.45, s.y + sz * 0.45);
        ctx.lineTo(s.x - sz * 2.5, s.y);
        ctx.lineTo(s.x - sz * 0.45, s.y - sz * 0.45);
        ctx.closePath();
        ctx.fillStyle = starColor;
        ctx.fill();

        // Add glow around bigger stars (light mode)
        if (!isDark && s.size > 2) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, sz * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(60, 80, 180, ${alpha * 0.08})`;
          ctx.fill();
        }
      });

      // ---- Glowing Orbs ----
      orbs.forEach((o) => {
        const dx = mouseX - o.x;
        const dy = mouseY - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 350) {
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

        const pulse = Math.sin(time * 60 * o.pulseSpeed + o.pulsePhase) * 0.3 + 0.7;
        const radius = o.radius * pulse;
        const alpha = o.opacity * pulse;

        // Outer glow
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, radius * 4);
        const glowMultiplier = isDark ? 1 : 1.5; // Stronger glow in light mode
        grad.addColorStop(0, `rgba(${o.r}, ${o.g}, ${o.b}, ${alpha * 2 * glowMultiplier})`);
        grad.addColorStop(0.2, `rgba(${o.r}, ${o.g}, ${o.b}, ${alpha * glowMultiplier})`);
        grad.addColorStop(0.5, `rgba(${o.r}, ${o.g}, ${o.b}, ${alpha * 0.4 * glowMultiplier})`);
        grad.addColorStop(1, `rgba(${o.r}, ${o.g}, ${o.b}, 0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Solid bright core
        ctx.beginPath();
        ctx.arc(o.x, o.y, radius * 0.6, 0, Math.PI * 2);
        const coreAlpha = isDark ? alpha * 2.5 : alpha * 3;
        ctx.fillStyle = `rgba(${o.r}, ${o.g}, ${o.b}, ${Math.min(coreAlpha, 0.9)})`;
        ctx.fill();

        // Extra inner bright dot for light mode
        if (!isDark) {
          ctx.beginPath();
          ctx.arc(o.x, o.y, radius * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${o.r}, ${o.g}, ${o.b}, ${Math.min(alpha * 5, 0.95)})`;
          ctx.fill();
        }
      });

      // ---- Particles + Connections ----
      // Light mode: darker colored lines, Dark mode: bright lines
      const lineRgb = isDark ? '180, 200, 255' : `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`;

      particles.forEach((p, i) => {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 280) {
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

        // Particle dot — much more visible in light mode
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const pColor = isDark
          ? `hsla(${p.hue}, 70%, 70%, ${p.opacity})`
          : `hsla(${p.hue}, 75%, 40%, ${p.opacity})`;
        ctx.fillStyle = pColor;
        ctx.fill();

        // Light mode: add tiny glow around particles
        if (!isDark) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 70%, 50%, ${p.opacity * 0.08})`;
          ctx.fill();
        }

        // Connection lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (d < 160) {
            // MUCH higher alpha for light mode connections
            const lineAlpha = isDark ? 0.14 * (1 - d / 160) : 0.2 * (1 - d / 160);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${lineRgb}, ${lineAlpha})`;
            ctx.lineWidth = isDark ? 0.8 : 1;
            ctx.stroke();
          }
        }
      });

      // ---- Mouse glow ring on canvas ----
      const mouseGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 180);
      const mouseAlpha = isDark ? 0.1 : 0.08;
      mouseGrad.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${mouseAlpha})`);
      mouseGrad.addColorStop(0.4, `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${mouseAlpha * 0.5})`);
      mouseGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 180, 0, Math.PI * 2);
      ctx.fillStyle = mouseGrad;
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [theme, accentColor]);

  const isDark = theme === 'dark';
  const glowPrimary = accentColor?.primary || '#3b82f6';
  const glowAccent = accentColor?.accent || '#8b5cf6';

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />
      {/* Large mouse-following glow — bigger and more visible */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed', width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, 
            ${glowPrimary}${isDark ? '25' : '18'} 0%, 
            ${glowAccent}${isDark ? '15' : '10'} 35%, 
            transparent 70%)`,
          pointerEvents: 'none', zIndex: 0, filter: 'blur(50px)',
          willChange: 'transform',
        }}
      />
    </>
  );
}
