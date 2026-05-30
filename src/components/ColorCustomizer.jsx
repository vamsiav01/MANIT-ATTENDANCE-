import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, RotateCcw, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { COLOR_PRESETS } from '../utils/sampleData';

export default function ColorCustomizer({ isOpen, onClose }) {
  const { accentColor, setColorPreset, setCustomColor, resetColors } = useTheme();
  const [customPrimary, setCustomPrimary] = useState(accentColor.primary);
  const [customAccent, setCustomAccent] = useState(accentColor.accent);
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'

  const handlePresetClick = (preset) => {
    setColorPreset(preset);
    setCustomPrimary(preset.primary);
    setCustomAccent(preset.accent);
  };

  const handleCustomApply = () => {
    setCustomColor(customPrimary, customAccent);
  };

  const handleReset = () => {
    resetColors();
    setCustomPrimary('#3b82f6');
    setCustomAccent('#8b5cf6');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500, overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid var(--border-primary)',
              background: `linear-gradient(135deg, ${accentColor.primary}08, ${accentColor.accent}05)`,
            }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem', fontWeight: 700 }}>
                <Palette size={22} style={{ color: accentColor.primary }} />
                Theme Customizer
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <motion.button className="btn btn-ghost btn-icon" onClick={handleReset} title="Reset"
                  whileHover={{ rotate: -90 }} whileTap={{ scale: 0.9 }}>
                  <RotateCcw size={16} />
                </motion.button>
                <motion.button className="btn btn-ghost btn-icon" onClick={onClose}
                  whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Current Theme Preview */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                borderRadius: 'var(--radius-md)', marginBottom: 20,
                background: `linear-gradient(135deg, ${accentColor.primary}12, ${accentColor.accent}08)`,
                border: `1px solid ${accentColor.primary}20`,
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: accentColor.primary,
                    boxShadow: `0 0 12px ${accentColor.primary}40`,
                  }} />
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: accentColor.accent,
                    boxShadow: `0 0 12px ${accentColor.accent}40`,
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                    <Sparkles size={12} style={{ color: accentColor.primary, marginRight: 4 }} />
                    {accentColor.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                    {accentColor.primary} / {accentColor.accent}
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div style={{
                display: 'flex', gap: 4, marginBottom: 20, padding: 4,
                borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)',
                border: '1px solid var(--border-primary)',
              }}>
                {[
                  { key: 'presets', label: '🎨 Presets' },
                  { key: 'custom', label: '🔧 Custom' },
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      flex: 1, padding: '8px 16px', borderRadius: 6,
                      background: activeTab === tab.key ? accentColor.primary : 'transparent',
                      color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                      border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>

              {/* Presets Tab */}
              {activeTab === 'presets' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}
                >
                  {COLOR_PRESETS.map((preset) => {
                    const isActive = accentColor.name === preset.name;
                    return (
                      <motion.button
                        key={preset.name}
                        onClick={() => handlePresetClick(preset)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '14px 8px', borderRadius: 'var(--radius-md)',
                          background: isActive ? `${preset.primary}15` : 'var(--bg-glass)',
                          border: `2px solid ${isActive ? preset.primary : 'var(--border-primary)'}`,
                          cursor: 'pointer', gap: 8, position: 'relative',
                          boxShadow: isActive ? `0 0 16px ${preset.primary}20` : 'none',
                        }}
                        whileHover={{ scale: 1.04, borderColor: preset.primary, boxShadow: `0 0 20px ${preset.primary}15` }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <div style={{ display: 'flex', gap: 4 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 6, background: preset.primary,
                            boxShadow: `0 0 8px ${preset.primary}30`,
                          }} />
                          <div style={{
                            width: 22, height: 22, borderRadius: 6, background: preset.accent,
                            boxShadow: `0 0 8px ${preset.accent}30`,
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: isActive ? 700 : 500,
                          color: isActive ? preset.primary : 'var(--text-secondary)',
                        }}>
                          {preset.label} {preset.name}
                        </span>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{
                              position: 'absolute', top: 6, right: 6,
                              width: 16, height: 16, borderRadius: '50%',
                              background: preset.primary, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Check size={10} color="white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* Custom Tab */}
              {activeTab === 'custom' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    {/* Primary */}
                    <div style={{
                      padding: 16, borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
                    }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, display: 'block' }}>
                        Primary Color
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)}
                          style={{ width: 60, height: 60, border: 'none', borderRadius: 12, cursor: 'pointer', background: 'transparent', padding: 0 }}
                          id="custom-primary-color" />
                        <input type="text" className="form-input" value={customPrimary}
                          onChange={(e) => setCustomPrimary(e.target.value)} placeholder="#3b82f6"
                          style={{ textAlign: 'center', fontSize: '0.82rem', fontFamily: 'monospace', width: '100%' }} />
                      </div>
                    </div>

                    {/* Accent */}
                    <div style={{
                      padding: 16, borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
                    }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, display: 'block' }}>
                        Accent Color
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)}
                          style={{ width: 60, height: 60, border: 'none', borderRadius: 12, cursor: 'pointer', background: 'transparent', padding: 0 }}
                          id="custom-accent-color" />
                        <input type="text" className="form-input" value={customAccent}
                          onChange={(e) => setCustomAccent(e.target.value)} placeholder="#8b5cf6"
                          style={{ textAlign: 'center', fontSize: '0.82rem', fontFamily: 'monospace', width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div style={{
                    padding: '14px 18px', borderRadius: 'var(--radius-md)',
                    background: `linear-gradient(135deg, ${customPrimary}15, ${customAccent}10)`,
                    border: `1px solid ${customPrimary}25`, marginBottom: 16,
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Live Preview
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ padding: '6px 14px', borderRadius: 6, background: customPrimary, color: 'white', fontSize: '0.78rem', fontWeight: 700 }}>
                        Primary Button
                      </div>
                      <div style={{ padding: '6px 14px', borderRadius: 6, background: customAccent, color: 'white', fontSize: '0.78rem', fontWeight: 700 }}>
                        Accent Button
                      </div>
                      <div style={{
                        flex: 1, height: 6, borderRadius: 3,
                        background: `linear-gradient(90deg, ${customPrimary}, ${customAccent})`,
                      }} />
                    </div>
                  </div>

                  <motion.button className="btn btn-primary" onClick={handleCustomApply}
                    style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', background: `linear-gradient(135deg, ${customPrimary}, ${customAccent})` }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} id="apply-custom-colors">
                    <Palette size={16} /> Apply Custom Colors
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
