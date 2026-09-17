import { render, screen, fireEvent } from '@testing-library/react';
import { StartupScreen } from './StartupScreen';
it('keeps session loading accessible while showing the reference brand',()=>{
  render(<StartupScreen message="Opening your journal…"/>);
  expect(screen.getByRole('status')).toHaveTextContent('Opening your journal…');
  expect(screen.getByRole('heading',{name:'Wild Realm'})).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
it('preserves the error message and retry action',()=>{
  const retry=vi.fn();
  render(<StartupScreen error title="Connection unavailable" message="Your journal could not load." onRetry={retry}/>);
  expect(screen.getByRole('alert')).toHaveTextContent('Your journal could not load.');
  fireEvent.click(screen.getByRole('button',{name:'Try again'}));
  expect(retry).toHaveBeenCalledOnce();
});
