import { Navigate, Link } from 'react-router-dom';
import { NyxCat } from '../../components/NyxCat';
import { useAuth } from './AuthContext';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="landing-nyx"><NyxCat small /></div>
        <span className="brand-mark" aria-hidden="true">Q</span>
        <h1>HABBIT QUESTS</h1>
        <p>An enchanted personal archive for daily and weekly wellness quests. Earn XP, build streaks, and fill your journal with collectibles as you grow.</p>
        <div className="landing-actions">
          <Link className="primary-action" to="/sign-up">Open your journal</Link>
          <Link className="ghost-action" to="/sign-in">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
