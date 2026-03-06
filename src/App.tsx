import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardOrg from './pages/DashboardOrg';
import DashboardTeacher from './pages/DashboardTeacher';
import DashboardLearner from './pages/DashboardLearner';
import Upload from './pages/Upload';
import Chat from './pages/Chat';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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
              <DashboardTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/learner"
          element={
            <ProtectedRoute allowedRoles={['learner']}>
              <DashboardLearner />
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
