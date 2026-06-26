
// ============================================================
// Sample Data for MANIT Self-Attendance Tracker
// ============================================================

export const DEFAULT_SUBJECTS = [
  { id: 'sub1', name: 'Data Structures & Algorithms', code: 'CS301', teacher: 'Dr. Rajesh Kumar', days: ['Monday', 'Wednesday', 'Friday'], periodsPerDay: { Monday: 1, Wednesday: 1, Friday: 1 }, totalClasses: 40, attended: 32, color: '#3b82f6' },
  { id: 'sub2', name: 'Operating Systems', code: 'CS302', teacher: 'Prof. Anita Sharma', days: ['Monday', 'Thursday', 'Saturday'], periodsPerDay: { Monday: 1, Thursday: 1, Saturday: 1 }, totalClasses: 38, attended: 30, color: '#8b5cf6' },
  { id: 'sub3', name: 'Database Management Systems', code: 'CS303', teacher: 'Dr. Vikram Singh', days: ['Tuesday', 'Wednesday', 'Friday'], periodsPerDay: { Tuesday: 1, Wednesday: 1, Friday: 1 }, totalClasses: 35, attended: 28, color: '#22c55e' },
  { id: 'sub4', name: 'Computer Networks', code: 'CS304', teacher: 'Prof. Meera Joshi', days: ['Tuesday', 'Thursday'], periodsPerDay: { Tuesday: 2, Thursday: 2 }, totalClasses: 36, attended: 24, color: '#f97316' },
  { id: 'sub5', name: 'Mathematics - III', code: 'MA301', teacher: 'Dr. Suresh Patel', days: ['Monday', 'Wednesday', 'Friday'], periodsPerDay: { Monday: 1, Wednesday: 1, Friday: 1 }, totalClasses: 42, attended: 35, color: '#eab308' },
  { id: 'sub6', name: 'Digital Electronics', code: 'EC301', teacher: 'Dr. Priya Nair', days: ['Tuesday', 'Thursday', 'Saturday'], periodsPerDay: { Tuesday: 1, Thursday: 1, Saturday: 1 }, totalClasses: 30, attended: 20, color: '#ef4444' },
];

export const BRANCHES = [
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics & Communication Engineering',
  'Computer Science & Engineering',
  'Materials & Metallurgical Engineering',
  'Chemical Engineering',
  'B. Architecture',
  'B. Planning'
];
export const YEARS = [1, 2, 3, 4, 5];
export const SECTIONS = ['A', 'B', 'NA'];
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const PROGRAMS = ['Bachelor', 'Masters', 'PhD'];
export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DEFAULT_PROFILE = {
  name: 'MANIT Student',
  scholarNo: '2210110001',
  branch: 'Computer Science & Engineering',
  section: 'A',
  year: 3,
  semester: 5,
  program: 'Bachelor',
};

/**
 * Get periods for a subject on a specific day.
 * Handles both old format (number) and new format (object).
 */
export function getPeriodsForDay(subject, day) {
  if (!subject.periodsPerDay) return 1;
  if (typeof subject.periodsPerDay === 'number') return subject.periodsPerDay;
  return subject.periodsPerDay[day] || 1;
}

/**
 * Get total periods per week for a subject.
 */
export function getTotalPeriodsPerWeek(subject) {
  if (!subject.days) return 0;
  return subject.days.reduce((sum, day) => sum + getPeriodsForDay(subject, day), 0);
}

/**
 * Build schedule from subjects' `days` arrays.
 */
export function buildScheduleFromSubjects(subjects) {
  const schedule = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };
  subjects.forEach((sub) => {
    (sub.days || []).forEach((day) => {
      if (schedule[day] && !schedule[day].includes(sub.id)) {
        schedule[day].push(sub.id);
      }
    });
  });
  return schedule;
}

export const DAY_SCHEDULE = buildScheduleFromSubjects(DEFAULT_SUBJECTS);

/**
 * Generate sample attendance history for past 30 days.
 */
export function generateSampleHistory(subjects) {
  const history = {};
  const statuses = ['present', 'present', 'present', 'present', 'absent', 'holiday'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const schedule = buildScheduleFromSubjects(subjects);
  const today = new Date();

  for (let i = 30; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = dayNames[date.getDay()];
    if (dayName === 'Sunday') continue;

    const scheduled = schedule[dayName];
    if (!scheduled || scheduled.length === 0) continue;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    history[dateKey] = {};
    scheduled.forEach((subId) => {
      if (subjects.find((s) => s.id === subId)) {
        history[dateKey][subId] = statuses[Math.floor(Math.random() * statuses.length)];
      }
    });
  }

  return history;
}

/** Color palette presets for theme customizer */
export const COLOR_PRESETS = [
  { name: 'Ocean Blue', primary: '#3b82f6', accent: '#6366f1', label: '🌊' },
  { name: 'Violet Dream', primary: '#8b5cf6', accent: '#a855f7', label: '💜' },
  { name: 'Emerald', primary: '#10b981', accent: '#14b8a6', label: '🌿' },
  { name: 'Sunset', primary: '#f97316', accent: '#ef4444', label: '🌅' },
  { name: 'Rose', primary: '#f43e5c', accent: '#ec4899', label: '🌹' },
  { name: 'Golden', primary: '#eab308', accent: '#f59e0b', label: '✨' },
  { name: 'Teal', primary: '#14b8a6', accent: '#06b6d4', label: '🏝️' },
  { name: 'Crimson', primary: '#dc2626', accent: '#e11d48', label: '❤️' },
  { name: 'Indigo', primary: '#6366f1', accent: '#8b5cf6', label: '🔮' },
  { name: 'Cyan', primary: '#06b6d4', accent: '#0ea5e9', label: '💎' },
  { name: 'Pink', primary: '#ec4899', accent: '#f472b6', label: '🌸' },
  { name: 'Lime', primary: '#84cc16', accent: '#22c55e', label: '🍀' },
];
