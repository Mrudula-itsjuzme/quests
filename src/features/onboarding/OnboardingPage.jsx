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
    <main className="onboarding-shell">
      <section className="panel onboarding-card grain">
        <h4>Chapter One</h4>
        <h1>Set up your quest journal</h1>
        <p>This tailors your daily quests and keeps your streak calculated in your own timezone.</p>
        <form onSubmit={onSubmit} className="onboarding-form">
          <label htmlFor="displayName">Display name</label>
          <input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} />

          <label htmlFor="timezone">Timezone</label>
          <input id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={80} />
          <span className="field-hint">Detected automatically; edit if it's wrong.</span>

          <fieldset>
            <legend className="field-hint" style={{ marginTop: '10px' }}>Primary focus</legend>
            <div className="path-options">
              {['Mind', 'Body', 'Discovery'].map((path) => (
                <label key={path} className={`path-option ${primaryPath === path ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="primaryPath"
                    value={path}
                    checked={primaryPath === path}
                    onChange={() => setPrimaryPath(path)}
                    style={{ position: 'absolute', opacity: 0 }}
                  />
                  <Icon name={categoryIcon(path)} />
                  {path}
                </label>
              ))}
            </div>
          </fieldset>

          {updateMe.isError && <p role="alert" className="form-error">Could not save your profile. Please try again.</p>}

          <button type="submit" className="primary-action" disabled={updateMe.isPending}>
            {updateMe.isPending ? 'Saving...' : 'Start questing'}
          </button>
        </form>
      </section>
    </main>
  );
}
