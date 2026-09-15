import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase, supabaseConfigured } from '../../lib/supabase';

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

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
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
        if (error) console.error('Native OAuth callback failed', { message: error.message });
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
        if (devMode) return;
        await supabase.auth.signOut();
      },
    }),
    [devMode, isGuest, loading, offlineNativeMode, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
