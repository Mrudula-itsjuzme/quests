import { useEffect, useMemo, useState } from 'react';

const accountKey = 'local-player';
const collectionStorageKey = 'quests.collectibles.v1';
const themeStorageKey = 'quests.theme.v1';

const initialQuests = [
  {
    id: 'daily-focus',
    title: 'Morning Mindfulness',
    summary: 'Complete a 10-minute breathing ritual and capture the feeling.',
    detail: 'Sit somewhere calm, breathe slowly, and note one intention for the day.',
    category: 'Mind',
    rarity: 'Rare',
    xp: 120,
    status: 'In Progress',
    progress: 0.7,
    target: '7/10 days',
    instructions: ['Set a quiet timer', 'Breathe for 10 minutes', 'Write one line of gratitude'],
    proofType: 'photo',
    cadence: 'daily',
  },
  {
    id: 'body-reset',
    title: 'Body Reset',
    summary: 'Take a brisk walk and log how your energy feels after.',
    detail: 'A short walk can reset your nervous system and improve your mood.',
    category: 'Body',
    rarity: 'Uncommon',
    xp: 90,
    status: 'Awaiting Proof',
    progress: 1,
    target: '1/1 proof',
    instructions: ['Walk for 15 minutes', 'Hydrate after', 'Upload a photo from your route'],
    proofType: 'photo',
    cadence: 'daily',
  },
  {
    id: 'discovery',
    title: 'Weekly Discovery',
    summary: 'Explore one new habit or experience and share a reflection.',
    detail: 'Try something slightly unfamiliar and log what it taught you.',
    category: 'Discovery',
    rarity: 'Epic',
    xp: 180,
    status: 'Not Started',
    progress: 0.2,
    target: '3/5 prompts',
    instructions: ['Choose a new experience', 'Spend 20 minutes with it', 'Reflect in one sentence'],
    proofType: 'auto',
    cadence: 'weekly',
  },
];

const collectibleCatalog = {
  'daily-focus': {
    assetId: 'wisp-focus',
    questId: 'daily-focus',
    title: 'Focus Wisp',
    category: 'Mind',
    rarity: 'Rare',
    caption: 'Unlocked for completing a mindful streak ritual.',
  },
  'body-reset': {
    assetId: 'pulse-sprint',
    questId: 'body-reset',
    title: 'Pulse Sprint',
    category: 'Body',
    rarity: 'Uncommon',
    caption: 'Unlocked for proving movement and recovery.',
  },
  discovery: {
    assetId: 'orbit-signal',
    questId: 'discovery',
    title: 'Orbit Signal',
    category: 'Discovery',
    rarity: 'Epic',
    caption: 'Unlocked for exploring a new habit path.',
  },
};

const categoryColors = {
  Mind: 'mind',
  Body: 'body',
  Discovery: 'discovery',
};

const rarityStars = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'quests', label: 'Quests', icon: 'check' },
  { id: 'community', label: 'Community', icon: 'users' },
  { id: 'gallery', label: 'Gallery', icon: 'bookmark' },
];

const communityFeed = [
  { id: 'sam', name: 'SamuraiSam', text: 'Completed Move Your Body', xp: 100, time: '2m ago' },
  { id: 'mina', name: 'MindfulMina', text: 'Unlocked a new sticker: Leafling', xp: 0, time: '15m ago' },
  { id: 'trail', name: 'TrailSeeker', text: 'Completed Explore Something New', xp: 180, time: '1h ago' },
  { id: 'zen', name: 'Zenith', text: 'Reached Level 25', xp: 0, time: '2h ago' },
];

const leaderboard = [
  { name: 'SamuraiSam', xp: 2480 },
  { name: 'Zenith', xp: 2120 },
  { name: 'MindfulMina', xp: 1980 },
  { name: 'TrailSeeker', xp: 1610 },
  { name: 'You', xp: 1240 },
];

