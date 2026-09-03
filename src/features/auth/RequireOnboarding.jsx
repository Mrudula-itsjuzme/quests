import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../quests/queries';
import { FullScreenStatus } from './ProtectedRoute';

export function RequireOnboarding() {
  const { data: me, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <FullScreenStatus
        type="loading"
        title="Syncing Realm"
        text="Loading your camera roll, quests, and profile."
      />
    );
  }

  if (isError && !me) {
    // If we have no cached data and the network fails, we could either 
    // block them or just let them into the app offline.
    // To make it an offline-first app, we'll let them through to the Outlet.
    // The rest of the app can handle missing data gracefully.
    console.warn("Backend unreachable, starting offline mode...");
  }

  if (me && !me.onboardingCompletedAt) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
