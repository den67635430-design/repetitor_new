import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  name: string;
  user_type: string;
  class_level: number | null;
  learning_goal: string | null;
  username: string | null;
  client_id: number | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, user_type, class_level, learning_goal, username, client_id')
      .eq('user_id', userId)
      .maybeSingle();

    setProfile(data);
  };

  const fetchAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up listener FIRST — handles hash tokens from email confirmation links
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }

        // INITIAL_SESSION fires after hash tokens are processed,
        // so this is the only safe place to set loading = false.
        if (event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // Safety timeout — in case INITIAL_SESSION never fires (shouldn't happen, but just in case)
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return {
    user,
    session,
    profile,
    isAdmin,
    loading,
    signOut,
    refreshProfile,
    hasProfile: !!profile,
  };
}