const newQuestTemplate = {
  title: 'Hydration Combo',
  summary: 'Drink water, stretch, and record your energy before lunch.',
  detail: 'A compact reset quest for days when momentum needs a small spark.',
  category: 'Body',
  rarity: 'Common',
  xp: 60,
  status: 'Not Started',
  progress: 0,
  target: '0/3 actions',
  instructions: ['Drink a full glass of water', 'Do one shoulder stretch', 'Log your energy level'],
  proofType: 'auto',
  cadence: 'daily',
};

function readStoredCollection() {
  try {
    const stored = window.localStorage.getItem(collectionStorageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredCollection(items) {
  window.localStorage.setItem(collectionStorageKey, JSON.stringify(items));
}

function getCollectibleForQuest(quest) {
  return (
    collectibleCatalog[quest.id] || {
      assetId: `${quest.id}-relic`,
      questId: quest.id,
      title: `${quest.category} Relic`,
      category: quest.category,
      rarity: quest.rarity,
      caption: `Unlocked by completing ${quest.title}.`,
    }
  );
}

function mergeCollectible(collection, collectible) {
  const unlocked = { ...collectible, unlockedAt: collectible.unlockedAt || new Date().toISOString() };
  return [unlocked, ...collection.filter((item) => item.assetId !== unlocked.assetId)];
}

function App() {
  const [quests, setQuests] = useState(initialQuests);
  const [selectedQuestId, setSelectedQuestId] = useState(initialQuests[0].id);
  const [rewardBurst, setRewardBurst] = useState(null);
  const [apiMessage, setApiMessage] = useState('');
  const [collection, setCollection] = useState(() => readStoredCollection());
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState(() => window.localStorage.getItem(themeStorageKey) || 'dark');
  const [booting, setBooting] = useState(true);
  const [catMood, setCatMood] = useState('focused');

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 980);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isActive = true;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

    Promise.all([
      fetch(`${apiBaseUrl}/quests`).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBaseUrl}/collectibles?account=${accountKey}`).then((response) => (response.ok ? response.json() : [])),
    ])
      .then(([questData, collectibleData]) => {
        if (!isActive) return;
        if (Array.isArray(questData) && questData.length > 0) {
          setQuests(questData);
          setSelectedQuestId(questData[0].id);
        }
        if (Array.isArray(collectibleData) && collectibleData.length > 0) {
          setCollection(collectibleData);
          saveStoredCollection(collectibleData);
        }
        setApiMessage('Synced with quest database');
      })
      .catch(() => setApiMessage('Using local collection until the API is available'));

    return () => {
      isActive = false;
    };
  }, []);

  const selectedQuest = quests.find((quest) => quest.id === selectedQuestId) ?? quests[0];
  const selectedReward = getCollectibleForQuest(selectedQuest);

  const completedCount = useMemo(() => quests.filter((quest) => quest.status === 'Completed').length, [quests]);
  const totalXp = useMemo(
    () => quests.filter((quest) => quest.status === 'Completed').reduce((sum, quest) => sum + quest.xp, 0),
    [quests],
  );
  const activeProgress = useMemo(() => {
    if (quests.length === 0) return 0;
    return Math.round((quests.reduce((sum, quest) => sum + quest.progress, 0) / quests.length) * 100);
  }, [quests]);

  const upsertQuest = (quest) => {
    setQuests((current) =>
      current.map((item) => (item.id === quest.id ? quest : item)).concat(current.some((item) => item.id === quest.id) ? [] : quest),
    );
    setSelectedQuestId(quest.id);
  };

  const unlockCollectible = (collectible) => {
    setCollection((current) => {
      const next = mergeCollectible(current, collectible);
      saveStoredCollection(next);
      return next;
    });
  };

  const completeQuest = async () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const optimisticQuest = { ...selectedQuest, status: 'Completed', progress: 1 };
    const fallbackCollectible = getCollectibleForQuest(selectedQuest);
    upsertQuest(optimisticQuest);
    unlockCollectible(fallbackCollectible);
    setRewardBurst({ ...fallbackCollectible, xp: selectedQuest.xp, questTitle: selectedQuest.title });
    setCatMood('proud');

    try {
      const response = await fetch(`${apiBaseUrl}/quests/${selectedQuest.id}/complete?account=${accountKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountKey }),
      });
      if (response.ok) {
        const payload = await response.json();
        const quest = payload.quest || payload;
        upsertQuest(quest);
        if (payload.collectible) {
          unlockCollectible(payload.collectible);
          setRewardBurst({ ...payload.collectible, xp: quest.xp, questTitle: quest.title });
        }
        setApiMessage('Collectible saved to your reward database');
      } else {
        setApiMessage('Collectible saved locally. Start Docker with the database to sync it.');
      }
    } catch {
      setApiMessage('Collectible saved locally. API is currently offline.');
    }

    setActiveView('gallery');
    window.setTimeout(() => setRewardBurst(null), 2200);
  };

  const addQuest = async () => {
    const quest = {
      ...newQuestTemplate,
      id: `hydration-combo-${Date.now()}`,
      title: quests.some((item) => item.title === newQuestTemplate.title)
        ? `Hydration Combo ${quests.length + 1}`
        : newQuestTemplate.title,
    };

    upsertQuest(quest);
    setActiveView('quests');
    setApiMessage('New quest staged');

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBaseUrl}/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quest),
      });
      if (response.ok) {
        upsertQuest(await response.json());
        setApiMessage('New quest saved to the database');
      } else {
        setApiMessage('New quest added locally. Database persistence is unavailable.');
      }
    } catch {
      setApiMessage('New quest added locally. API is currently offline.');
    }
  };

  const shellClassName = `app-shell ${theme === 'light' ? 'light-theme' : 'dark-theme'}`;

  return (
    <div className={shellClassName}>
      <LoadingScreen isVisible={booting} />
      {rewardBurst && <RewardBurst reward={rewardBurst} />}
      <main className="workspace">
        <TopBar
          activeView={activeView}
          apiMessage={apiMessage || 'Quest console ready'}
          collectionCount={collection.length}
          theme={theme}
          totalXp={totalXp}
          onNavigate={setActiveView}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />

        {activeView === 'dashboard' && (
          <DashboardView
            activeProgress={activeProgress}
            collection={collection}
            completedCount={completedCount}
            quests={quests}
            selectedQuest={selectedQuest}
            selectedQuestId={selectedQuestId}
            totalXp={totalXp}
            onAddQuest={addQuest}
            onClaimReward={completeQuest}
            onSelectQuest={setSelectedQuestId}
          />
        )}

        {activeView === 'quests' && (
          <section className="page-stack" aria-label="Quest management">
            <div className="page-heading">
              <div>
                <h1>Quest Board</h1>
                <p>Pick a quest, complete the steps, and convert progress into collectible rewards.</p>
              </div>
              <button type="button" className="primary-action compact" onClick={addQuest} aria-label="Create a new hydration quest">
                New quest
              </button>
            </div>
            <div className="quest-page-grid">
              <QuestBoard
                quests={quests}
                selectedQuestId={selectedQuestId}
                onSelectQuest={setSelectedQuestId}
              />
              <QuestDetail quest={selectedQuest} reward={selectedReward} activeProgress={activeProgress} onClaimReward={completeQuest} />
            </div>
          </section>
        )}

        {activeView === 'community' && <CommunityView />}
        {activeView === 'gallery' && <Gallery collection={collection} />}
      </main>

      <RightRail
        catMood={catMood}
        collection={collection}
        onCatAction={setCatMood}
        onNavigate={setActiveView}
      />
    </div>
  );
}

