import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, X, AlertTriangle, Clock, Archive, BookOpen } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

const BIN_EXPIRY_DAYS = 30;

function daysLeft(deletedAt) {
  const elapsed = (Date.now() - deletedAt) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(BIN_EXPIRY_DAYS - elapsed));
}

function formatDeletedDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function TrashPage() {
  const { bin, restoreFromTrash, restoreSnapshot, permanentlyDelete, emptyTrash } = useAttendance();
  const [confirmDelete, setConfirmDelete] = useState(null); // binId to permanently delete
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [snapshotSubView, setSnapshotSubView] = useState(null);

  const closeReview = () => {
    setReviewItem(null);
    setSnapshotSubView(null);
  };

  const subjects = bin.filter(b => b.type === 'subject');
  const snapshots = bin.filter(b => b.type === 'snapshot');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <h1>🗑️ Trash</h1>
        <p>Deleted items are kept for 30 days before permanent deletion. Restore anything here.</p>
      </div>

      {bin.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🗑️</div>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Trash is Empty</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>
            Deleted subjects and data snapshots will appear here for 30 days.
          </p>
        </div>
      ) : (
        <>
          {/* Header actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <motion.button
              onClick={() => setConfirmEmpty(true)}
              whileTap={{ scale: 0.97 }}
              className="btn btn-danger btn-sm"
              id="empty-trash-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={14} /> Empty Trash
            </motion.button>
          </div>

          {/* Info card */}
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '0.8rem', color: 'var(--warning-400)' }}>
            <Clock size={14} />
            Items in Trash are permanently deleted after 30 days. Restore them before they expire.
          </div>

          {/* Deleted Subjects */}
          {subjects.length > 0 && (
            <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BookOpen size={16} style={{ color: 'var(--primary-400)' }} />
                Deleted Subjects ({subjects.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {subjects.map(item => {
                  const days = daysLeft(item.deletedAt);
                  const urgent = days <= 5;
                  return (
                    <motion.div
                      key={item.binId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setReviewItem(item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${urgent ? 'rgba(239,68,68,0.25)' : 'var(--border-primary)'}`,
                        cursor: 'pointer'
                      }}
                      whileHover={{ scale: 1.01, background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.subject.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.subject.code} — {item.subject.name}</div>
                        <div style={{ fontSize: '0.72rem', color: urgent ? 'var(--danger-400)' : 'var(--text-tertiary)', marginTop: 2 }}>
                          Deleted {formatDeletedDate(item.deletedAt)} · {urgent ? `⚠️ ${days} day${days !== 1 ? 's' : ''} left` : `${days} days left`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); restoreFromTrash(item.binId); }}
                          whileTap={{ scale: 0.95 }}
                          title="Restore"
                          id={`restore-${item.binId}`}
                          style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: 'var(--success-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontFamily: 'inherit' }}
                        >
                          <RotateCcw size={12} /> Restore
                        </motion.button>
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.binId); }}
                          whileTap={{ scale: 0.95 }}
                          title="Delete permanently"
                          id={`del-${item.binId}`}
                          style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}
                        >
                          <X size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Data Snapshots */}
          {snapshots.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Archive size={16} style={{ color: 'var(--accent-400)' }} />
                Data Snapshots ({snapshots.length})
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 14 }}>
                These are full backups created when you used "Reset Data". Restore to get everything back.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {snapshots.map(item => {
                  const days = daysLeft(item.deletedAt);
                  const urgent = days <= 5;
                  return (
                    <motion.div
                      key={item.binId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setReviewItem(item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(139,92,246,0.05)',
                        border: `1px solid ${urgent ? 'rgba(239,68,68,0.25)' : 'rgba(139,92,246,0.2)'}`,
                        cursor: 'pointer'
                      }}
                      whileHover={{ scale: 1.01, background: 'rgba(139,92,246,0.09)' }}
                    >
                      <div style={{ fontSize: '1.2rem' }}>📦</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.label || 'Full Snapshot'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {item.subjects?.length || 0} subjects · Created {formatDeletedDate(item.deletedAt)} ·{' '}
                          <span style={{ color: urgent ? 'var(--danger-400)' : 'var(--text-tertiary)' }}>
                            {urgent ? `⚠️ ${days} day${days !== 1 ? 's' : ''} left` : `${days} days left`}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); restoreSnapshot(item.binId); }}
                          whileTap={{ scale: 0.95 }}
                          id={`restore-snap-${item.binId}`}
                          style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: 'var(--accent-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontFamily: 'inherit' }}
                        >
                          <RotateCcw size={12} /> Restore All
                        </motion.button>
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.binId); }}
                          whileTap={{ scale: 0.95 }}
                          id={`del-snap-${item.binId}`}
                          style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}
                        >
                          <X size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm permanent delete modal */}
      <AnimatePresence>
        {(confirmDelete || confirmEmpty) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 20, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={20} style={{ color: 'var(--danger-400)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{confirmEmpty ? 'Empty Trash?' : 'Delete Permanently?'}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>This action cannot be undone.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setConfirmDelete(null); setConfirmEmpty(false); }} id="cancel-perm-del-btn">
                  Cancel
                </button>
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    if (confirmEmpty) emptyTrash();
                    else permanentlyDelete(confirmDelete);
                    setConfirmDelete(null); setConfirmEmpty(false);
                  }} id="confirm-perm-del-btn">
                  <Trash2 size={14} /> {confirmEmpty ? 'Empty All' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Item Modal */}
      <AnimatePresence>
        {reviewItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeReview}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {reviewItem.type === 'subject' ? <BookOpen size={20} style={{ color: 'var(--primary-400)' }} /> : <Archive size={20} style={{ color: 'var(--accent-400)' }} />}
                  Review {reviewItem.type === 'subject' ? 'Subject' : 'Snapshot'}
                </h3>
                <motion.button onClick={closeReview} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </motion.button>
              </div>

              {reviewItem.type === 'subject' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: reviewItem.subject.color }} />
                      <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{reviewItem.subject.code} — {reviewItem.subject.name}</div>
                    </div>
                    {reviewItem.subject.teacher && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>👨‍🏫 Teacher: {reviewItem.subject.teacher}</div>}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div style={{ padding: 10, borderRadius: 8, background: 'rgba(34,197,94,0.08)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Attended</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success-400)' }}>{reviewItem.subject.attended}</div>
                      </div>
                      <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Classes</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{reviewItem.subject.totalClasses}</div>
                      </div>
                    </div>

                    {reviewItem.subject.days && reviewItem.subject.days.length > 0 && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        📅 Days: {reviewItem.subject.days.join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    Deleted {formatDeletedDate(reviewItem.deletedAt)}
                  </div>
                </div>
              )}

              {reviewItem.type === 'snapshot' && !snapshotSubView && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12 }}>{reviewItem.label || 'Full Snapshot'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Contains {reviewItem.subjects?.length || 0} subjects. Click any subject to view details.
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {reviewItem.subjects && reviewItem.subjects.map((sub, idx) => (
                        <motion.div key={idx} 
                          onClick={() => setSnapshotSubView(sub)}
                          whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
                          whileTap={{ scale: 0.98 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: sub.color }} />
                          <div style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500 }}>{sub.code} - {sub.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 12 }}>{sub.attended}/{sub.totalClasses}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    Created {formatDeletedDate(reviewItem.deletedAt)}
                  </div>
                </div>
              )}

              {reviewItem.type === 'snapshot' && snapshotSubView && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <button 
                    onClick={() => setSnapshotSubView(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, padding: 0, marginBottom: 8 }}
                  >
                    ← Back to Snapshot
                  </button>
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: snapshotSubView.color }} />
                      <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{snapshotSubView.code} — {snapshotSubView.name}</div>
                    </div>
                    {snapshotSubView.teacher && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>👨‍🏫 Teacher: {snapshotSubView.teacher}</div>}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div style={{ padding: 10, borderRadius: 8, background: 'rgba(34,197,94,0.08)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Attended</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success-400)' }}>{snapshotSubView.attended}</div>
                      </div>
                      <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Classes</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{snapshotSubView.totalClasses}</div>
                      </div>
                    </div>

                    {snapshotSubView.days && snapshotSubView.days.length > 0 && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        📅 Days: {snapshotSubView.days.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={closeReview}>
                  Close
                </button>
                {!(reviewItem.type === 'snapshot' && snapshotSubView) && (
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => {
                      if (reviewItem.type === 'subject') restoreFromTrash(reviewItem.binId);
                      else restoreSnapshot(reviewItem.binId);
                      closeReview();
                    }}>
                    <RotateCcw size={16} /> Restore
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
