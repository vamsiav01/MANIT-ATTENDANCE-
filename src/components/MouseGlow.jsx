import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function MouseGlow() {
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

  return (
    <>
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
