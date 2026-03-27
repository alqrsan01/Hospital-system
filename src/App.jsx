import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Users from './pages/admin/Users.jsx';
import Departments from './pages/admin/Departments.jsx';
import Clinics from './pages/admin/Clinics.jsx';
import RegisterPatient from './pages/admin/RegisterPatient.jsx';
import QueueMonitor from './pages/admin/QueueMonitor.jsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import ManagerQueueMonitor from './pages/admin/QueueMonitor.jsx';
import ManagerRegister from './pages/admin/RegisterPatient.jsx';
import DoctorQueue from './pages/doctor/DoctorQueue.jsx';
import WaitingScreen from './pages/screen/WaitingScreen.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute roles={['admin']}>
          <Layout>
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="departments" element={<Departments />} />
              <Route path="clinics" element={<Clinics />} />
              <Route path="register" element={<RegisterPatient />} />
              <Route path="queue" element={<QueueMonitor />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Manager routes */}
      <Route path="/manager/*" element={
        <ProtectedRoute roles={['manager']}>
          <Layout>
            <Routes>
              <Route index element={<ManagerDashboard />} />
              <Route path="register" element={<ManagerRegister />} />
              <Route path="queue" element={<ManagerQueueMonitor />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Doctor routes */}
      <Route path="/doctor/*" element={
        <ProtectedRoute roles={['doctor']}>
          <Layout>
            <Routes>
              <Route index element={<DoctorQueue />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Waiting Screen */}
      <Route path="/screen" element={
        <ProtectedRoute roles={['screen']}>
          <WaitingScreen />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
