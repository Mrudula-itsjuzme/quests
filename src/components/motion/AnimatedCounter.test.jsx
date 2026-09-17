import { render, screen, act } from '@testing-library/react';
import { AnimatedCounter } from './AnimatedCounter';
import { setMotionReduced } from '../../lib/useMotionPreference';
const state = vi.hoisted(() => ({ system: false, animate: vi.fn(() => ({ stop: vi.fn() })) }));
vi.mock('framer-motion', async original => ({ ...await original(), animate: state.animate, useReducedMotion: () => state.system }));
afterEach(() => { localStorage.removeItem('habbit_motion_reduced'); state.system = false; vi.clearAllMocks(); });
it('updates immediately without animation under system reduced motion', () => {
  state.system = true;
  const { rerender } = render(<AnimatedCounter value={10} suffix=" XP" />);
  rerender(<AnimatedCounter value={25} suffix=" XP" />);
  expect(screen.getByText('25 XP')).toBeInTheDocument();
  expect(state.animate).not.toHaveBeenCalled();
});
it('switches an active counter to the actual value when Calm Motion is enabled', () => {
  const { rerender } = render(<AnimatedCounter value={10} />);
  rerender(<AnimatedCounter value={25} />);
  expect(state.animate).toHaveBeenCalledOnce();
  act(() => setMotionReduced(true));
  expect(screen.getByText('25')).toBeInTheDocument();
  expect(state.animate.mock.results[0].value.stop).toHaveBeenCalled();
  rerender(<AnimatedCounter value={40} />);
  expect(screen.getByText('40')).toBeInTheDocument();
  expect(state.animate).toHaveBeenCalledOnce();
});
