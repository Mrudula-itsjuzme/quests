import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Registers a single Android hardware back-button handler.
 * `onBack` is tried first (e.g. close an open modal/sheet); if it returns
 * false/undefined, falls through to router history, then app exit.
 */
export function useAndroidBackButton(onBack) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let handle;
    let cancelled = false;

    import('@capacitor/app').then(({ App }) => {
      if (cancelled) return;
      App.addListener('backButton', ({ canGoBack }) => {
        const handled = onBack?.();
        if (handled) return;
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      }).then((h) => { handle = h; });
    });

    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, [onBack]);
}
