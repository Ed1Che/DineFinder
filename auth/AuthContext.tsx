import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, role: 'customer' | 'business_owner') => Promise<{ success: boolean; error?: string }>;
  signout: () => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  loading: true,
  signin: async () => ({ success: false, error: 'Not implemented' }),
  signup: async () => ({ success: false, error: 'Not implemented' }),
  signout: async () => ({ success: false, error: 'Not implemented' }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setuser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw new Error('Failed to fetch session');
        setSession(data.session);
        setuser(data.session?.user ?? null);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setuser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signin = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return { success: true };
    } catch (error) {
      console.error('Sign-in error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sign in' };
    }
  };

  const signup = async (email: string, password: string, role: 'customer' | 'business_owner') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });

      if (error) throw new Error(error.message);

      if (data.user) {
        // Insert user into 'users' table for role management
        const { error: dbError } = await supabase
          .from('user')
          .insert({ id: data.user.id, email, role });

        if (dbError) throw new Error('Failed to save user role');
      }

      return { success: true };
    } catch (error) {
      console.error('Sign-up error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sign up' };
    }
  };

  const signout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      setuser(null);
      setSession(null);
      return { success: true };
    } catch (error) {
      console.error('Sign-out error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sign out' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signin, signup, signout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);