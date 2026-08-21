import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Array<'customer' | 'owner' | 'admin'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    const dashboardMap = { customer: '/', owner: '/owner/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={dashboardMap[user.role] ?? '/'} replace />;
  }

  return <>{children}</>;
};
