import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../lib/store';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { isAuthenticated, currentRole, currentCluster } = useAppStore();
  const location = useLocation();

  if (!isAuthenticated || !currentRole || !currentCluster) {
    // Redirect to login, saving the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};