function TopBar({ activeView, apiMessage, collectionCount, theme, totalXp, onNavigate, onThemeToggle }) {
  const title = activeView === 'dashboard' ? 'Dashboard' : navItems.find((item) => item.id === activeView)?.label || 'Dashboard';
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          Q
        </span>
        <div>
          <strong>QUESTS</strong>
          <span>{title}</span>
        </div>
      </div>
      <nav className="top-nav" aria-label="Primary">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id ? 'active' : ''}
            onClick={() => onNavigate(item.id)}
            aria-current={activeView === item.id ? 'page' : undefined}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
        <button type="button" className="nav-profile-item">
          <Icon name="shield" />
          <span>Profile</span>
        </button>
      </nav>
      <div className="topbar-actions">
        <div className="quick-stat">
          <strong>{Math.max(totalXp, 1240).toLocaleString()}</strong>
          <span>XP</span>
        </div>
        <div className="quick-stat">
          <strong>{Math.max(collectionCount, 23)}</strong>
          <span>Stickers</span>
        </div>
        <button type="button" className="icon-button" onClick={onThemeToggle} aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
      <p className="sync-status" role="status">{apiMessage}</p>
    </header>
  );
}

function DashboardView({
  activeProgress,
  collection,
  completedCount,
  quests,
  selectedQuest,
  selectedQuestId,
  totalXp,
  onAddQuest,
  onClaimReward,
  onSelectQuest,
}) {
  return (
    <section className="dashboard-grid" aria-label="Dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Complete quests, keep pace with the party, and let Neko track the reward trail.</p>
        </div>
        <button type="button" className="primary-action compact" onClick={onAddQuest} aria-label="Create a new hydration quest">
          New quest
        </button>
      </div>
      <div className="metric-strip">
        <MetricCard icon="star" label="Daily XP" value={`${activeProgress}%`} detail="Board charge" />
        <MetricCard icon="shield" label="Level" value="24" detail={`${Math.max(totalXp, 1240).toLocaleString()} / 2,000 XP`} />
        <MetricCard icon="check" label="Quests Completed" value={completedCount} detail="This week" />
        <MetricCard icon="bookmark" label="Collection" value={`${Math.max(collection.length, 23)} / 96`} detail="Stickers unlocked" />
      </div>

      <QuestBoard
        quests={quests}
        selectedQuestId={selectedQuestId}
        onAddQuest={onAddQuest}
        onSelectQuest={onSelectQuest}
      />
      <QuestDetail quest={selectedQuest} reward={getCollectibleForQuest(selectedQuest)} activeProgress={activeProgress} onClaimReward={onClaimReward} />

      <section className="weekly-panel">
        <div className="relic-tracker-head">
          <div className="relic-thumb" aria-hidden="true">
            <Icon name="leaf" />
          </div>
          <div>
            <span className="relic-label">Focus Wisp</span>
            <span className="pill mind">Rare</span>
            <p>Unlocked for completing a mindful quest 10 times.</p>
          </div>
        </div>
        <div className="week-dots" aria-label="Weekly progress">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <span key={`${day}-${index}`} className={index < 3 ? 'done' : ''}>
              {day}
            </span>
          ))}
        </div>
        <div className="relic-path" aria-hidden="true">
          {['leaf', 'compass', 'bolt', 'shield'].map((icon, index) => (
            <span key={icon} className={index === 0 ? 'reached' : ''}>
              <Icon name={icon} />
            </span>
          ))}
        </div>
        <ProgressBar value={0.64} label="640 / 1,000 weekly XP" />
        <p className="relic-caption">Stay focused to reach your next reward.</p>
      </section>
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

