import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/Routes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PwaPrompt } from './components/PwaPrompt';
import { ToastHost } from './components/Toast';
import LandingScreen from './screens/LandingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import MatchesScreen from './screens/MatchesScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import SafetyScreen from './screens/SafetyScreen';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="mobile-container">
            <PwaPrompt />
            <ToastHost />
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/welcome" element={<LandingScreen />} />
              </Route>

              <Route path="/onboarding" element={<OnboardingScreen />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DiscoveryScreen />} />
                <Route path="/matches" element={<MatchesScreen />} />
                <Route path="/messages" element={<MatchesScreen />} />
                <Route path="/chat/:matchId" element={<ChatScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="/profile/edit" element={<EditProfileScreen />} />
                <Route path="/profile/preferences" element={<PreferencesScreen />} />
                <Route path="/profile/safety" element={<SafetyScreen />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
