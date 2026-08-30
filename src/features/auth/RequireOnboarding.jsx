import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../quests/queries';
import { FullScreenStatus } from './ProtectedRoute';

export function RequireOnboarding() {
  const { data: me, isLoading, isError, refetch } = useMe();

  if (isLoading) {
    return (
      <FullScreenStatus
        type="loading"
        title="Sanctuary Connection"
        text="Establishing bridge to the quest network..."
      />
    );
  }

  if (isError) {
    return (
      <FullScreenStatus
        type="error"
        title="Sanctuary Unreachable"
        text="We could not reach the quest service."
        statusHint="Please check your Wi-Fi, USB tunnel, or local server status."
        onRetry={() => refetch()}
      />
    );
  }

  if (me && !me.onboardingCompletedAt) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
