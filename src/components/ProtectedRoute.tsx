import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../hooks/useAuth';
import type { Role } from '../hooks/useAuth';

function dashboardPath(role: Role): string {
  switch (role) {
    case 'org':
      return '/dashboard/org';
    case 'teacher':
      return '/dashboard/teacher';
    case 'learner':
      return '/dashboard/learner';
    default:
      return '/';
  }
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, role, loading } = useSession();

  if (loading) {
    return (
      <div
        className="page"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 32,
            height: 32,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
          aria-hidden
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    const to = role ? dashboardPath(role) : '/';
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
