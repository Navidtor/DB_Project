import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, isMockMode } from '@/lib/supabase';
import type { User as DBUser, Profile } from '@/types/database';

// Mock user for demo mode
const MOCK_USER: DBUser = {
  user_id: 'user-1',
  name: 'علی احمدی',
  username: 'ali_ahmadi',
  email: 'ali@example.com',
  phone: '09121234567',
  password_hash: '',
  profile_image: '/images/avatar_user_1.png',
  created_at: '2024-01-15T10:30:00Z',
  user_type: 'regular',
};

interface AuthContextType {
  user: User | null;
  dbUser: DBUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { name: string; username: string; phone?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  isAuthenticated: boolean;
  isMockMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from our users table
  const fetchUserData = async (authUserId: string) => {
    if (!supabase) return;
    
    try {
      // Fetch user from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authUserId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      setDbUser(userData);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_with_counts')
        .select('*')
        .eq('user_id', authUserId)
        .single();

      if (!profileError && profileData) {
        // Fetch interests
        const { data: interests } = await supabase
          .from('profile_interests')
          .select('interest')
          .eq('profile_id', profileData.profile_id);

        setProfile({
          ...profileData,
          interests: interests?.map(i => i.interest) || [],
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // If in mock mode, use mock user
    if (isMockMode || !isSupabaseConfigured) {
      setDbUser(MOCK_USER);
      setProfile({
        profile_id: 'profile-1',
        user_id: 'user-1',
        bio: 'عاشق سفر و طبیعت گردی هستم.',
        cover_image: '/images/cover_profile_1.png',
        interests: ['کوهنوردی', 'عکاسی', 'طبیعت گردی'],
        followers_count: 245,
        following_count: 128,
      });
      setLoading(false);
      return;
    }

    // Track if initial session has been handled to avoid race conditions
    let initialSessionHandled = false;

    // Get initial session with proper error handling
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase!.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear any stale session data on error
          setSession(null);
          setUser(null);
          setDbUser(null);
          setProfile(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            // Fetch user data but don't block loading state
            fetchUserData(session.user.id).catch(err => {
              console.error('Error fetching user data during init:', err);
            });
          }
        }
      } catch (error) {
        console.error('Exception during session initialization:', error);
        // Ensure we clear state on any error
        setSession(null);
        setUser(null);
        setDbUser(null);
        setProfile(null);
      } finally {
        // Always set loading to false after initial session check
        if (!initialSessionHandled) {
          initialSessionHandled = true;
          setLoading(false);
        }
      }
    };

    initializeSession();

    // Listen for auth changes (handles sign in, sign out, token refresh)
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        // Skip if this is the initial session event and we already handled it
        if (event === 'INITIAL_SESSION' && initialSessionHandled) {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user data in the background, don't block state updates
          fetchUserData(session.user.id).catch(err => {
            console.error('Error fetching user data on auth change:', err);
          });
        } else {
          setDbUser(null);
          setProfile(null);
        }
        
        // Mark initial session as handled if this is the first event
        if (!initialSessionHandled) {
          initialSessionHandled = true;
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData: { name: string; username: string; phone?: string }
  ): Promise<{ error: Error | null }> => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from signup');

      // Create user record in our users table
      const { error: userError } = await supabase.from('users').insert({
        user_id: authData.user.id,
        name: userData.name,
        username: userData.username,
        email: email,
        phone: userData.phone || null,
        password_hash: 'supabase_auth', // Password handled by Supabase Auth
        user_type: 'regular',
      });

      if (userError) throw userError;

      // Profile will be auto-created by trigger
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!supabase) {
      // Mock mode - simulate login
      if (isMockMode) {
        setDbUser(MOCK_USER);
        return { error: null };
      }
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setDbUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    if (!supabase || !dbUser) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: updates.bio,
          cover_image: updates.cover_image,
        })
        .eq('user_id', dbUser.user_id);

      if (error) throw error;

      // Update interests if provided
      if (updates.interests && profile?.profile_id) {
        // Delete existing interests
        await supabase
          .from('profile_interests')
          .delete()
          .eq('profile_id', profile.profile_id);

        // Insert new interests
        if (updates.interests.length > 0) {
          await supabase.from('profile_interests').insert(
            updates.interests.map(interest => ({
              profile_id: profile.profile_id,
              interest,
            }))
          );
        }
      }

      // Refresh profile data
      await fetchUserData(dbUser.user_id);
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    user,
    dbUser,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: isMockMode ? !!dbUser : !!session,
    isMockMode: isMockMode || !isSupabaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
