import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, OrderAddress } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  mfaRequired: boolean;
  mfaEmail: string | null;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string, phone: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  loginAdminStep1: (email: string, password: string) => Promise<{ success: boolean; requiresMfa?: boolean; error?: string }>;
  verifyAdminMfa: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendAdminOtp: () => Promise<{ success: boolean; error?: string }>;
  cancelAdminMfa: () => void;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
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
  const [mfaEmail, setMfaEmail] = useState<string | null>(null);
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

  const fetchUserProfileAndRole = async (userId: string, email: string, knownAal2?: boolean) => {
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

      // 3. Check whether this browser session has already passed admin email
      // OTP verification. Replaced the old TOTP/AAL2 check per request —
      // OTP-only is simpler for the admin to use (no authenticator app to
      // install). Since email OTP sign-in doesn't set Supabase's own AAL2
      // claim the way TOTP did, we track "verified this session" ourselves
      // via sessionStorage (cleared on logout / new browser session) so a
      // page refresh doesn't force re-entering a fresh code every time —
      // this is a convenience gate only; the real enforcement is still the
      // server-side is_admin() checks in RLS policies and API routes,
      // completely unaffected by this flag.
      let isAal2Verified = knownAal2 ?? false;
      if (isUserAdmin && !knownAal2) {
        isAal2Verified = sessionStorage.getItem('dharma_admin_otp_verified') === userId;
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
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
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
        // FIXED: without this, Supabase falls back to whatever "Site URL" is
        // configured in Dashboard → Authentication → URL Configuration for
        // the confirmation email's link target. If that dashboard setting is
        // stale/wrong (e.g. still pointing at a dev/preview URL instead of
        // the live site), clicking the confirmation link redirects
        // somewhere broken and errors immediately — exactly the reported
        // bug. Being explicit here removes that dependency entirely.
        emailRedirectTo: `${window.location.origin}/email-confirmed`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.session) {
      setSessionToken(data.session.access_token);
      await fetchUserProfileAndRole(data.user!.id, cleanEmail);
      return { success: true };
    }

    // FIXED: when the Supabase project has email confirmation enabled (the
    // default for a new project), signUp() succeeds and creates the user but
    // returns session: null — the user is NOT actually logged in until they
    // click the confirmation link in their email. This used to silently
    // return { success: true } here with no way for the caller to tell the
    // difference from a real, immediate login. The UI (AuthPage.tsx) then
    // told the user "Account created! Welcome" and sent them straight to
    // checkout while user/sessionToken were still null — so placing an order
    // failed with "please sign in", even though they'd just "signed up",
    // because they were never actually authenticated in the first place.
    if (data.user && !data.session) {
      return { success: true, requiresEmailConfirmation: true };
    }

    return { success: false, error: 'Registration failed. Please try again.' };
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

    // Step 2: send a one-time email code. Replaced Supabase's native TOTP
    // MFA (which needed an authenticator app) with email OTP per request —
    // simpler for the admin, using the same email delivery already set up
    // for signup confirmation / password reset. shouldCreateUser: false
    // because we've already confirmed this exact account exists above; this
    // call should only ever send a code to an existing user, never create one.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      return { success: false, error: otpError.message || 'Failed to send verification code.' };
    }

    setMfaRequired(true);
    setMfaEmail(cleanEmail);
    return { success: true, requiresMfa: true };
  };

  const verifyAdminMfa = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !mfaEmail) {
      return { success: false, error: 'No pending verification. Please log in again.' };
    }

    // Server-side rate limit check — brute-force protection on OTP guesses,
    // same as the old TOTP flow had.
    try {
      const rlRes = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mfaEmail }),
      });
      if (rlRes.status === 429) {
        const rlData = await rlRes.json();
        return { success: false, error: rlData.error || 'Too many verification attempts. Account security lockout active.' };
      }
    } catch {
      // Continue if server rate-limiter endpoint is unreachable
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: mfaEmail,
      token: code,
      type: 'email',
    });

    if (error || !data.session || !data.user) {
      return { success: false, error: error?.message || 'Invalid or expired verification code.' };
    }

    setSessionToken(data.session.access_token);
    // Remember that this browser session has passed OTP verification, keyed
    // to this specific user id, so a page refresh doesn't force re-entering
    // a fresh code every time (see the comment in fetchUserProfileAndRole).
    sessionStorage.setItem('dharma_admin_otp_verified', data.user.id);

    setMfaRequired(false);
    setMfaEmail(null);
    setIsAdmin(true);

    await fetchUserProfileAndRole(data.user.id, data.user.email || mfaEmail, true);

    return { success: true };
  };

  const resendAdminOtp = async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !mfaEmail) {
      return { success: false, error: 'No pending verification. Please log in again.' };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: mfaEmail,
      options: { shouldCreateUser: false },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const cancelAdminMfa = () => {
    setMfaRequired(false);
    setMfaEmail(null);
    if (supabase) {
      supabase.auth.signOut().catch(console.error);
    }
  };

  // NOTE: "Forgot Password" on AuthPage.tsx previously did nothing but show a
  // fake "email sent" message — no actual email was ever sent, no reset link
  // ever generated. This is the real implementation.
  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication service is not configured.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      // Supabase intentionally doesn't say "email not found" for this call
      // (prevents leaking which emails are registered) — surface real errors
      // (rate limiting etc.) but keep a generic message otherwise.
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  // NOTE: there was no way at all for a logged-in customer to change their
  // password — CustomerDashboardPage.tsx only ever let them edit name/phone.
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication service is not configured.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(console.error);
    }
    setUser(null);
    setSessionToken(null);
    setIsAdmin(false);
    setMfaRequired(false);
    setMfaEmail(null);
    sessionStorage.removeItem('dharma_admin_otp_verified');
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
        mfaEmail,
        authError,
        login,
        register,
        loginAdminStep1,
        verifyAdminMfa,
        resendAdminOtp,
        cancelAdminMfa,
        sendPasswordResetEmail,
        updatePassword,
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
