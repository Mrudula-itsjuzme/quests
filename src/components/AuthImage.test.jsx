import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth/AuthContext';
import { CaptureImage } from './CaptureImage';

vi.mock('../lib/supabase', () => ({ supabase: null, supabaseConfigured: false }));

describe('authenticated capture images', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back after one failed request without entering a render retry loop', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { container } = render(
      <AuthProvider>
        <CaptureImage
          imageRef="/api/v1/community/posts/missing/media"
          alt="Missing community discovery"
          element="Earth"
          useAuth
        />
      </AuthProvider>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.querySelector('img')).toHaveAttribute('src', '/assets/quest-compass-poster.png'));
    expect(container.querySelector('.capture-image')).toHaveAttribute('data-state', 'loaded');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

it('never attaches authentication to an external media reference', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const { container } = render(<AuthProvider><CaptureImage imageRef="https://untrusted.example/captures/private/media" alt="External reference" useAuth /></AuthProvider>);
  await waitFor(() => expect(container.querySelector('.capture-image')).toHaveAttribute('data-state', 'loaded'));
  expect(fetchMock).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
