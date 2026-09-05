import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// NOTE: this used to use Supabase's native TOTP MFA (authenticator app + QR
// code scan). Replaced with email OTP per request — simpler for the admin:
// no app to install, just a 6-digit code sent to their email each time they
// log in (using the same email delivery already set up for signup
// confirmation / password reset).
export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { isAdmin, mfaRequired, mfaEmail, loginAdminStep1, verifyAdminMfa, resendAdminOtp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // FIXED (2026-08-31 — "OTP verify hone ke baad URL '/admin' dikhta hai"):
  // this used to call onNavigate('admin') the instant isAdmin flipped true,
  // pushing the browser to the guessable /admin path right after a
  // successful login. App.tsx now renders AdminPage directly in place of
  // this component (same URL, no navigation) the moment isAdmin becomes
  // true, so this component doesn't need to do anything once verified —
  // it simply stops being rendered.

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await loginAdminStep1(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed.');
    }
    // If successful with requiresMfa, the component re-renders showing the
    // OTP form automatically (driven by mfaRequired from context).
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await verifyAdminMfa(otpCode);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid code.');
    }
    // On success, isAdmin becomes true and the useEffect above redirects.
  };

  const handleResend = async () => {
    setError(null);
    setResendMsg(null);
    const result = await resendAdminOtp();
    setResendMsg(result.success ? 'A new code has been sent to your email.' : (result.error || 'Could not resend code.'));
  };

  return (
    <div className="py-16 bg-[#F8F4E8] text-[#4A2C17] min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-3xl p-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] mx-auto flex items-center justify-center border border-[#8B1E3F]/20 mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#8B1E3F] text-center mb-1">
          Admin Portal Login
        </h1>
        <p className="text-xs text-center text-[#6E4E37] mb-6">
          {mfaRequired
            ? `Enter the 6-digit code sent to ${mfaEmail}`
            : 'Sign in with your admin account'}
        </p>

        {!mfaRequired ? (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8B1E3F] mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D4AF37]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8B1E3F] mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D4AF37]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                required
              />
            </div>
            {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8B1E3F] mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> 6-Digit Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-3 bg-white border border-[#D4AF37]/40 rounded-xl text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                placeholder="------"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
            {resendMsg && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{resendMsg}</p>}
            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#8B1E3F] py-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
