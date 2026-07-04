import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = vi.fn(() => Promise.reject(new Error('offline')));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the standalone dashboard heading', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(await screen.findByText(/using local collection/i)).toBeInTheDocument();
  });

  it('shows local-only sync messaging when the API is offline', async () => {
    render(<App />);

    expect(await screen.findByText(/using local collection/i)).toBeInTheDocument();
  });

  it('adds a new quest from the create button', async () => {
    render(<App />);
    await screen.findByText(/using local collection/i);

    fireEvent.click(screen.getAllByRole('button', { name: /create a new hydration quest/i })[0]);

    await waitFor(() => expect(screen.getAllByText(/hydration combo/i).length).toBeGreaterThanOrEqual(2));
    await waitFor(() => expect(screen.getByText(/new quest added locally/i)).toBeInTheDocument());
  });

  it('claims a reward and updates quest progress', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quest: { ...mockCompletedQuest, status: 'Completed', progress: 1 },
          collectible: mockCollectible,
        }),
      });

    render(<App />);
    await screen.findByText(/using local collection/i);

    fireEvent.click(screen.getByRole('button', { name: /claim reward/i }));

    await waitFor(() => expect(screen.getAllByText(/\+120 XP/i).length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.getByText(/collectible saved to your reward database/i)).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /gallery/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /focus wisp/i })).toBeInTheDocument();
  });

  it('toggles light mode', async () => {
    render(<App />);
    await screen.findByText(/using local collection/i);

    fireEvent.click(screen.getByRole('button', { name: /light mode/i }));

    expect(screen.getByRole('button', { name: /dark mode/i })).toBeInTheDocument();
  });
});

const mockCompletedQuest = {
  id: 'daily-focus',
  title: 'Morning Mindfulness',
  summary: 'Complete a 10-minute breathing ritual and capture the feeling.',
  detail: 'Sit somewhere calm, breathe slowly, and note one intention for the day.',
  category: 'Mind',
  rarity: 'Rare',
  xp: 120,
  status: 'Completed',
  progress: 1,
  target: '7/10 days',
  instructions: ['Set a quiet timer', 'Breathe for 10 minutes', 'Write one line of gratitude'],
  proofType: 'photo',
  cadence: 'daily',
};

const mockCollectible = {
  assetId: 'wisp-focus',
  questId: 'daily-focus',
  title: 'Focus Wisp',
  category: 'Mind',
  rarity: 'Rare',
  caption: 'Unlocked for completing a mindful streak ritual.',
  unlockedAt: '2026-07-05T00:00:00.000Z',
};
