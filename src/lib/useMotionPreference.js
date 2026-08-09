import { useEffect, useState } from 'react';

export const MOTION_REDUCED_KEY = 'habbit_motion_reduced';
export const MOTION_PREFERENCE_EVENT = 'habbit-motion-preference-changed';

export function isMotionReduced() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MOTION_REDUCED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setMotionReduced(reduced) {
  window.localStorage.setItem(MOTION_REDUCED_KEY, reduced ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent(MOTION_PREFERENCE_EVENT));
}

/** Tracks the explicit in-app "Calm Motion" toggle so MotionConfig can react to it live. */
export function useMotionReducedPreference() {
  const [reduced, setReduced] = useState(isMotionReduced);

  useEffect(() => {
    const onChange = () => setReduced(isMotionReduced());
    window.addEventListener(MOTION_PREFERENCE_EVENT, onChange);
    return () => window.removeEventListener(MOTION_PREFERENCE_EVENT, onChange);
  }, []);

  return reduced;
}
