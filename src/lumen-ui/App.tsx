/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from '../components/Landing';
import Login from '../components/auth/Login';
import Setup from '../components/setup/Setup';
import Payment from '../components/setup/Payment';
import Onboarding from '../components/setup/Onboarding';
import TeacherDashboard from '../components/teacher/TeacherDashboard';
import LearnerDashboard from '../components/learner/LearnerDashboard';
import GrokChat from '../components/chat/GrokChat';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
        <Route path="/dashboard/learner" element={<LearnerDashboard />} />
        <Route path="/chat/:blockId" element={<GrokChat />} />
      </Routes>
    </Router>
  );
}