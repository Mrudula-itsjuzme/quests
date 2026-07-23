import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
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
      if (url.includes('/v1/quests/active')) return jsonResponse([mockQuest]);
      if (url.includes('/v1/collectibles')) return jsonResponse([]);
      return jsonResponse(null, 404);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the dashboard with real profile data instead of hardcoded fallbacks', async () => {
    renderApp('/app');

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect((await screen.findAllByText(/morning mindfulness/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/1,240/)).not.toBeInTheDocument();
    expect(screen.queryByText('24')).not.toBeInTheDocument();
  });

  it('does not render a community or leaderboard section', async () => {
    renderApp('/app');
    await screen.findByRole('heading', { name: /dashboard/i });

    expect(screen.queryByText(/leaderboard/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /community/i })).not.toBeInTheDocument();
  });

  it('navigates to the quest board and filters quests', async () => {
    renderApp('/app/quests');

    await screen.findAllByRole('heading', { name: /quest board/i });
    expect((await screen.findAllByText(/morning mindfulness/i)).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Daily' })).toBeInTheDocument();
  });

  it('shows the gallery empty state when no collectibles are unlocked', async () => {
    renderApp('/app/gallery');

    expect(await screen.findByText(/no stickers unlocked yet/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated dev-mode users straight into the app (no fake landing bypass)', async () => {
    renderApp('/');
    await waitFor(() => expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument());
  });
});

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}
