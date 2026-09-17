import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), callback: null }));
vi.mock('../../lib/supabase', () => ({ supabaseConfigured: true, supabase: { auth: {
  getSession: mocks.getSession,
  onAuthStateChange: callback => { mocks.callback = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; },
} } }));
function Probe() {
  const auth = useAuth();
  return <div>{auth.loading ? 'Loading' : `${auth.user?.id || 'anonymous'}:${auth.isGuest ? 'guest' : 'account'}`}</div>;
}
afterEach(() => localStorage.removeItem('habbit_guest_mode'));
it('restores real authentication ahead of a stale guest flag', async () => {
  localStorage.setItem('habbit_guest_mode', 'true');
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'alice' } } } });
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(await screen.findByText('alice:account')).toBeInTheDocument();
  expect(localStorage.getItem('habbit_guest_mode')).toBeNull();
});
it('does not overwrite a newer auth event with a delayed session read', async () => {
  let resolve;
  mocks.getSession.mockReturnValue(new Promise(done => { resolve = done; }));
  render(<AuthProvider><Probe /></AuthProvider>);
  act(() => mocks.callback('SIGNED_IN', { user: { id: 'bob' } }));
  await act(async () => resolve({ data: { session: { user: { id: 'alice' } } } }));
  expect(screen.getByText('bob:account')).toBeInTheDocument();
});
it('finishes loading when session restoration rejects', async () => {
  mocks.getSession.mockRejectedValue(new Error('offline'));
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('anonymous:account')).toBeInTheDocument());
});

it('clears session and dispatches notice on habbit-auth-unauthorized event', async () => {
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'alice' } } } });
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(await screen.findByText('alice:account')).toBeInTheDocument();

  const noticeSpy = vi.fn();
  window.addEventListener('habbit-notice', noticeSpy);
  
  act(() => {
    window.dispatchEvent(new CustomEvent('habbit-auth-unauthorized', { detail: { code: 'account_inactive' } }));
  });

  expect(screen.getByText('anonymous:account')).toBeInTheDocument();
  expect(noticeSpy).toHaveBeenCalled();
  window.removeEventListener('habbit-notice', noticeSpy);
});
