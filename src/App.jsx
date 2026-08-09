import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AppShell } from './components/AppShell';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { RequireOnboarding } from './features/auth/RequireOnboarding';
import { useMotionReducedPreference } from './lib/useMotionPreference';

// Lazy load route components
const LandingPage = React.lazy(() => import('./features/auth/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = React.lazy(() => import('./features/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const OnboardingPage = React.lazy(() => import('./features/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const WorldScreen = React.lazy(() => import('./features/world/WorldScreen').then(m => ({ default: m.WorldScreen })));
const GalleryPage = React.lazy(() => import('./features/gallery/GalleryPage').then(m => ({ default: m.GalleryPage })));
const GuildPage = React.lazy(() => import('./features/guild/GuildPage').then(m => ({ default: m.GuildPage })));
const ProfilePage = React.lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const QuestsPage = React.lazy(() => import('./features/quests/QuestsPage').then(m => ({ default: m.QuestsPage })));
const RewardsPage = React.lazy(() => import('./features/rewards/RewardsPage').then(m => ({ default: m.RewardsPage })));

function App() {
  const motionReduced = useMotionReducedPreference();
  return (
    <MotionConfig reducedMotion={motionReduced ? 'always' : 'user'}>
      <AuthProvider>
        <Suspense fallback={<div className="route-suspense-fallback" />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
            <Route path="/sign-up" element={<AuthPage mode="sign-up" />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<RequireOnboarding />}>
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<WorldScreen />} />
                  <Route path="quests" element={<QuestsPage />} />
                  <Route path="community" element={<GuildPage />} />
                  <Route path="rewards" element={<RewardsPage />} />
                  <Route path="collection" element={<GalleryPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
