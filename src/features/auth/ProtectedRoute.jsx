import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { StartupScreen } from '../../components/StartupScreen';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <FullScreenStatus
        type="loading"
        title="Wild Realm"
        text="Opening your journal…"
      />
    );
  }
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
}


export function FullScreenStatus({type = 'loading', title, text, onRetry, statusHint}) {
  return <StartupScreen message={text} title={title} error={type === 'error' || type === 'offline'} onRetry={onRetry} statusHint={statusHint}/>;
}
