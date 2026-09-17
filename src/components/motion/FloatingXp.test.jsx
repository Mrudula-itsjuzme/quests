import { render, screen, act } from '@testing-library/react';
import { FloatingXp } from './FloatingXp';
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
it('completes a visible reward without needing an external hide first', () => {
  const done = vi.fn();
  render(<FloatingXp xp={25} isVisible onComplete={done} />);
  expect(screen.getByRole('status')).toHaveTextContent('+25 XP');
  act(() => vi.advanceTimersByTime(1200));
  expect(done).toHaveBeenCalledOnce();
});
it('cancels the reward callback on unmount', () => {
  const done = vi.fn();
  const { unmount } = render(<FloatingXp xp={25} isVisible onComplete={done} />);
  unmount();
  act(() => vi.advanceTimersByTime(1200));
  expect(done).not.toHaveBeenCalled();
});
