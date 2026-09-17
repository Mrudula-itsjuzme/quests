import { renderHook, waitFor } from '@testing-library/react';
import { useCameraPreview } from './useCameraPreview';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));

describe('camera direction and stream lifecycle', () => {
  const originalMedia = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
  afterEach(() => {
    if (originalMedia) Object.defineProperty(navigator, 'mediaDevices', originalMedia);
    else delete navigator.mediaDevices;
  });

  it('releases the rear stream before switching and releases the front stream on exit', async () => {
    const rearStop = vi.fn();
    const frontStop = vi.fn();
    const getUserMedia = vi.fn()
      .mockResolvedValueOnce({ getTracks: () => [{ stop: rearStop }] })
      .mockResolvedValueOnce({ getTracks: () => [{ stop: frontStop }] });
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    const { result, rerender, unmount } = renderHook(
      ({ facing }) => useCameraPreview(true, facing),
      { initialProps: { facing: 'environment' } },
    );
    await waitFor(() => expect(result.current.status).toBe('live'));
    expect(getUserMedia.mock.calls[0][0].video.facingMode).toEqual({ ideal: 'environment' });
    rerender({ facing: 'user' });
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));
    expect(rearStop).toHaveBeenCalledOnce();
    expect(getUserMedia.mock.calls[1][0].video.facingMode).toEqual({ ideal: 'user' });
    await waitFor(() => expect(result.current.status).toBe('live'));
    unmount();
    expect(frontStop).toHaveBeenCalledOnce();
  });

  it('stops a stream that resolves after the camera has closed', async () => {
    let resolveStream;
    const stop = vi.fn();
    const getUserMedia = vi.fn(() => new Promise((resolve) => { resolveStream = resolve; }));
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
    const { unmount } = renderHook(() => useCameraPreview());
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledOnce());
    unmount();
    resolveStream({ getTracks: () => [{ stop }] });
    await waitFor(() => expect(stop).toHaveBeenCalledOnce());
  });
});
