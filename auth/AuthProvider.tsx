import React, { createContext, ReactNode } from 'react';
import { supabase } from '../supabase/client';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username?: string;
  preferences?: string[];
}

export interface AuthContextProps {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  role: string | null;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    role: 'customer' | 'business_owner',
    username?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signout: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  role: null,
  signin: async () => ({ success: false, error: 'Not implemented' }),
  signup: async () => ({ success: false, error: 'Not implemented' }),
  signout: async () => ({ success: false, error: 'Not implemented' }),
  updateProfile: async () => ({ success: false, error: 'Not implemented' }),
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setuser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSessionAndProfile = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error('Failed to fetch session');

        setSession(sessionData.session);
        setuser(sessionData.session?.user ?? null);

        if (sessionData.session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user') // changed from 'profiles'
            .select('id, username, preferences')
            .eq('id', sessionData.session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw new Error('Failed to fetch profile');
          }
          setProfile(profileData || { id: sessionData.session.user.id, preferences: [] });
          setRole(sessionData.session.user.user_metadata?.role || null);
        }
      } catch (error) {
        console.error('Error fetching session or profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setuser(newSession?.user ?? null);

      if (newSession?.user) {
        const role = newSession.user.user_metadata?.role;
        if (role && !['customer', 'business_owner'].includes(role)) {
          console.warn(`Invalid role detected: ${role}`);
        }

        const { data: profileData, error: profileError } = await supabase
          .from('user') // changed from 'profiles'
          .select('id, username, preferences')
          .eq('id', newSession.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile on auth change:', profileError);
        }
        setProfile(profileData || { id: newSession.user.id, preferences: [] });
        setRole(newSession.user.user_metadata?.role || null);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    const refreshInterval = setInterval(async () => {
      if (session) {
        const { error } = await supabase.auth.refreshSession();
        if (error) console.error('Error refreshing session:', error);
      }
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    return () => {
      listener?.subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [session]);

  const signin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw new Error(error.message);
      }
      if (data.user) {
        const role = data.user.user_metadata?.role;
        if (role && !['customer', 'business_owner'].includes(role)) {
          throw new Error('Invalid user role');
        }

        const { data: profileData, error: profileError } = await supabase
          .from('user') // changed from 'profiles'
          .select('id, username, preferences')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error('Failed to fetch profile');
        }
        setProfile(profileData || { id: data.user.id, preferences: [] });
        setRole(data.user.user_metadata?.role || null);
      }
      return { success: true };
    } catch (error) {
      console.error('Sign-in error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sign in' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    role: 'customer' | 'business_owner',
    username?: string
  ) => {
    try {
      if (!['customer', 'business_owner'].includes(role)) {
        throw new Error('Invalid role specified');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, username },
        },
      });

      if (error) {
        if (error.message.includes('user already registered')) {
          throw new Error('Email already registered');
        }
        throw new Error(error.message);
      }

      if (data.user) {

        const { error: profileError } = await supabase.from("user").insert({
          id: data.user.id,
          username: username, // or use username if that's the field
          preferences: [],
        });

        if (profileError) throw new Error('Failed to create user profile');

        setProfile({ id: data.user.id, username, preferences: [] });
        setRole(data.user.user_metadata?.role || null);
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
      setProfile(null);
      setRole(null);
      return { success: true };
    } catch (error) {
      console.error('Sign-out error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sign out' };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('user')
        .upsert({ id: user.id, ...updates }, { onConflict: 'id' });

      if (error) throw new Error('Failed to update profile');

      setProfile((prev) => (prev ? { ...prev, ...updates } : { id: user.id, ...updates, preferences: updates.preferences || [] }));
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, role, signin, signup, signout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};