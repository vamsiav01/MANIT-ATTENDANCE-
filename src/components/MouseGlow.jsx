import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function MouseGlow() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const { theme, accentColor } = useTheme();
  const isDark = theme === 'dark';

  const primaryHex = accentColor?.primary || '#3b82f6';
  const accentHex = accentColor?.accent || '#8b5cf6';

  useEffect(() => {
    // ── GLOW TRACKING ──
    const glow = glowRef.current;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let animId;

    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    const onTouchMove = (e) => {
      if (e.touches[0]) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
      }
    };

    const animateGlow = () => {
      currentX += (targetX - currentX) * 0.07;
      currentY += (targetY - currentY) * 0.07;
      if (glow) glow.style.transform = `translate(${currentX - 200}px, ${currentY - 200}px)`;
      animId = requestAnimationFrame(animateGlow);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    animateGlow();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // ── PARTICLES CANVAS ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 18000);
      for (let i = 0; i < Math.min(numParticles, 100); i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.08)';

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connect near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    window.addEventListener('resize', resize);
    resize();
    drawParticles();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        }}
      />

      {/* Mouse-tracking glow */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed', zIndex: 0, pointerEvents: 'none',
          width: 400, height: 400,
          borderRadius: '50%',
          background: isDark
            ? `radial-gradient(circle, ${primaryHex}22 0%, ${accentHex}12 45%, transparent 75%)`
            : `radial-gradient(circle, ${primaryHex}40 0%, ${accentHex}20 45%, transparent 75%)`,
          filter: isDark ? 'blur(40px)' : 'blur(50px)',
          willChange: 'transform',
        }}
      />
    </>
  );
}
