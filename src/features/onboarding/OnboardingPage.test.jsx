import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingPage } from './OnboardingPage';
const retry = vi.hoisted(() => vi.fn());
vi.mock('../quests/queries', () => ({ useMe: () => ({ isError: true, refetch: retry }), useUpdateMe: () => ({}) }));
it('does not allow profile setup while existing account data is unavailable', () => {
  render(<MemoryRouter><OnboardingPage /></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent('Profile unavailable');
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledOnce();
});