function QuestBoard({ quests, selectedQuestId, onAddQuest, onSelectQuest }) {
  return (
    <section className="panel quest-board">
      <div className="panel-header">
        <div>
          <h2>Quest Board</h2>
          <span>{quests.filter((quest) => quest.status !== 'Completed').length} Active</span>
        </div>
        {onAddQuest && (
          <button type="button" className="ghost-action" onClick={onAddQuest} aria-label="Create a new hydration quest">
            New quest
          </button>
        )}
      </div>

      <div className="segmented-control" aria-label="Quest filters">
        <button type="button" className="active">All</button>
        <button type="button">Daily</button>
        <button type="button">Weekly</button>
        <button type="button">Special</button>
      </div>

      <div className="quest-list">
        {quests.map((quest) => (
          <button
            key={quest.id}
            type="button"
            className={`quest-row ${selectedQuestId === quest.id ? 'selected' : ''} ${categoryColors[quest.category]}`}
            onClick={() => onSelectQuest(quest.id)}
          >
            <span className="quest-glyph" aria-hidden="true">
              <Icon name={quest.category === 'Body' ? 'bolt' : quest.category === 'Mind' ? 'leaf' : 'compass'} />
            </span>
            <span className="quest-row-copy">
              <strong>{quest.title}</strong>
              <small>{quest.summary}</small>
            </span>
            <span className="xp-pill">XP {quest.xp}</span>
            <span className="quest-target">{quest.target}</span>
            <ProgressBar value={quest.progress} compact />
          </button>
        ))}
      </div>
    </section>
  );
}

