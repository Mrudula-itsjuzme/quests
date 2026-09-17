import { render, screen, act } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { AccountQueryBoundary } from './AccountQueryBoundary';

it('isolates old cache and late writes when identity changes', () => {
  let client;
  function Probe() {
    client = useQueryClient();
    return <p>{client.getQueryData(['me'])?.displayName || 'Empty account'}</p>;
  }
  const { rerender } = render(<AccountQueryBoundary key="alice"><Probe /></AccountQueryBoundary>);
  const alice = client;
  act(() => alice.setQueryData(['me'], { displayName: 'Alice' }));
  rerender(<AccountQueryBoundary key="alice"><Probe /></AccountQueryBoundary>);
  expect(screen.getByText('Alice')).toBeInTheDocument();
  rerender(<AccountQueryBoundary key="bob"><Probe /></AccountQueryBoundary>);
  expect(screen.getByText('Empty account')).toBeInTheDocument();
  expect(client).not.toBe(alice);
  expect(alice.getQueryData(['me'])).toBeUndefined();
  act(() => alice.setQueryData(['me'], { displayName: 'Late Alice response' }));
  expect(client.getQueryData(['me'])).toBeUndefined();
});
