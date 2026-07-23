import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useMe, useUpdateMe } from '../quests/queries';

export function ProfilePage() {
  const { user, devMode } = useAuth();
  const { data: me, isLoading, isError } = useMe();
  const updateMe = useUpdateMe();
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName || '');
      setTimezone(me.timezone || '');
      setReminderTime(me.reminderTime || '');
    }
  }, [me]);

  if (isLoading) return <p role="status">Loading your profile...</p>;
  if (isError || !me) return <section className="panel" role="alert"><p>Could not load your profile.</p></section>;

  const onSubmit = async (event) => {
    event.preventDefault();
    await updateMe.mutateAsync({
      displayName: displayName.trim() || undefined,
      timezone: timezone || undefined,
      reminderTime: reminderTime || null,
    });
  };

  return (
    <main className="page-stack" aria-label="Profile">
      <div className="page-heading">
        <div>
          <h1>Profile</h1>
          <p>{devMode ? 'Local development identity' : user?.email}</p>
        </div>
      </div>

      <section className="panel">
        <div className="metric-strip">
          <ProfileStat label="Level" value={me.level} />
          <ProfileStat label="Tier" value={me.tier} />
          <ProfileStat label="Total XP" value={me.totalXp.toLocaleString()} />
          <ProfileStat label="Streak" value={`${me.streakDays ?? 0} days`} />
        </div>
      </section>

      <section className="panel">
        <h2>Settings</h2>
        <form onSubmit={onSubmit} className="onboarding-form">
          <label htmlFor="profile-name">Display name</label>
          <input id="profile-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} />

          <label htmlFor="profile-timezone">Timezone</label>
          <input id="profile-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={80} />

          <label htmlFor="profile-reminder">Daily reminder (HH:MM, optional)</label>
          <input id="profile-reminder" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} pattern="([01]\d|2[0-3]):[0-5]\d" placeholder="08:00" />

          {updateMe.isError && <p role="alert" className="form-error">Could not save changes. Please try again.</p>}
          {updateMe.isSuccess && <p role="status">Saved.</p>}

          <button type="submit" className="primary-action" disabled={updateMe.isPending}>
            {updateMe.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>
    </main>
  );
}

function ProfileStat({ label, value }) {
  return (
    <article className="metric-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
