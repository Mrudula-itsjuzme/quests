import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fs from 'node:fs';
import { queryClient } from './lib/queryClient';
import App from './App';

const mockMe = {
  id: 'dev-user',
  displayName: 'Local Adventurer',
  timezone: 'UTC',
  totalXp: 300,
  level: 2,
  tier: 'Bronze',
  subLevel: 'I',
  tierLabel: 'Bronze Explorer I',
  xpIntoLevel: 50,
  xpForCurrentLevel: 250,
  xpToNextLevel: 200,
  progressToNextLevel: 0.2,
  streakDays: 3,
  onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
};

const mockQuest = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Dawn Observation',
  description: 'Spend a few quiet minutes observing the environment around you at dawn.',
  category: 'Mind',
  rarity: 'Rare',
  cadence: 'daily',
  status: 'active',
  verificationType: 'TEXT',
  progressValue: 0,
  targetValue: 80,
  unit: 'words',
  xpReward: 120,
  instructions: ['Find a quiet spot', 'Record your observations'],
};

const mockCommunityPost = {
  id: '22222222-2222-4222-8222-222222222222',
  userId: 'u-101',
  author: { userId: 'u-101', displayName: 'Lyra Moonweaver', totalXp: 24800, rankTitle: 'Pathfinder' },
  cardId: '33333333-3333-4333-8333-333333333333',
  discovery: { itemName: 'Malabar Trogon', cardTitle: 'Malabar Trogon', rarityTier: 'S', rarityGrade: 'S', rarityStars: 5, speciesId: 'malabar-trogon', imageRef: null, capturedAt: '2026-08-01T06:00:00.000Z' },
  caption: 'Held still just long enough.',
  hashtags: ['#birding'],
  placeLabel: 'Silent Valley',
  gps: { lat: 11.08, lng: 76.44 },
  visibility: 'public',
  likeCount: 3,
  commentCount: 1,
  viewerLiked: false,
  createdAt: '2026-08-01T06:00:00.000Z',
};

