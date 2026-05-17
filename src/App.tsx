import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/Routes';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import MatchesScreen from './screens/MatchesScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import { PwaPrompt } from './components/PwaPrompt';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="mobile-container">
          <PwaPrompt />
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/welcome" element={<LandingScreen />} />
            </Route>

            {/* Transition Routes (User exists but not onboarded) */}
            <Route path="/onboarding" element={<OnboardingScreen />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DiscoveryScreen />} />
              <Route path="/matches" element={<MatchesScreen />} />
              <Route path="/chat/:matchId" element={<ChatScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
