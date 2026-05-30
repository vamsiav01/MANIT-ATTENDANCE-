// ============================================================
// Helper Utilities — Self Attendance Tracker
// ============================================================

/**
 * Get today's date key (YYYY-MM-DD).
 */
export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Format date key to readable string.
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Get the current day name.
 */
export function getTodayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Calculate attendance percentage for a subject.
 */
export function getSubjectPercentage(subject) {
  if (!subject || subject.totalClasses === 0) return 0;
  return Math.round((subject.attended / subject.totalClasses) * 100);
}

/**
 * Calculate how many classes can be missed while maintaining target %.
 */
export function classesCanMiss(attended, total, targetPercent = 75) {
  const required = Math.ceil((total * targetPercent) / 100);
  return Math.max(0, attended - required);
}

/**
 * Calculate how many classes need to attend to reach target %.
 */
export function classesNeeded(attended, total, targetPercent = 75) {
  const numerator = targetPercent * total - 100 * attended;
  if (numerator <= 0) return 0; // Already at or above target
  const denominator = 100 - targetPercent;
  return Math.ceil(numerator / denominator);
}

/**
 * Overall attendance across all subjects.
 */
export function getOverallPercentage(subjects) {
  let totalAttended = 0;
  let totalClasses = 0;
  subjects.forEach((s) => {
    totalAttended += s.attended;
    totalClasses += s.totalClasses;
  });
  if (totalClasses === 0) return 0;
  return Math.round((totalAttended / totalClasses) * 100);
}

/**
 * Get CSS class for percentage value.
 */
export function getPctClass(pct) {
  if (pct >= 75) return 'pct-safe';
  if (pct >= 60) return 'pct-warning';
  return 'pct-danger';
}

export function getProgressClass(pct) {
  if (pct >= 75) return 'safe';
  if (pct >= 60) return 'warning';
  return 'danger';
}

/**
 * Get days in a month.
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday).
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Generate unique ID.
 */
export function generateId() {
  return 'sub' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Get weekly attendance trend from history.
 * Excludes 'holiday' entries from percentage calculation.
 */
export function getWeeklyTrend(history) {
  const today = new Date();
  const data = [];

  let count = 0;
  for (let i = 0; count < 7 && i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0) continue;

    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayData = history[dateKey];

    if (dayData) {
      const entries = Object.values(dayData);
      // Filter out holidays from calculation
      const nonHoliday = entries.filter((s) => (typeof s === 'string' ? s : s.status) !== 'holiday');
      const attended = nonHoliday.filter((s) => (typeof s === 'string' ? s : s.status) === 'present').length;
      const pct = nonHoliday.length > 0 ? Math.round((attended / nonHoliday.length) * 100) : 0;
      const holidays = entries.filter((s) => (typeof s === 'string' ? s : s.status) === 'holiday').length;
      data.unshift({ date: formatDateShort(dateKey), dateKey, percentage: pct, classes: nonHoliday.length, holidays });
    } else {
      data.unshift({ date: formatDateShort(dateKey), dateKey, percentage: 0, classes: 0, holidays: 0 });
    }
    count++;
  }

  return data;
}

/**
 * Export personal attendance to CSV.
 */
export function exportToCSV(subjects, profile) {
  const headers = ['Subject Code', 'Subject Name', 'Teacher', 'Total Classes', 'Attended', 'Percentage (%)', 'Status'];
  const rows = subjects.map((sub) => {
    const pct = getSubjectPercentage(sub);
    return [
      sub.code,
      sub.name,
      sub.teacher || '-',
      sub.totalClasses,
      sub.attended,
      pct,
      pct >= 75 ? 'Safe' : pct >= 60 ? 'Warning' : 'Danger',
    ];
  });

  let csv = `MANIT Self Attendance Report — Maulana Azad National Institute of Technology Bhopal\n`;
  csv += `Student: ${profile.name} | Scholar No: ${profile.scholarNo} | Branch: ${profile.branch}\n\n`;
  csv += headers.join(',') + '\n';
  rows.forEach((row) => {
    csv += row.map((v) => `"${v}"`).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `My_Attendance_${getTodayKey()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
