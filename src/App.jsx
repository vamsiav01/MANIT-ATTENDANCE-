import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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
import LoginPage from './pages/LoginPage';
import MouseGlow from './components/MouseGlow';

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

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  return (
    <div className="app-layout">
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
        </Routes>
      </main>
    </div>
  );
}