function QuestDetail({ quest, reward, activeProgress, onClaimReward }) {
  return (
    <aside className="panel active-quest">
      <div className="panel-header">
        <div>
          <h2>Active Quest</h2>
          <span>{quest.cadence} quest</span>
        </div>
        <span className={`status-dot ${categoryColors[quest.category]}`} aria-hidden="true" />
      </div>

      <div className="active-title">
        <span className={`quest-glyph ${categoryColors[quest.category]}`} aria-hidden="true">
          <Icon name={quest.category === 'Body' ? 'bolt' : quest.category === 'Mind' ? 'leaf' : 'compass'} />
        </span>
        <div>
          <h3>{quest.title}</h3>
          <p>{quest.detail}</p>
        </div>
      </div>

      <div className="step-list">
        <h4>Steps</h4>
        {quest.instructions.map((instruction, index) => (
          <div key={instruction} className={index < Math.ceil(quest.progress * quest.instructions.length) ? 'done' : ''}>
            <span aria-hidden="true" />
            <p>{instruction}</p>
          </div>
        ))}
      </div>

      <ProgressBar value={quest.progress} label={`Progress ${Math.round(quest.progress * 10)} / 10`} />

      <div className="reward-preview">
        <AnimatedCollectible collectible={reward} preview />
        <div>
          <h4>{reward.title}</h4>
          <span className={`pill ${categoryColors[reward.category]}`}>{reward.rarity}</span>
          <p>{reward.caption}</p>
        </div>
      </div>

      <div className="detail-stats">
        <span>Board charge <strong>{activeProgress}%</strong></span>
        <span>Reward XP <strong>{quest.xp}</strong></span>
      </div>

      <button type="button" className="primary-action" onClick={onClaimReward}>
        {quest.status === 'Completed' ? 'Unlock again' : 'Claim reward'}
      </button>
    </aside>
  );
}

function CommunityView() {
  return (
    <section className="community-page page-stack" aria-label="Community">
      <div className="page-heading">
        <div>
          <h1>Community</h1>
          <p>Watch the party feed, celebrate unlocks, and keep your weekly rivalry moving.</p>
        </div>
      </div>

      <div className="community-layout">
        <PartyFeed expanded />
        <Leaderboard />
      </div>
    </section>
  );
}

function RightRail({ catMood, collection, onCatAction, onNavigate }) {
  return (
    <aside className="right-rail">
      <PartyFeed />
      <Leaderboard compact />
      <CatPanel mood={catMood} collectionCount={collection.length} onAction={onCatAction} onOpenGallery={() => onNavigate('gallery')} />
    </aside>
  );
}

