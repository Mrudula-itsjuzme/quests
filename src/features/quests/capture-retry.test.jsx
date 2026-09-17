import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCaptureItem } from './queries';
const mocks = vi.hoisted(() => ({ createCapture: vi.fn() }));
vi.mock('../../lib/useApiClient', () => ({ useApiClient: () => mocks }));
it('reuses capture identity after a failed response and separates candidate confirmation', async () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useCaptureItem(), { wrapper });
  const bundle = { captureId: '11111111-1111-4111-8111-111111111111', imageBase64: 'photo' };
  mocks.createCapture.mockRejectedValueOnce(new Error('connection interrupted')).mockResolvedValue({ id: 'saved' });
  await act(async () => { await expect(result.current.mutateAsync(bundle)).rejects.toThrow('connection interrupted'); });
  await act(async () => { await result.current.mutateAsync({ ...bundle }); });
  expect(mocks.createCapture.mock.calls[0][1]).toBe(mocks.createCapture.mock.calls[1][1]);
  await act(async () => { await result.current.mutateAsync({ ...bundle, chosenCandidateIndex: 0 }); });
  expect(mocks.createCapture.mock.calls[2][1]).not.toBe(mocks.createCapture.mock.calls[1][1]);
});

it('keeps candidate retries stable and gives a retaken photo a separate identity', async () => {
  mocks.createCapture.mockReset();
  mocks.createCapture.mockRejectedValue(new Error('connection interrupted'));
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useCaptureItem(), { wrapper });
  const original = { captureId: '11111111-1111-4111-8111-111111111111', chosenCandidateIndex: 1 };
  for (const bundle of [original, { ...original }, { ...original, captureId: '22222222-2222-4222-8222-222222222222' }]) {
    await act(async () => { await expect(result.current.mutateAsync(bundle)).rejects.toThrow('connection interrupted'); });
  }
  const keys = mocks.createCapture.mock.calls.map(call => call[1]);
  expect(keys[0]).toBe(keys[1]);
  expect(keys[2]).not.toBe(keys[0]);
});
