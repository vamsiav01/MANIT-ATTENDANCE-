import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Sparkles, Bot, User,
  Loader2, ChevronDown, Zap, TrendingUp, AlertTriangle, Calculator,
  BookOpen, Target, Shield, Clock, BarChart2, Star,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { getSubjectPercentage, getOverallPercentage } from '../utils/helpers';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const QUICK_PROMPTS = [
  { icon: AlertTriangle, text: 'Which subjects need attention?',        color: 'var(--danger-400)'  },
  { icon: Calculator,    text: 'Can I skip tomorrow\'s class?',          color: 'var(--warning-400)' },
  { icon: TrendingUp,    text: 'Give me a progress summary',             color: 'var(--success-400)' },
  { icon: Zap,           text: 'How to improve my attendance?',          color: 'var(--primary-400)' },
  { icon: Target,        text: 'Am I safe for final exams?',             color: 'var(--accent-400)'  },
  { icon: BookOpen,      text: 'Which subject has best attendance?',      color: 'var(--success-400)' },
  { icon: Shield,        text: 'What is my attendance risk level?',       color: 'var(--danger-400)'  },
  { icon: Clock,         text: 'How many classes can I miss this week?',  color: 'var(--warning-400)' },
  { icon: BarChart2,     text: 'Compare all my subjects',                 color: 'var(--primary-400)' },
  { icon: Star,          text: 'Give me a study plan to recover attendance', color: 'var(--accent-400)' },
];

function buildAttendanceContext(subjects, profile) {
  const overall = getOverallPercentage(subjects);
  const subjectData = subjects.map((s) => {
    const pct = getSubjectPercentage(s);
    return `• ${s.code} (${s.name}): ${s.attended}/${s.totalClasses} classes = ${pct}% ${pct < 60 ? '[CRITICAL]' : pct < 75 ? '[LOW]' : '[OK]'}`;
  }).join('\n');

  return `You are an AI attendance assistant for MANIT (Maulana Azad National Institute of Technology) Bhopal.
Student: ${profile.name}, Branch: ${profile.branch}, Year: ${profile.year}, Section: ${profile.section}, Semester: ${profile.semester}

Current Attendance Data:
Overall: ${overall}%
Subjects:
${subjectData}

MANIT requires minimum 75% attendance to sit in exams.
Be helpful, concise, and encouraging. Use bullet points when listing multiple items.
Answer in 2-4 sentences max unless a detailed analysis is requested.`;
}

