import { render, screen, fireEvent } from '@testing-library/react';
import { WaxSealCeremony } from './WaxSealCeremony';
it('renders confirmed level data without crashing and supports keyboard dismissal', () => {
  const close = vi.fn();
  render(<WaxSealCeremony levelUp={{ level: 4, tier: 'Explorer', xp: 25 }} onComplete={close} />);
  expect(screen.getByRole('heading', { name: 'Level 4' })).toBeInTheDocument();
  expect(screen.getByText('+25 XP earned')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue exploring' })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(close).toHaveBeenCalledOnce();
});
it('does not invent a reward when no XP is supplied', () => {
  render(<WaxSealCeremony levelUp={{ level: 2 }} onComplete={() => {}} />);
  expect(screen.queryByText(/XP earned/)).not.toBeInTheDocument();
});
