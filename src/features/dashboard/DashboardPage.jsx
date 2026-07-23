import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { QuestRow } from '../quests/QuestCard';
import { QuestDetail } from '../quests/QuestDetail';
import { useActiveQuests, useMe } from '../quests/queries';

export function DashboardPage() {
  const { data: me, isLoading: meLoading, isError: meError } = useMe();
  const { data: quests, isLoading: questsLoading, isError: questsError } = useActiveQuests();
  const [selectedId, setSelectedId] = useState(null);

  const selectedQuest = (quests || []).find((quest) => quest.id === selectedId) || (quests || [])[0] || null;
  const completedCount = useMemo(() => (quests || []).filter((quest) => quest.status === 'completed').length, [quests]);
  const activeProgress = useMemo(() => {
    if (!quests || quests.length === 0) return 0;
    const total = quests.reduce((sum, quest) => sum + (quest.targetValue ? quest.progressValue / quest.targetValue : 0), 0);
    return Math.round((total / quests.length) * 100);
  }, [quests]);

  if (meLoading || questsLoading) return <p role="status">Loading your dashboard...</p>;
  if (meError) return <section className="panel" role="alert"><p>Could not load your profile. Please refresh.</p></section>;

  return (
    <section className="dashboard-grid" aria-label="Dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Complete quests and track your progress toward the next level.</p>
        </div>
        <Link className="primary-action compact" to="/app/quests">View quest board</Link>
      </div>

      <div className="metric-strip">
        <MetricCard icon="star" label="Board charge" value={`${activeProgress}%`} detail="Active quest progress" />
        <MetricCard icon="shield" label="Level" value={me.level} detail={`${me.tier} · ${me.xpIntoLevel}/${me.xpForCurrentLevel} XP`} />
        <MetricCard icon="check" label="Quests Completed" value={completedCount} detail="Currently active set" />
        <MetricCard icon="bookmark" label="Streak" value={me.streakDays ?? 0} detail="Day streak" />
      </div>

      {questsError && (
        <section className="panel" role="alert">
          <p>Could not load your quests right now.</p>
        </section>
      )}

      {!questsError && (!quests || quests.length === 0) && (
        <section className="panel empty-state">
          <p>No active quests yet. Head to the quest board to generate today's set.</p>
          <Link className="primary-action compact" to="/app/quests">Go to quests</Link>
        </section>
      )}

      {!questsError && quests && quests.length > 0 && (
        <>
          <section className="panel quest-board">
            <div className="panel-header">
              <div>
                <h2>Active Quests</h2>
                <span>{quests.filter((quest) => quest.status === 'active').length} in progress</span>
              </div>
            </div>
            <div className="quest-list">
              {quests.map((quest) => (
                <QuestRow key={quest.id} quest={quest} selected={selectedQuest?.id === quest.id} onSelect={setSelectedId} />
              ))}
            </div>
          </section>
          <QuestDetail quest={selectedQuest} />
        </>
      )}
    </section>
  );
}

function MetricCard({ icon, label, value, detail }) {
  return (
    <article className="metric-card">
      <span className="metric-icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}
