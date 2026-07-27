import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { Spinner } from './Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Restricts the route to admins on top of requiring a session. */
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Waiting matters: redirecting during the initial session probe would bounce
  // an already-signed-in user to the login page on every hard refresh.
  if (isLoading) {
    return (
      <div className="page">
        <Spinner label="Checking your session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