const mockHotspot = {
  id: 'demo-jog-falls',
  name: 'Jog Falls',
  category: 'Waterfalls',
  description: 'The Sharavathi drops in four distinct cascades.',
  gps: { lat: 14.2295, lng: 74.8126 },
  region: 'Karnataka, India',
  featuredSpecies: ['water-waterfall'],
  isDemo: true,
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
      if (url.includes('/v1/world/hotspots')) return jsonResponse([mockHotspot]);
      if (url.includes('/v1/community/friends')) return jsonResponse([]);
      if (url.includes('/v1/community/posts')) return jsonResponse([]);
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
    expect((await screen.findAllByText(/dawn observation/i)).length).toBeGreaterThan(0);
  });

  it('submits quest completion through the backend before showing completion feedback', async () => {
    renderApp('/app/quests');

    await screen.findAllByText(/dawn observation/i);
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
    expect(await screen.findByText(/dawn observation complete/i)).toBeInTheDocument();
  });

  it('exposes the five reference destinations and the community surface', async () => {
    renderApp('/app/community');
    expect(await screen.findByRole('heading', { name: /^community$/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^chats$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^realm$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^places$/i })).toBeInTheDocument();
  });

  it('shows a real community empty state instead of a coming-soon placeholder', async () => {
    renderApp('/app/community');
    fireEvent.click(await screen.findByRole('tab', { name: /^realm$/i }));
    expect(await screen.findByText(/no discoveries shared yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    // Sharing must be an available action, not an aria-disabled stub. Both the
    // floating action button and the empty-state CTA offer it.
    const shareButtons = screen.getAllByRole('button', { name: /share a discovery/i });
    expect(shareButtons.length).toBeGreaterThan(0);
    shareButtons.forEach((button) => expect(button).toBeEnabled());
  });

  it('renders real community posts returned by the server', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/v1/me')) return jsonResponse(mockMe);
      if (url.includes('/v1/community/posts')) return jsonResponse([mockCommunityPost]);
      return jsonResponse([]);
    });
    renderApp('/app/community');
    fireEvent.click(await screen.findByRole('tab', { name: /^realm$/i }));
    expect(await screen.findByText(/Malabar Trogon/i)).toBeInTheDocument();
    expect(screen.getByText(/Silent Valley/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /like this discovery/i })).toBeInTheDocument();
  });

  it('surfaces a community error state instead of substituting fixture data', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/v1/me')) return jsonResponse(mockMe);
      if (url.includes('/v1/community/posts')) return jsonResponse({ error: { code: 'internal_error' } }, 500);
      return jsonResponse([]);
    });
    renderApp('/app/community');
    fireEvent.click(await screen.findByRole('tab', { name: /^realm$/i }));
    // 5xx responses are retried with backoff before the query settles as an
    // error, so this needs longer than the default 1s findBy timeout.
    expect(await screen.findByRole('alert', {}, { timeout: 10_000 })).toHaveTextContent(/couldn’t reach the community service/i);
    expect(screen.queryByText(/Malabar Trogon/i)).not.toBeInTheDocument();
  }, 15_000);

  it('renders curated world hotspots on Explore for an account with no captures', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/v1/me')) return jsonResponse(mockMe);
      if (url.includes('/v1/world/hotspots')) return jsonResponse([mockHotspot]);
      if (url.includes('/v1/captures')) return jsonResponse([]);
      return jsonResponse([]);
    });
    renderApp('/app');
    // The map must have content even though the player has captured nothing.
    const titles = await screen.findAllByText(/Jog Falls/i);
    expect(titles.length).toBeGreaterThan(0);
    // The curated place carries its category chip, not a rarity grade.
    expect(screen.getAllByText('Waterfalls').length).toBeGreaterThan(0);
  });

  it('shows a retryable error state when the hotspot endpoint fails', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/v1/me')) return jsonResponse(mockMe);
      if (url.includes('/v1/world/hotspots')) return jsonResponse({ error: { code: 'internal_error' } }, 500);
      return jsonResponse([]);
    });
    renderApp('/app');
    // A failed map request must be visible, never a silently blank map.
    expect(await screen.findByRole('alert', {}, { timeout: 10_000 }))
      .toHaveTextContent(/couldn’t be loaded/i);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  }, 15_000);

  it('leaves the rewards skeleton once every query resolves', async () => {
    renderApp('/app/rewards');
    // The page must reach its real content, not sit in the loading skeleton.
    expect(await screen.findByText(/Reward Track/i)).toBeInTheDocument();
    expect(screen.queryByText(/Opening the reward vault/i)).not.toBeInTheDocument();
  });

  it('shows the server coin balance in the store panel', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/v1/me')) return jsonResponse({ ...mockMe, coins: 1234 });
      return jsonResponse([]);
    });
    renderApp('/app/rewards');
    expect(await screen.findByText(/coins earned from captures/i)).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    // Redemption has no endpoint, so it must be visibly disabled, not fake.
    screen.getAllByRole('button', { name: /coming soon/i }).forEach((b) => expect(b).toBeDisabled());
  });

  it('renders profile progression from real account data', async () => {
    renderApp('/app/profile');
    expect(await screen.findByRole('heading', { name: /Local Adventurer/i })).toBeInTheDocument();
    expect(screen.getByText(/Bronze Explorer I/i)).toBeInTheDocument();
  });

  it.each(['/app/library', '/app/quests', '/app/community', '/app/profile'])('opens camera capture from %s', async (route) => {
    renderApp(route);
    const cameraButtons = await screen.findAllByLabelText(/open camera capture/i);

    fireEvent.click(cameraButtons[cameraButtons.length - 1]);

    expect(await screen.findByRole('button', { name: /capture photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bloom/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('navigates every primary dock tab without leaving a blank app shell', async () => {
    renderApp('/app');
    await screen.findByLabelText(/notifications/i);

    fireEvent.click(screen.getAllByRole('link', { name: /quests/i }).at(-1));
    expect(await screen.findByRole('heading', { name: /^quests$/i, hidden: true })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /library/i }).at(-1));
    expect(await screen.findByText(/Your collection starts here/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /community/i }).at(-1));
    expect(await screen.findByRole('heading', { name: /^community$/i, hidden: true })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /map/i }).at(-1));
    expect(await screen.findByLabelText(/notifications/i)).toBeInTheDocument();
  });

  it('shows the collection empty state when no collectibles are unlocked', async () => {
    renderApp('/app/collection');

    expect(await screen.findByText(/Your collection starts here/i)).toBeInTheDocument();
  });

  it('does not ship the removed blocking startup splash', () => {
    const html = fs.readFileSync(`${process.cwd()}/index.html`, 'utf8');
    expect(html).not.toContain('id="splash"');
    expect(html).not.toContain('__hideSplash');
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
