import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Icon, categoryIcon } from '../../components/Icon';
import { useMe, useUpdateMe } from '../quests/queries';

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function OnboardingPage() {
  const { data: me, isLoading } = useMe();
  const updateMe = useUpdateMe();
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState(detectedTimezone);
  const [primaryPath, setPrimaryPath] = useState('Mind');

  if (isLoading) return <p role="status">Loading your profile...</p>;
  if (me?.onboardingCompletedAt) return <Navigate to="/app" replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    await updateMe.mutateAsync({
      displayName: displayName.trim() || undefined,
      timezone,
      primaryPath,
      onboardingCompleted: true,
    });
  };

  return (
    <main className="onboarding-shell celestial-onboarding">
      <section className="onboarding-experience">
        <aside className="onboarding-visual" aria-hidden="true">
          <img src="/auth-celestial-aperture.png" alt="" />
          <div className="onboarding-orbit"><Icon name={categoryIcon(primaryPath)} /></div>
          <p>Your path is taking shape.</p>
        </aside>
        <div className="onboarding-card">
          <div className="onboarding-chapter">
            <span>01</span>
            <div><small>CHAPTER ONE</small><strong>Choose your path</strong></div>
          </div>
          <h1>Shape your quest journal.</h1>
          <p>This tunes your daily quests and keeps every streak aligned to your own timezone.</p>
          <form onSubmit={onSubmit} className="onboarding-form">
            <div className="auth-field">
              <label htmlFor="displayName">Adventurer name</label>
              <input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} placeholder="How should the journal address you?" />
            </div>

            <div className="auth-field">
              <label htmlFor="timezone">Timezone</label>
              <input id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={80} />
              <span className="field-hint">Detected automatically; edit if it is incorrect.</span>
            </div>

            <fieldset>
              <legend>Primary focus</legend>
              <div className="path-options">
                {['Mind', 'Body', 'Discovery'].map((path) => (
                  <label key={path} className={`path-option ${primaryPath === path ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="primaryPath"
                      value={path}
                      checked={primaryPath === path}
                      onChange={() => setPrimaryPath(path)}
                    />
                    <span className="path-option-icon"><Icon name={categoryIcon(path)} /></span>
                    <span><strong>{path}</strong><small>{path === 'Mind' ? 'Learn & reflect' : path === 'Body' ? 'Move & restore' : 'Explore & notice'}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>

            {updateMe.isError && <p role="alert" className="form-error">Could not save your profile. Please try again.</p>}

            <button type="submit" className="auth-submit" disabled={updateMe.isPending}>
              <span>{updateMe.isPending ? 'Binding your journal…' : 'Begin the journey'}</span>
              <Icon name={updateMe.isPending ? 'star' : 'compass'} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
