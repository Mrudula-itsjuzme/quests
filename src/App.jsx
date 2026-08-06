import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthProvider } from './features/auth/AuthContext';
import { AuthPage } from './features/auth/AuthPage';
import { LandingPage } from './features/auth/LandingPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { RequireOnboarding } from './features/auth/RequireOnboarding';
import { WorldScreen } from './features/world/WorldScreen';
import { GalleryPage } from './features/gallery/GalleryPage';
import { GuildPage } from './features/guild/GuildPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { QuestsPage } from './features/quests/QuestsPage';
import { RewardsPage } from './features/rewards/RewardsPage';

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
