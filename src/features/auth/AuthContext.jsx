import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('habbit_guest_mode') === 'true');
  const devMode = !supabaseConfigured;

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
      isAuthenticated: devMode || isGuest || Boolean(session),
      getToken: async () => {
        if (isGuest) return 'guest';
        if (devMode) return 'dev';
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      },
      signInWithPassword: async (email, password) => {
        exitGuest();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUpWithPassword: async (email, password) => {
        exitGuest();
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        exitGuest();
        if (devMode) return;
        await supabase.auth.signOut();
      },
    }),
    [devMode, isGuest, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
