import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { AccountQueryBoundary } from './AccountQueryBoundary';
import { logError } from '../../lib/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const offlineNativeMode = import.meta.env.VITE_OFFLINE_NATIVE === 'true';
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('habbit_guest_mode') === 'true');
  // Missing production auth configuration must never become an implicit local
  // identity. Vite development keeps the convenient local API workflow.
  const devMode = import.meta.env.MODE !== 'production' && !supabaseConfigured;

  useEffect(() => {
    if (!supabaseConfigured) return undefined;

    let active = true;
    let authEventReceived = false;
    const applySession = (nextSession) => {
      if (!active) return;
      if (nextSession) {
        localStorage.removeItem('habbit_guest_mode');
        setIsGuest(false);
      }
      setSession(nextSession);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!authEventReceived) applySession(data.session);
    }).catch(() => {
      if (!authEventReceived) applySession(null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true;
      applySession(nextSession);
    });

    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    // Server-side revocation path. When the API returns 401 (e.g. the user
    // was suspended or the token was revoked server-side) we clear the local
    // session state so the UI re-gates immediately. We do NOT call
    // supabase.auth.signOut() here intentionally: the Supabase token may still
    // be valid (the server revoked its own refresh token, not Supabase's), and
    // calling signOut() would trigger a redundant round-trip to an auth
    // endpoint that is unrelated to the revocation. If the user re-signs in via
    // Supabase within the token TTL they will be let through by the server again
    // only if their account status is restored.
    const handleUnauthorized = () => {
      setSession(null);
      setIsGuest(false);
      localStorage.removeItem('habbit_guest_mode');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'Your session has expired. Please sign in again.' }));
      }
    };
    window.addEventListener('habbit-auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('habbit-auth-unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !Capacitor.isNativePlatform()) return undefined;
    let listener;
    App.addListener('appUrlOpen', async ({ url }) => {
      if (!url?.startsWith('com.wildrealm.app://login-callback')) return;
      const callback = new URL(url);
      const code = callback.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) logError('oauth_callback_failed', error);
        else await Browser.close();
      }
    }).then((handle) => { listener = handle; });
    return () => { listener?.remove(); };
  }, []);

  const enterAsGuest = () => {
    localStorage.setItem('habbit_guest_mode', 'true');
    setIsGuest(true);
  };

  const exitGuest = () => {
    localStorage.removeItem('habbit_guest_mode');
    setIsGuest(false);
  };

  const value = useMemo(
    () => ({
      devMode,
      isGuest,
      enterAsGuest,
      loading,
      session,
      user: session?.user ?? null,
      isAuthenticated: (devMode && !offlineNativeMode) || isGuest || Boolean(session),
      getToken: async () => {
        if (isGuest) return 'guest';
        if (devMode) return 'dev';
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      },
      signInWithOAuth: async (provider) => {
        exitGuest();
        if (!supabaseConfigured) throw new Error('Social sign-in is not configured for this build.');
        const redirectTo = Capacitor.isNativePlatform()
          ? 'com.wildrealm.app://login-callback'
          : `${window.location.origin}/app`;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: Capacitor.isNativePlatform() },
        });
        if (error) throw error;
        if (Capacitor.isNativePlatform() && data?.url) {
          await Browser.open({ url: data.url, presentationStyle: 'popover' });
        }
      },
      signInWithPassword: async (email, password) => {
        exitGuest();
        if (!supabaseConfigured) throw new Error('Password sign-in is not configured for this build.');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUpWithPassword: async (email, password) => {
        exitGuest();
        if (!supabaseConfigured) throw new Error('Account creation is not configured for this build.');
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        exitGuest();
        if (devMode || !supabaseConfigured) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setSession(null);
      },
    }),
    [devMode, isGuest, loading, offlineNativeMode, session],
  );

  const identity = loading ? 'loading' : isGuest ? 'guest' : session?.user?.id ? `user:${session.user.id}` : devMode ? 'development' : 'anonymous';
  return <AuthContext.Provider value={value}><AccountQueryBoundary key={identity}>{children}</AccountQueryBoundary></AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
