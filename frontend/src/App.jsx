import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthScreen from './components/AuthScreen.jsx';
import OnboardingScreen from './components/OnboardingScreen.jsx';
import DashboardScreen from './components/DashboardScreen.jsx';
import AuthSuccess from './components/AuthSuccess.jsx';

function AppContent() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sync_inbox_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSetupDone, setIsSetupDone] = useState(() => {
    return localStorage.getItem('onboarding_done') === 'true';
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('sync_inbox_user', JSON.stringify(userData));
    const persistentSetup = localStorage.getItem('onboarding_done') === 'true';
    if (persistentSetup) {
      setIsSetupDone(true);
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sync_inbox_user');
    navigate('/');
  };

  const handleReset = () => {
    const confirmed = window.confirm("Reset all settings and disconnect? This cannot be undone.");
    if (confirmed) {
      localStorage.clear();
      setUser(null);
      setIsSetupDone(false);
      navigate('/');
    }
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('onboarding_done', 'true');
    setIsSetupDone(true);
    navigate('/dashboard');
  };

  return (
    <Routes>
      <Route path="/" element={!user ? <AuthScreen onLogin={handleLogin} /> : !isSetupDone ? <Navigate to="/onboarding" replace /> : <Navigate to="/dashboard" replace />} />
      <Route path="/onboarding" element={user ? <OnboardingScreen user={user} onComplete={handleCompleteOnboarding} /> : <Navigate to="/" replace />} />
      <Route path="/auth-success" element={<AuthSuccess />} />
      <Route path="/dashboard" element={user && isSetupDone ? <DashboardScreen user={user} onLogout={handleLogout} onReset={handleReset} /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
