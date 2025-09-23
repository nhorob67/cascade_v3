'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { TenantContext } from '@/types/database';
import { getUserTenantContext } from '@/lib/tenant';

interface AuthContextType {
  user: User | null;
  tenantContext: TenantContext | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshTenantContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTenantContext = async () => {
    if (user) {
      const context = await getUserTenantContext(user.id);
      setTenantContext(context);
    } else {
      setTenantContext(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    refreshTenantContext();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenantContext,
        loading,
        signOut,
        refreshTenantContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};