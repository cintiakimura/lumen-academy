import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import Landing from './components/Landing';
import Login from './components/auth/Login';
import Setup from './components/setup/Setup';
import Payment from './components/setup/Payment';
import Onboarding from './components/setup/Onboarding';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import LearnerDashboard from './components/learner/LearnerDashboard';
import Signup from './pages/Signup';
import DashboardOrg from './pages/DashboardOrg';
import Upload from './pages/Upload';
import Chat from './pages/Chat';
import './App.css';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/dashboard/org"
          element={
            <ProtectedRoute allowedRoles={['org']}>
              <DashboardOrg />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/learner"
          element={
            <ProtectedRoute allowedRoles={['learner']}>
              <LearnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:blockId"
          element={
            <ProtectedRoute allowedRoles={['learner']}>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
