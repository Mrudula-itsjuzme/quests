import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicProfile } from './PublicProfile';
const state = vi.hoisted(() => ({ profile: null, mutate: vi.fn(), refetch: vi.fn(), isError: false }));
vi.mock('../quests/queries', () => ({
  useCommunityProfile: () => ({ data: state.profile, isLoading: false, isError: state.isError, refetch: state.refetch }),
  useSetCommunityFollow: () => ({ mutate: state.mutate, isPending: false, isError: false }),
}));
function open() { return render(<MemoryRouter initialEntries={['/app/community/user/alice']}><Routes><Route path="/app/community/user/:id" element={<PublicProfile />} /></Routes></MemoryRouter>); }
beforeEach(() => { state.isError = false; state.profile = { userId: 'alice', displayName: 'Alice Fern', rankTitle: 'Explorer', stats: { posts: 0, followers: 7, following: 3 }, viewer: { isSelf: false, isFollowing: false }, recentPosts: [] }; vi.clearAllMocks(); });
it('uses the public API statistics and submits follow for the displayed account', () => {
  open();
  expect(screen.getByRole('heading', { name: 'Alice Fern' })).toBeInTheDocument();
  expect(screen.getByText('7')).toBeInTheDocument();
  expect(screen.getByText('Explorer')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Follow explorer' }));
  expect(state.mutate).toHaveBeenCalledWith({ userId: 'alice', following: true });
});
it('offers retry for a failed lookup and a stable route back', () => {
  state.profile = null; state.isError = true; open();
  expect(screen.getByRole('alert')).toHaveTextContent('Profile unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(state.refetch).toHaveBeenCalledOnce();
  expect(screen.getByRole('link', { name: 'Community' })).toHaveAttribute('href', '/app/community');
});