const FALLBACK_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function fetchWithRetry(url, body, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 503 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000)); // wait 2s then retry
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function callGemini(systemPrompt, messages) {
  if (!GEMINI_API_KEY) {
    return "⚠️ **AI needs a Gemini API key.**\n\nAdd `VITE_GEMINI_API_KEY=your_key` to your `.env` file.\nGet a free key at **aistudio.google.com** → API Keys → Create API Key.";
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  contents.unshift({
    role: 'user',
    parts: [{ text: systemPrompt }],
  });
  contents.splice(1, 0, {
    role: 'model',
    parts: [{ text: 'Understood! I\'m ready to help with your MANIT attendance analysis.' }],
  });

  const body = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
  };

  let res;
  try {
    // Try primary model first (2.5-flash), then fallback to 2.0-flash
    res = await fetchWithRetry(API_URL, body, 2);
    if (res && res.status === 503) {
      res = await fetchWithRetry(FALLBACK_URL, body, 1);
    }
  } catch (networkErr) {
    return '❌ **Network error** — could not reach Google AI servers.\n\nCheck your internet connection and try again.';
  }

  if (!res || !res.ok) {
    const err = await res?.json().catch(() => ({}));
    if (res?.status === 400) return '❌ **API Error 400** — Bad request or invalid API key.\n\nGet a valid key at **aistudio.google.com**.';
    if (res?.status === 403) return '❌ **API Error 403** — API key is invalid or expired.\n\nGet a new key at **aistudio.google.com** → API Keys.';
    if (res?.status === 429) return '⚠️ **Rate limited** — too many requests. Wait a moment and try again.';
    if (res?.status === 503) return '⚠️ **Google AI servers are overloaded** right now. Please wait 1-2 minutes and try again.';
    return `❌ **AI Error (${res?.status})** — ${err?.error?.message || 'Unknown error. Try again.'}`;
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary-400)' }}
        />
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const { subjects, profile } = useAttendance();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${profile?.name?.split(' ')[0] || 'there'}! 👋 I'm your MANIT Attendance AI. Ask me anything about your attendance, which classes to prioritize, or how to reach your target percentage!`,
      id: 'welcome',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Update welcome message when profile changes
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Hi ${profile?.name?.split(' ')[0] || 'there'}! 👋 I'm your MANIT Attendance AI. Ask me anything about your attendance, which classes to prioritize, or how to reach your target percentage!`,
      id: 'welcome',
    }]);
  }, [profile?.name]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMsg, id: Date.now() }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const systemPrompt = buildAttendanceContext(subjects, profile);
      const contextMessages = newMessages.filter(m => m.id !== 'welcome');
      const reply = await callGemini(systemPrompt, contextMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, id: Date.now() + 1 }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Something went wrong. Please try again.',
        id: Date.now() + 1,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="ai-assistant-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              bottom: 90,
              right: 20,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 498,
              boxShadow: '0 4px 20px rgba(59,130,246,0.4), 0 0 0 4px rgba(59,130,246,0.1)',
            }}
          >
            <Sparkles size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ai-panel"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div style={{
              padding: '13px 16px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
              borderBottom: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
              borderRadius: '20px 20px 0 0',
            }}>
              <div className="ai-drag-handle" />
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                flexShrink: 0,
              }}>
                <Bot size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  MANIT AI Assistant
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--success-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success-400)' }} />
                  Online · Gemini powered
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMinimized(!isMinimized)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}>
                <ChevronDown size={18} style={{ transform: isMinimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </motion.button>
            </div>

            {!isMinimized && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-end', gap: 8,
                      }}
                    >
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: msg.role === 'assistant'
                          ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))'
                          : 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                      }}>
                        {msg.role === 'assistant' ? <Bot size={13} /> : <User size={13} />}
                      </div>
                      <div style={{
                        maxWidth: '80%', padding: '9px 13px', borderRadius: 14,
                        borderBottomRightRadius: msg.role === 'user' ? 3 : 14,
                        borderBottomLeftRadius: msg.role === 'assistant' ? 3 : 14,
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))'
                          : 'rgba(255,255,255,0.05)',
                        border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                        fontSize: '0.82rem', lineHeight: 1.5,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0,
                      }}>
                        <Bot size={13} />
                      </div>
                      <div style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14, borderBottomLeftRadius: 3,
                      }}>
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Always-visible collapsible Quick Questions tray */}
                {(() => {
                  const hasRealMessages = messages.filter(m => m.id !== 'welcome').length > 0;
                  return (
                    <div style={{ padding: '0 12px 8px', borderTop: hasRealMessages ? '1px solid var(--border-primary)' : 'none' }}>
                      <button
                        onClick={() => setShowQuickPrompts(p => !p)}
                        style={{
                          width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '6px 0', fontFamily: 'inherit',
                        }}
                      >
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          ⚡ Quick Questions
                        </p>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{showQuickPrompts ? '▲' : '▼'}</span>
                      </button>
                      {showQuickPrompts && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 4 }}>
                          {QUICK_PROMPTS.map((qp, i) => {
                            const Icon = qp.icon;
                            return (
                              <motion.button key={i}
                                onClick={() => { sendMessage(qp.text); setShowQuickPrompts(false); }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  padding: '7px 9px', borderRadius: 9, textAlign: 'left',
                                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                  cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.7rem',
                                  display: 'flex', alignItems: 'flex-start', gap: 5, fontFamily: 'inherit',
                                  lineHeight: 1.35,
                                }}
                              >
                                <Icon size={12} style={{ color: qp.color, flexShrink: 0, marginTop: 1 }} />
                                {qp.text}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}


                <div style={{
                  padding: '9px 12px',
                  borderTop: '1px solid var(--border-primary)',
                  display: 'flex', gap: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your attendance..."
                    rows={1}
                    style={{
                      flex: 1, padding: '9px 13px', borderRadius: 11,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-primary)', resize: 'none', fontSize: '0.82rem',
                      fontFamily: 'inherit', lineHeight: 1.4, outline: 'none',
                      maxHeight: 80, minHeight: 40, overflowY: 'auto',
                    }}
                  />
                  <motion.button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    whileHover={input.trim() ? { scale: 1.08 } : {}}
                    whileTap={input.trim() ? { scale: 0.92 } : {}}
                    style={{
                      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                      background: input.trim() && !loading
                        ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))'
                        : 'rgba(255,255,255,0.05)',
                      border: 'none', color: input.trim() && !loading ? 'white' : 'var(--text-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                      alignSelf: 'flex-end',
                    }}
                  >
                    {loading ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
                  </motion.button>
                </div>

                {!GEMINI_API_KEY && (
                  <div style={{
                    padding: '5px 12px 7px', fontSize: '0.63rem', color: 'var(--warning-400)',
                    textAlign: 'center', background: 'rgba(234,179,8,0.05)',
                    borderTop: '1px solid rgba(234,179,8,0.1)',
                  }}>
                    ⚠️ Add VITE_GEMINI_API_KEY to .env for full AI features
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* ── Desktop: floating panel bottom-right ── */
        .ai-panel {
          position: fixed;
          bottom: 20px;
          right: 16px;
          width: min(370px, calc(100vw - 32px));
          height: ${isMinimized ? '56px' : 'min(520px, calc(100vh - 100px))'};
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 498;
          box-shadow: 0 16px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.1);
          transition: height 0.3s cubic-bezier(0.4,0,0.2,1);
        }

        .ai-drag-handle { display: none; }

        /* ── Mobile: bottom sheet anchored above bottom nav ── */
        @media (max-width: 768px) {
          .ai-panel {
            bottom: 72px;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 18px 18px 0 0;
            height: ${isMinimized ? '54px' : 'clamp(300px, 55vh, 480px)'};
            z-index: 497;
          }

          /* Show drag handle on mobile */
          .ai-drag-handle {
            display: block;
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 36px;
            height: 4px;
            border-radius: 2px;
            background: rgba(255,255,255,0.2);
          }

          #ai-assistant-btn {
            bottom: 84px !important;
            right: 14px !important;
            width: 46px !important;
            height: 46px !important;
          }
        }
      `}</style>
    </>
  );
}
