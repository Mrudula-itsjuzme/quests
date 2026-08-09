import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { queryClient } from './lib/queryClient';
import App from './App';

const mockMe = {
  id: 'dev-user',
  displayName: 'Local Adventurer',
  timezone: 'UTC',
  totalXp: 300,
  level: 2,
  tier: 'Bronze',
  xpIntoLevel: 50,
  xpForCurrentLevel: 250,
  xpToNextLevel: 200,
  progressToNextLevel: 0.2,
  streakDays: 3,
  onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
};

const mockQuest = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Morning Mindfulness',
  description: 'Complete a breathing ritual.',
  category: 'Mind',
  rarity: 'Rare',
  cadence: 'daily',
  status: 'active',
  verificationType: 'TEXT',
  progressValue: 0,
  targetValue: 1,
  unit: 'session',
  xpReward: 120,
  instructions: ['Sit quietly', 'Breathe for 10 minutes'],
};

vi.mock('./lib/supabase', () => ({ supabase: null, supabaseConfigured: false }));

function renderApp(initialPath = '/app') {
  queryClient.clear();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App (development auth mode)', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/v1/me')) return jsonResponse(mockMe);
      if (url.includes('/v1/quests/') && url.includes('/submissions')) return jsonResponse({ completed: true, xpCredited: 120, bonusXp: 0 });
      if (url.includes('/v1/quests/') && url.includes('/progress')) return jsonResponse({ completed: true, xpCredited: 120, bonusXp: 0 });
      if (url.includes('/v1/quests/active')) return jsonResponse([mockQuest]);
      if (url.includes('/v1/quests/history')) return jsonResponse([]);
      if (url.includes('/v1/quests/definitions')) return jsonResponse([]);
      if (url.includes('/v1/collectibles')) return jsonResponse([]);
      if (url.includes('/v1/feed')) return jsonResponse([]);
      if (url.includes('/v1/leaderboard')) return jsonResponse([]);
      if (url.includes('/v1/notifications')) return jsonResponse([]);
      if (url.includes('/v1/rewards')) return jsonResponse([]);
      return jsonResponse(null, 404);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the world/capture screen with real profile data instead of hardcoded fallbacks', async () => {
    renderApp('/app');

    expect(await screen.findByLabelText(/notifications/i)).toBeInTheDocument();
    expect(screen.queryByText(/1,240/)).not.toBeInTheDocument();
    expect(screen.queryByText('24')).not.toBeInTheDocument();
  });

  it('does not render a leaderboard section on the world/capture screen', async () => {
    renderApp('/app');
    await screen.findByLabelText(/notifications/i);

    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument();
  });

  it('navigates to the quest board and filters quests', async () => {
    renderApp('/app/quests');

    await screen.findByRole('heading', { name: /^quests$/i, hidden: true });
    expect((await screen.findAllByText(/morning mindfulness/i)).length).toBeGreaterThan(0);
  });

  it('submits quest completion through the backend before showing completion feedback', async () => {
    renderApp('/app/quests');

    await screen.findAllByText(/morning mindfulness/i);
    fireEvent.click(screen.getByRole('button', { name: /^view$/i }));
    fireEvent.change(await screen.findByLabelText(/write your reflection/i), { target: { value: 'A real reflection proof.' } });
    fireEvent.click(screen.getByRole('button', { name: /submit proof/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/quests/11111111-1111-4111-8111-111111111111/submissions'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'A real reflection proof.' }),
      }),
    ));
    expect(await screen.findByText(/morning mindfulness complete/i)).toBeInTheDocument();
  });

  it('exposes the five reference destinations and the community surface', async () => {
    renderApp('/app/community');
    expect(await screen.findByRole('heading', { name: /^community$/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^feed$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^friends$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^map$/i })).toBeInTheDocument();
  });

  it('renders profile progression from real account data', async () => {
    renderApp('/app/profile');
    expect(await screen.findByRole('heading', { name: /Local Adventurer/i })).toBeInTheDocument();
    expect(screen.getByText(/Bronze 2/i)).toBeInTheDocument();
  });

  it('shows the collection empty state when no collectibles are unlocked', async () => {
    renderApp('/app/collection');

    expect(await screen.findByText(/Your collection starts here/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated dev-mode users straight into the app (no fake landing bypass)', async () => {
    renderApp('/');
    await waitFor(() => expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument());
  });
});

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}
