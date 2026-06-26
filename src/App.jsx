import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useAttendance } from './context/AttendanceContext';
import { useNotifications } from './context/NotificationContext';
import { useAppLock } from './context/AppLockContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TodayClasses from './pages/TodayClasses';
import MySubjects from './pages/MySubjects';
import Analytics from './pages/Analytics';
import CalendarPage from './pages/Calendar';
import Profile from './pages/Profile';
import Timetable from './pages/Timetable';
import AttendanceHistory from './pages/AttendanceHistory';
import AttendanceCalculator from './pages/AttendanceCalculator';
import TrashPage from './pages/Trash';
import LoginPage from './pages/LoginPage';
import MouseGlow from './components/MouseGlow';
import AppLockScreen from './components/AppLock';
import AIAssistant from './components/AIAssistant';
import OnboardingWizard from './components/OnboardingWizard';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>Loading MANIT Attendance...</p>
    </div>
  );
}

function AppContent() {
  const { subjects, isSetup, isInitializing, showToast } = useAttendance();
  const { setupDailyReminder } = useNotifications();
  const { isLocked } = useAppLock();

  // Set up daily reminder (8 PM) whenever subjects change
  useEffect(() => {
    const getOverallPct = () => {
      if (!subjects.length) return 0;
      const totals = subjects.reduce(
        (acc, s) => ({ attended: acc.attended + s.attended, total: acc.total + s.totalClasses }),
        { attended: 0, total: 0 }
      );
      return totals.total > 0 ? Math.round((totals.attended / totals.total) * 100) : 0;
    };
    setupDailyReminder(getOverallPct);
  }, [subjects, setupDailyReminder]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if ((now.getHours() === 8 || now.getHours() === 20) && now.getMinutes() === 0 && now.getSeconds() === 0) {
        showToast(now.getHours() === 8 ? '🌅 Good Morning! Check your attendance for today! 🔔' : '🌙 Good Evening! Did you mark your attendance? 🔔');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showToast]);

  if (isInitializing) return <LoadingScreen />;

  return (
    <div className="app-layout">
      {/* Onboarding wizard — shown to new users before they see the app */}
      {!isSetup && <OnboardingWizard />}

      {/* App Lock overlay */}
      <AppLockScreen />

      <MouseGlow />
      <Sidebar />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/today" element={<TodayClasses />} />
          <Route path="/subjects" element={<MySubjects />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/history" element={<AttendanceHistory />} />
          <Route path="/calculator" element={<AttendanceCalculator />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/trash" element={<TrashPage />} />
        </Routes>
      </main>

      {/* AI Floating Assistant */}
      {!isLocked && <AIAssistant />}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  return <AppContent />;
}
