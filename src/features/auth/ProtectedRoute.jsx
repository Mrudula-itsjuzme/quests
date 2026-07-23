import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullScreenStatus text="Checking your session..." />;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
}

export function FullScreenStatus({ text }) {
  return (
    <div className="fullscreen-status" role="status">
      <p>{text}</p>
    </div>
  );
}
