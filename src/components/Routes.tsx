import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-main"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  // If user is not onboarded, redirect to onboarding except if already there
  if (!profile || !profile.onboarded) {
    // We allow moving to onboarding
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { user, loading, profile } = useAuth();

  if (loading) return null;

  if (user && profile?.onboarded) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
