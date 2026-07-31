import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../quests/queries';
import { FullScreenStatus } from './ProtectedRoute';

export function RequireOnboarding() {
  const { data: me, isLoading, isError } = useMe();

  if (isLoading) return <FullScreenStatus text="Preparing your sanctuary..." />;
  if (isError) return <FullScreenStatus text="We could not reach the quest service. Please refresh." />;
  if (me && !me.onboardingCompletedAt) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
