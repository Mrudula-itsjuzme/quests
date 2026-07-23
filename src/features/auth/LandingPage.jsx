import { Navigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <span className="brand-mark" aria-hidden="true">Q</span>
        <h1>QUESTS</h1>
        <p>Daily and weekly wellness quests. Earn XP, build streaks, and unlock collectibles as you grow.</p>
        <div className="landing-actions">
          <Link className="primary-action" to="/sign-up">Get started</Link>
          <Link className="ghost-action" to="/sign-in">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
