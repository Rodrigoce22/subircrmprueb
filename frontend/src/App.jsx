import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';

import LoginPage    from './pages/LoginPage';
import Layout       from './components/Layout';
import DashboardPage  from './pages/DashboardPage';
import WhatsAppPage   from './pages/WhatsAppPage';
import ContactsPage   from './pages/ContactsPage';
import TasksPage      from './pages/TasksPage';
import ReportsPage    from './pages/ReportsPage';
import UsersPage      from './pages/UsersPage';
import PipelinePage   from './pages/PipelinePage';
import CalendarPage   from './pages/CalendarPage';
import SettingsPage   from './pages/SettingsPage';
import VideoCallPage  from './pages/VideoCallPage';
import MarketingPage  from './pages/MarketingPage';
import ProfilePage    from './pages/ProfilePage';

const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const { token, fetchMe }  = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (token) { fetchMe(); connect(); }
    return () => disconnect();
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="whatsapp"  element={<WhatsAppPage />} />
          <Route path="pipeline"  element={<PipelinePage />} />
          <Route path="contacts"  element={<ContactsPage />} />
          <Route path="tasks"     element={<TasksPage />} />
          <Route path="calendar"  element={<CalendarPage />} />
          <Route path="video"      element={<VideoCallPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="reports"   element={<ReportsPage />} />
          <Route path="settings"  element={<SettingsPage />} />
          <Route path="profile"   element={<ProfilePage />} />
          <Route path="users"     element={<AdminRoute><UsersPage /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
