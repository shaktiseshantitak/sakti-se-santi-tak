import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, OrderAddress } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  mfaRequired: boolean;
  mfaFactorId: string | null;
  mfaChallengeId: string | null;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  loginAdminStep1: (email: string, password: string) => Promise<{ success: boolean; requiresMfa?: boolean; error?: string }>;
  verifyAdminMfa: (code: string) => Promise<{ success: boolean; error?: string }>;
  cancelAdminMfa: () => void;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  addAddress: (address: OrderAddress) => Promise<void>;
  removeAddress: (index: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [mfaRequired, setMfaRequired] = useState<boolean>(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync state with Supabase Auth session
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError('Authentication service is not configured.');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionToken(session.access_token);
        fetchUserProfileAndRole(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setSessionToken(null);
        setIsAdmin(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        setSessionToken(session.access_token);
        fetchUserProfileAndRole(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSessionToken(null);
        setIsAdmin(false);
        setMfaRequired(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfileAndRole = async (userId: string, email: string) => {
    if (!supabase) return;

    try {
      // 1. Query Profile (No role column in profiles table!)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. Query Authoritative Role from user_roles
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const role = userRole?.role || 'customer';
      const isUserAdmin = role === 'admin';

      // 3. Verify MFA AAL level if user is admin
      let isAal2Verified = false;
      if (isUserAdmin) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        isAal2Verified = aalData?.currentLevel === 'aal2';
      }

      const userProfile: UserProfile = {
        id: userId,
        email: email || profile?.email || '',
        fullName: profile?.full_name || email.split('@')[0],
        phone: profile?.phone || '',
        avatarUrl: profile?.avatar_url || '',
        role: isUserAdmin ? 'admin' : 'customer',
        addresses: profile?.addresses || [],
        wishlistBookIds: profile?.wishlist_book_ids || [],
        purchasedEBookIds: profile?.purchased_ebook_ids || [],
        createdAt: profile?.created_at || new Date().toISOString(),
      };

      setUser(userProfile);
      setIsAdmin(isUserAdmin && isAal2Verified);
    } catch (err) {
      console.error('Error fetching user profile and role:', err);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication service is not configured.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    // Server-side auth rate limit check
    try {
      const rlRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (rlRes.status === 429) {
        const rlData = await rlRes.json();
        return { success: false, error: rlData.error || 'Too many login attempts. Account security lockout active.' };
      }
    } catch {
      // Continue if server rate-limiter endpoint is unreachable
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user || !data.session) {
      return { success: false, error: error?.message || 'Invalid login credentials.' };
    }

    setSessionToken(data.session.access_token);
    await fetchUserProfileAndRole(data.user.id, data.user.email || cleanEmail);
    return { success: true };
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    phone: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication service is not configured.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          fullName,
          phone,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.session) {
      setSessionToken(data.session.access_token);
      await fetchUserProfileAndRole(data.user!.id, cleanEmail);
    }

    return { success: true };
  };

  const loginAdminStep1 = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; requiresMfa?: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication service is not configured.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Server-side auth rate limit check
    try {
      const rlRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (rlRes.status === 429) {
        const rlData = await rlRes.json();
        return { success: false, error: rlData.error || 'Too many admin login attempts. Account security lockout active.' };
      }
    } catch {
      // Continue if server rate-limiter endpoint is unreachable
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user || !data.session) {
      return { success: false, error: 'Invalid admin credentials.' };
    }

    // Verify admin role in user_roles
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    if (userRole?.role !== 'admin') {
      await supabase.auth.signOut();
      return { success: false, error: 'Account does not have administrator privileges.' };
    }

    setSessionToken(data.session.access_token);

    // List MFA factors for Supabase MFA verification
    const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.find(f => f.status === 'verified') || factors?.totp?.[0];

    if (totpFactor) {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeErr || !challenge) {
        return { success: false, error: challengeErr?.message || 'Failed to initiate MFA challenge.' };
      }

      setMfaRequired(true);
      setMfaFactorId(totpFactor.id);
      setMfaChallengeId(challenge.id);
      return { success: true, requiresMfa: true };
    }

    // If no MFA factor enrolled, fetch profile & role to update state
    await fetchUserProfileAndRole(data.user.id, cleanEmail);
    return { success: true, requiresMfa: false };
  };

  const verifyAdminMfa = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication service is not configured.' };
    }

    if (!mfaFactorId || !mfaChallengeId) {
      return { success: false, error: 'No active MFA challenge found.' };
    }

    // Server-side MFA rate limit check
    try {
      const rlRes = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email || 'admin' }),
      });
      if (rlRes.status === 429) {
        const rlData = await rlRes.json();
        return { success: false, error: rlData.error || 'Too many MFA attempts. Account security lockout active.' };
      }
    } catch {
      // Continue if server rate-limiter endpoint is unreachable
    }

    const { data, error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: mfaChallengeId,
      code: code.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    setMfaRequired(false);
    setMfaFactorId(null);
    setMfaChallengeId(null);
    setIsAdmin(true);

    if (user) {
      await fetchUserProfileAndRole(user.id, user.email);
    }

    return { success: true };
  };

  const cancelAdminMfa = () => {
    setMfaRequired(false);
    setMfaFactorId(null);
    setMfaChallengeId(null);
    if (supabase) {
      supabase.auth.signOut().catch(console.error);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(console.error);
    }
    setUser(null);
    setSessionToken(null);
    setIsAdmin(false);
    setMfaRequired(false);
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user || !supabase) return;

    const allowedUpdates = {
      full_name: updated.fullName,
      phone: updated.phone,
      avatar_url: updated.avatarUrl,
    };

    const { error } = await supabase
      .from('profiles')
      .update(allowedUpdates)
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updated });
    }
  };

  const addAddress = async (newAddr: OrderAddress) => {
    if (!user || !supabase) return;
    const currentAddrs = user.addresses || [];
    const updated = newAddr.isDefault
      ? currentAddrs.map(a => ({ ...a, isDefault: false }))
      : [...currentAddrs];
    const newAddresses = [...updated, newAddr];

    const { error } = await supabase
      .from('profiles')
      .update({ addresses: newAddresses })
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, addresses: newAddresses });
    }
  };

  const removeAddress = async (index: number) => {
    if (!user || !supabase) return;
    const updated = [...user.addresses];
    updated.splice(index, 1);

    const { error } = await supabase
      .from('profiles')
      .update({ addresses: updated })
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, addresses: updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isAuthenticated: Boolean(user),
        isAdmin,
        mfaRequired,
        mfaFactorId,
        mfaChallengeId,
        authError,
        login,
        register,
        loginAdminStep1,
        verifyAdminMfa,
        cancelAdminMfa,
        logout,
        updateProfile,
        addAddress,
        removeAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
