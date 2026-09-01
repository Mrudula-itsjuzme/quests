import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
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
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapApp.addListener('backButton', () => {
      // 1. Close open modals/sheets
      const closeButtons = document.querySelectorAll(
        '[role="dialog"] button[aria-label="Close"], .capture-flow-close, button[aria-label="Close location details"], .notification-popover button[aria-label="Close notifications"]'
      );
      if (closeButtons.length > 0) {
        closeButtons[closeButtons.length - 1].click();
        return;
      }

      // 2. Navigate back if not on a root tab
      const rootPaths = ['/', '/sign-in', '/sign-up', '/app', '/app/quests', '/app/community', '/app/rewards', '/app/collection', '/app/library', '/app/profile'];
      if (!rootPaths.includes(location.pathname)) {
        navigate(-1);
        return;
      }

      // 3. Otherwise exit
      CapApp.exitApp();
    });
    return () => {
      listener.then(l => l.remove());
    };
  }, [location, navigate]);

  return (
    <MotionConfig reducedMotion={motionReduced ? 'always' : 'user'}>
      <AuthProvider>
        <Suspense fallback={null}>
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
                  <Route path="library" element={<GalleryPage />} />
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
