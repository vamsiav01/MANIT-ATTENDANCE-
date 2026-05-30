import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

const THEME_KEY = 'manit_self_theme';
const ACCENT_KEY = 'manit_self_accent';

// Generate shade variants from a hex color
function hexToHSL(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePalette(hex) {
  const { h, s } = hexToHSL(hex);
  return {
    50: hslToHex(h, Math.min(s, 30), 95),
    100: hslToHex(h, Math.min(s, 40), 90),
    200: hslToHex(h, Math.min(s, 50), 80),
    300: hslToHex(h, s, 70),
    400: hslToHex(h, s, 60),
    500: hex,
    600: hslToHex(h, s, 45),
    700: hslToHex(h, s, 38),
    800: hslToHex(h, s, 30),
    900: hslToHex(h, s, 22),
  };
}

const DEFAULT_PRIMARY = '#3b82f6';
const DEFAULT_ACCENT = '#8b5cf6';

function applyAccentColors(primaryHex, accentHex) {
  const primary = generatePalette(primaryHex);
  const accent = generatePalette(accentHex);
  const root = document.documentElement;

  // Apply primary palette
  Object.entries(primary).forEach(([shade, color]) => {
    root.style.setProperty(`--primary-${shade}`, color);
  });

  // Apply accent palette
  root.style.setProperty('--accent-400', accent['400']);
  root.style.setProperty('--accent-500', accent['500']);
  root.style.setProperty('--accent-600', accent['600']);

  // Update gradients and glows
  root.style.setProperty('--shadow-glow-blue', `0 0 20px ${primaryHex}25`);
  root.style.setProperty('--shadow-glow-violet', `0 0 20px ${accentHex}25`);
  root.style.setProperty('--border-accent', `${primaryHex}4D`);
  root.style.setProperty('--body-gradient-1', `${primaryHex}14`);
  root.style.setProperty('--body-gradient-2', `${accentHex}0F`);
  root.style.setProperty('--body-gradient-3', `${primaryHex}08`);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved || 'dark';
  });

  const [accentColor, setAccentColor] = useState(() => {
    const saved = localStorage.getItem(ACCENT_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT, name: 'Ocean Blue' };
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, JSON.stringify(accentColor));
    applyAccentColors(accentColor.primary, accentColor.accent);
  }, [accentColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setColorPreset = useCallback((preset) => {
    setAccentColor({ primary: preset.primary, accent: preset.accent, name: preset.name });
  }, []);

  const setCustomColor = useCallback((primary, accent) => {
    setAccentColor({ primary, accent, name: 'Custom' });
  }, []);

  const resetColors = useCallback(() => {
    setAccentColor({ primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT, name: 'Ocean Blue' });
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      accentColor,
      setColorPreset,
      setCustomColor,
      resetColors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
