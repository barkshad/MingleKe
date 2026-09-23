import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function FullScreenLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-line border-t-rose" />
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading, profile } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  if (!profile?.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { user, loading, profile } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (user && profile?.onboarded) {
    return <Navigate to="/" replace />;
  }

  if (user && !profile?.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