function PartyFeed({ expanded = false }) {
  return (
    <section className={`panel party-feed ${expanded ? 'expanded' : ''}`}>
      <div className="panel-header">
        <div>
          <h2>Community</h2>
          <span>Party Feed</span>
        </div>
        <button type="button" className="text-link">See all</button>
      </div>
      <div className="feed-list">
        {communityFeed.map((item) => (
          <article key={item.id} className="feed-row">
            <div className="mini-avatar" aria-hidden="true">{item.name.slice(0, 1)}</div>
            <div>
              <strong>{item.name}</strong>
              <p>{item.text}</p>
            </div>
            <span>{item.xp ? `+${item.xp} XP` : item.time}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Leaderboard({ compact = false }) {
  return (
    <section className={`panel leaderboard ${compact ? 'compact' : ''}`}>
      <div className="panel-header">
        <div>
          <h2>Leaderboard</h2>
          <span>This Week</span>
        </div>
      </div>
      {leaderboard.map((player, index) => (
        <div key={player.name} className={player.name === 'You' ? 'leader-row current' : 'leader-row'}>
          <span>{index + 1}</span>
          <strong>{player.name}</strong>
          <em>{player.xp.toLocaleString()} XP</em>
        </div>
      ))}
    </section>
  );
}

function CatPanel({ collectionCount, mood, onAction, onOpenGallery }) {
  const moodText = {
    focused: "You're doing awesome today.",
    proud: 'Reward secured. Tail is absolutely up.',
    playful: 'Neko wants a quick bonus quest.',
    cozy: 'Gallery snacks have been inspected.',
  };

  return (
    <section className="panel cat-panel" aria-label="Neko companion">
      <div className="panel-header">
        <div>
          <h2>Neko</h2>
          <span className="cat-mood-label">{mood}</span>
          <span className="cat-companion-label">Your companion on the path of growth.</span>
        </div>
        <span className="status-dot mind" aria-hidden="true" />
      </div>
      <div className="cat-stage">
        <CssCat />
        <div className="cat-bubble">{moodText[mood]}</div>
      </div>
      <div className="cat-stats">
        <span>Mood <strong>Happy</strong></span>
        <span>Stickers <strong>{collectionCount}</strong></span>
      </div>
      <div className="cat-actions">
        <button type="button" onClick={() => onAction('playful')}>Play</button>
        <button type="button" onClick={() => onAction('proud')}>Pet</button>
        <button type="button" onClick={() => { onAction('cozy'); onOpenGallery(); }}>Treat</button>
      </div>
    </section>
  );
}

function Gallery({ collection }) {
  return (
    <main className="gallery-shell page-stack">
      <div className="page-heading">
        <div>
          <h1>Gallery</h1>
          <p>Collectible archive for every reward unlocked by your account.</p>
        </div>
      </div>

      {collection.length === 0 ? (
        <section className="panel empty-gallery">
          <AnimatedCollectible collectible={{ category: 'Discovery' }} preview />
          <h2>No stickers unlocked yet</h2>
          <p>Complete a quest to send the first animated asset into this gallery.</p>
        </section>
      ) : (
        <section className="collection-grid" aria-label="Unlocked collectible gallery">
          {collection.map((item) => (
            <article className="panel collection-card" key={item.assetId}>
              <AnimatedCollectible collectible={item} />
              <span className={`pill ${categoryColors[item.category]}`}>{item.category}</span>
              <h2>{item.title}</h2>
              <p>{item.caption}</p>
              <small>{item.rarity} asset</small>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function LoadingScreen({ isVisible }) {
  return (
    <div className={`loading-screen ${isVisible ? '' : 'hidden'}`} aria-hidden={!isVisible}>
      <div className="loading-mark">
        <div className="loader-orbit orbit-one" />
        <div className="loader-orbit orbit-two" />
        <div className="loader-cat">
          <CssCat small />
        </div>
      </div>
      <p>Opening</p>
      <strong>QUESTS</strong>
    </div>
  );
}

function RewardBurst({ reward }) {
  return (
    <div className="reward-burst" role="status" aria-live="polite">
      <AnimatedCollectible collectible={reward} />
      <span>+{reward.xp} XP</span>
      <strong>{reward.title} unlocked</strong>
    </div>
  );
}

function AnimatedCollectible({ collectible, preview = false }) {
  const category = categoryColors[collectible.category] || 'discovery';
  return (
    <div className={`collectible-asset ${category} ${preview ? 'preview' : ''}`} aria-hidden="true">
      <div className="asset-card">
        <span className="asset-ear left" />
        <span className="asset-ear right" />
        <span className="asset-face" />
        <span className="asset-spark one" />
        <span className="asset-spark two" />
      </div>
    </div>
  );
}

function CssCat({ small = false }) {
  return (
    <div className={`css-cat ${small ? 'small' : ''}`} aria-hidden="true">
      <span className="cat-tail" />
      <span className="cat-body" />
      <span className="cat-head">
        <span className="cat-ear left" />
        <span className="cat-ear right" />
        <span className="cat-eye left" />
        <span className="cat-eye right" />
        <span className="cat-nose" />
      </span>
      <span className="cat-scarf" />
    </div>
  );
}

function ProgressBar({ value, label, compact = false }) {
  return (
    <div className={`progress-wrap ${compact ? 'compact' : ''}`}>
      {label && <span>{label}</span>}
      <div className="progress-bar" aria-hidden="true">
        <div style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === 'grid' && <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />}
      {name === 'check' && <path d="M9.5 17.2 4.8 12.5l1.8-1.8 2.9 2.9 7.9-7.9 1.8 1.8-9.7 9.7Z" />}
      {name === 'users' && <path d="M8.8 12a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Zm7.2.4a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2.8 20v-1.2c0-2.7 2.5-4.8 6-4.8s6 2.1 6 4.8V20h-12Zm12.2 0v-1.2c0-1.6-.6-3-1.7-4 3.2.1 5.9 1.8 5.9 4.1V20H15Z" />}
      {name === 'bookmark' && <path d="M6 4h12v17l-6-3.8L6 21V4Z" />}
      {name === 'sun' && <path d="M12 6.8a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4Zm-1-5h2v3h-2v-3Zm0 17.2h2v3h-2v-3ZM2 11h3v2H2v-2Zm17 0h3v2h-3v-2ZM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1Zm12.1 12.1 1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1Zm2.1-13.5 1.4 1.4-2.1 2.1-1.4-1.4 2.1-2.1ZM6.3 16.3l1.4 1.4-2.1 2.1-1.4-1.4 2.1-2.1Z" />}
      {name === 'moon' && <path d="M20.4 15.2A8.2 8.2 0 0 1 8.8 3.6 8.8 8.8 0 1 0 20.4 15.2Z" />}
      {name === 'star' && <path d="m12 2.8 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 2.8Z" />}
      {name === 'shield' && <path d="M12 2.7 20 6v5.9c0 4.8-3.2 8.2-8 9.4-4.8-1.2-8-4.6-8-9.4V6l8-3.3Zm0 3L6.5 8v3.9c0 3.4 2 5.7 5.5 6.8 3.5-1.1 5.5-3.4 5.5-6.8V8L12 5.7Z" />}
      {name === 'leaf' && <path d="M20.8 3.2C11 3.4 5.5 8.3 5.5 15c0 .8.1 1.5.4 2.2L3 20.1 4.9 22l2.7-2.7c.8.4 1.8.6 2.9.6 6.6 0 10.3-6.7 10.3-16.7ZM9.4 16.9c3.1-3.5 6.1-5.8 9-7.1-1.5 5-4.1 7.7-7.8 7.7-.4 0-.8 0-1.2-.1v-.5Z" />}
      {name === 'bolt' && <path d="M13.4 2 4.6 13.2h6.1L9.8 22l9.6-12.4h-6.3L13.4 2Z" />}
      {name === 'compass' && <path d="M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19Zm3.7 5.8-5.4 2-2 5.4 5.4-2 2-5.4Z" />}
    </svg>
  );
}

export default App;
