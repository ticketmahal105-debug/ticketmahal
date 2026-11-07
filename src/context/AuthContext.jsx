import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata) => {
    const normalizedEmail = (email || '').trim();
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.endsWith('.local'));

    const emailRedirectTo = isLocalhost
      ? `${window.location.origin}/auth/callback`
      : 'https://ticketmahal.ae/auth/callback';

    return await supabase.auth.signUp({
      email: normalizedEmail,
      password, // Password remains completely untouched
      options: {
        data: metadata,
        emailRedirectTo,
      },
    });
  };

  const signIn = async (email, password) => {
    const normalizedEmail = (email || '').trim();
    return await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password, // Password remains completely untouched
    });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const resetPassword = async (email, redirectTo) => {
    const normalizedEmail = (email || '').trim();
    return await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });
  };

  const updatePassword = async (newPassword) => {
    return await supabase.auth.updateUser({
      password: newPassword,
    });
  };

  const signInWithGoogle = async () => {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.endsWith('.local'));

    const redirectTo = isLocalhost
      ? `${window.location.origin}/auth/callback`
      : 'https://ticketmahal.ae/auth/callback';

    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
