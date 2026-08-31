import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, OrderAddress } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Auto-logout / idle-timeout settings — see the useEffect further below
// for the full explanation of why this exists.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const LAST_ACTIVITY_KEY = 'dharma_last_activity_at';

interface AuthContextType {
  user: UserProfile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  // NOTE: previously there was no way for a page (e.g. the Customer
  // Dashboard / Affiliate Portal) to tell the difference between "we
  // haven't checked Supabase for a session yet" and "we checked, and
  // there is definitely no logged-in user" — both looked like `user ===
  // null`. That's exactly why /dashboard and /affiliate were rendering
  // (with the AffiliatePortal's still-empty placeholder state) for
  // logged-out visitors: there was no signal to gate on. isAuthLoading
  // starts true and flips to false once the initial getSession() call
  // resolves, so pages can show a loader instead of guessing.
  isAuthLoading: boolean;
  isAdmin: boolean;
  mfaRequired: boolean;
  mfaEmail: string | null;
  authError: string | null;
  // FIXED (auto-logout / idle timeout): there was previously no session
  // expiry at all — once logged in (customer or admin), the session
  // stayed alive indefinitely with no inactivity check, which is a real
  // security gap especially for the admin panel on a shared/public
  // computer. sessionTimedOut flips to true the moment the idle-timeout
  // logout fires, so the UI can show a clear "you were logged out due to
  // inactivity" message instead of the person just silently landing back
  // on a login screen with no explanation.
  sessionTimedOut: boolean;
  clearSessionTimedOut: () => void;
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
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [mfaRequired, setMfaRequired] = useState<boolean>(false);
  const [mfaEmail, setMfaEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionTimedOut, setSessionTimedOut] = useState<boolean>(false);

  // Sync state with Supabase Auth session
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError('Authentication service is not configured.');
      setIsAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionToken(session.access_token);
        fetchUserProfileAndRole(session.user.id, session.user.email || '').finally(() => setIsAuthLoading(false));
      } else {
        setUser(null);
        setSessionToken(null);
        setIsAdmin(false);
        setIsAuthLoading(false);
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
    const cleanPhone = (phone || '').trim();
    if (!cleanEmail || !password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // FIXED (duplicate registration — same email): profiles.email already
    // mirrors auth.users, so a pre-check here catches an already-registered
    // email up front with a clear message, instead of letting the request
    // reach Supabase and produce the ambiguous "success" response handled
    // below. This alone doesn't prevent someone bypassing the client, which
    // is why the identities-length check further down is the real backstop.
    const { data: emailTaken } = await supabase.rpc('is_email_registered', { p_email: cleanEmail });
    if (emailTaken) {
      return { success: false, error: 'This email is already registered. Please log in instead.' };
    }

    // FIXED (duplicate registration — same phone): profiles.phone had no
    // uniqueness constraint at all, so the same real mobile number could be
    // attached to any number of separate accounts. Checked here via a
    // SECURITY DEFINER RPC (migration 011) that only returns a boolean, so
    // no other profile data is exposed to a logged-out visitor.
    if (cleanPhone) {
      const { data: phoneTaken } = await supabase.rpc('is_phone_registered', { p_phone: cleanPhone });
      if (phoneTaken) {
        return { success: false, error: 'This mobile number is already registered with another account.' };
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          fullName,
          phone: cleanPhone,
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

    // FIXED (duplicate registration — same email, race-condition backstop):
    // when signUp() is called with an email that already has an account,
    // Supabase deliberately does NOT return an error (to avoid leaking which
    // emails exist) — it returns `{ user, session: null }` with `identities`
    // as an EMPTY array. The old code had no idea this case existed and
    // treated it exactly like a brand-new signup awaiting email
    // confirmation, so re-submitting an existing email showed "Account
    // created! Please check your email" — indistinguishable from an
    // actual new account being created. Checking identities.length here
    // catches this even if the pre-check above raced with another signup.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { success: false, error: 'This email is already registered. Please log in instead.' };
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

    // FIXED (2026-08-30 — CRITICAL: "bina otp ke login ho raha hai"): a
    // successful signInWithPassword() here creates a real, active Supabase
    // session — which immediately triggers the onAuthStateChange listener
    // above, which calls fetchUserProfileAndRole WITHOUT knownAal2. That
    // function then falls back to checking sessionStorage for a PRIOR OTP
    // verification for this exact user id. If this same admin had EVER
    // completed OTP once before in this browser tab (and sessionStorage
    // was never cleared — e.g. they closed the tab instead of clicking
    // Logout), that stale flag still matched their user id on this BRAND
    // NEW login attempt, and isAdmin got set to true immediately — before
    // this function even finished sending/requiring a fresh OTP code.
    // Clearing it here, before OTP is even sent, means every fresh
    // email+password login attempt is provably un-verified until a real
    // OTP is entered again, closing that race for good — while a plain
    // page refresh (which never calls this function) is untouched, so it
    // still doesn't force re-entering a code every time.
    sessionStorage.removeItem('dharma_admin_otp_verified');

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
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  };

  const clearSessionTimedOut = () => setSessionTimedOut(false);

  // FIXED (auto-logout / idle timeout — real security gap): neither
  // customer accounts nor the admin panel ever expired on their own.
  // Someone logged into the admin panel on a shared/public computer (or a
  // customer on a library/cyber-cafe PC) who forgot to log out stayed
  // signed in indefinitely — the Supabase session token just kept
  // silently refreshing itself forever. This logs everyone out (customer
  // and admin alike — admin is just a `user` with an elevated role, so
  // one mechanism covers both) after 15 minutes with no mouse/keyboard/
  // touch/scroll activity.
  //
  // Last-activity time is kept in localStorage (not just a React ref) for
  // two reasons: it survives a page refresh (so reloading the tab right
  // before the timeout doesn't reset the clock to "fully active" for no
  // reason), and it's shared across every open tab of the same site, so
  // typing in one tab correctly keeps you logged in on all of them rather
  // than each tab independently timing out.
  useEffect(() => {
    if (!user) return;

    const markActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };
    markActivity();

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel',
    ];
    activityEvents.forEach(evt => window.addEventListener(evt, markActivity, { passive: true }));

    // Checked periodically rather than with a single long-lived
    // setTimeout, since a laptop going to sleep would otherwise let a
    // single setTimeout fire late (or not at all) instead of correctly
    // detecting "more than 15 idle minutes have actually passed".
    const intervalId = window.setInterval(() => {
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
      if (Date.now() - last >= IDLE_TIMEOUT_MS) {
        logout();
        setSessionTimedOut(true);
      }
    }, 15000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, markActivity));
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
        isAuthLoading,
        isAdmin,
        mfaRequired,
        mfaEmail,
        authError,
        sessionTimedOut,
        clearSessionTimedOut,
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
