import { useMemo, useState } from 'react';
import { QuestRow } from './QuestCard';
import { QuestDetail } from './QuestDetail';
import { useActiveQuests, useGenerateDaily, useGenerateWeekly } from './queries';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'special', label: 'Special' },
];

function matchesFilter(quest, filter) {
  if (filter === 'all') return true;
  if (filter === 'weekly') return quest.cadence === 'weekly';
  if (filter === 'daily') return quest.cadence === 'daily';
  return quest.cadence !== 'daily' && quest.cadence !== 'weekly';
}

export function QuestsPage() {
  const { data: quests, isLoading, isError, error } = useActiveQuests();
  const generateDaily = useGenerateDaily();
  const generateWeekly = useGenerateWeekly();
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => (quests || []).filter((quest) => matchesFilter(quest, filter)), [quests, filter]);
  const selectedQuest = filtered.find((quest) => quest.id === selectedId) || filtered[0] || null;

  const hasDaily = (quests || []).some((quest) => quest.cadence === 'daily');
  const hasWeekly = (quests || []).some((quest) => quest.cadence === 'weekly');

  if (isLoading) return <p role="status">Loading your quests...</p>;
  if (isError) {
    return (
      <section className="panel" role="alert">
        <h2>Could not load quests</h2>
        <p>{error?.code === 'network_unavailable' ? 'You appear to be offline.' : 'Something went wrong loading your quests.'}</p>
      </section>
    );
  }

  return (
    <section className="page-stack" aria-label="Quest management">
      <div className="page-heading">
        <div>
          <h1>Quest Board</h1>
          <p>Pick a quest, complete the steps, and convert progress into collectible rewards.</p>
        </div>
        <div className="page-actions">
          {!hasDaily && (
            <button type="button" className="primary-action compact" onClick={() => generateDaily.mutate()} disabled={generateDaily.isPending}>
              {generateDaily.isPending ? 'Generating...' : 'Get daily quests'}
            </button>
          )}
          {!hasWeekly && (
            <button type="button" className="primary-action compact" onClick={() => generateWeekly.mutate()} disabled={generateWeekly.isPending}>
              {generateWeekly.isPending ? 'Generating...' : 'Get weekly quest'}
            </button>
          )}
        </div>
      </div>

      <div className="quest-page-grid">
        <section className="panel quest-board">
          <div className="panel-header">
            <div>
              <h2>Quest Board</h2>
              <span>{filtered.length} shown</span>
            </div>
          </div>
          <div className="segmented-control" aria-label="Quest filters">
            {filters.map((item) => (
              <button key={item.id} type="button" className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="quest-list">
            {filtered.length === 0 ? (
              <p className="empty-state">No quests in this filter yet.</p>
            ) : (
              filtered.map((quest) => (
                <QuestRow key={quest.id} quest={quest} selected={selectedQuest?.id === quest.id} onSelect={setSelectedId} />
              ))
            )}
          </div>
        </section>
        <QuestDetail quest={selectedQuest} />
      </div>
    </section>
  );
}
