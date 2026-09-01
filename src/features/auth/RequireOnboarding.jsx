import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../quests/queries';
import { FullScreenStatus } from './ProtectedRoute';

export function RequireOnboarding() {
  const { data: me, isLoading, isError, refetch } = useMe();

  if (isLoading) {
    return (
      <FullScreenStatus
        type="loading"
        title="Syncing Realm"
        text="Loading your camera roll, quests, and profile."
      />
    );
  }

  if (isError) {
    return (
      <FullScreenStatus
        type="error"
        title="Connection Paused"
        text="Wild Realm could not reach the backend."
        statusHint="Check the local API or network tunnel, then retry."
        onRetry={() => refetch()}
      />
    );
  }

  if (me && !me.onboardingCompletedAt) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
