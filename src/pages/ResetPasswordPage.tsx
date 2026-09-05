import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface ResetPasswordPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// This is where Supabase's password-reset email link lands the user
// (redirectTo is set to `${origin}/reset-password` in
// AuthContext.sendPasswordResetEmail). Supabase's client automatically
// detects the recovery token in the URL and establishes a temporary
// "recovery" session — this page just needs to let the user set a new
// password while that session is active.
export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { updatePassword } = useAuth();
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setHasRecoverySession(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasRecoverySession(Boolean(session));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए। / Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('दोनों पासवर्ड मेल नहीं खाते। / Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => onNavigate('login'), 2000);
    } else {
      setError(result.error || 'कुछ गड़बड़ हुई। / Something went wrong.');
    }
  };

  return (
    <div className="py-16 bg-[#F8F4E8] text-[#4A2C17] min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-3xl p-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] mx-auto flex items-center justify-center border border-[#8B1E3F]/20 mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#8B1E3F] text-center mb-2">
          नया पासवर्ड सेट करें
        </h1>

        {hasRecoverySession === null && (
          <p className="text-center text-sm text-[#6E4E37]">कृपया प्रतीक्षा करें...</p>
        )}

        {hasRecoverySession === false && (
          <div className="text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
            <p className="text-sm text-[#6E4E37]">
              यह लिंक अमान्य या समय-सीमा समाप्त हो चुका है। कृपया दोबारा "पासवर्ड भूल गए" से नया लिंक माँगें।
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="text-[#8B1E3F] font-bold underline"
            >
              लॉगिन पेज पर वापस जाएँ
            </button>
          </div>
        )}

        {hasRecoverySession === true && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8B1E3F] mb-1">नया पासवर्ड</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D4AF37]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8B1E3F] mb-1">पासवर्ड दोबारा डालें</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? 'सेव हो रहा है...' : 'पासवर्ड अपडेट करें'}
            </button>
          </form>
        )}

        {success && (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm text-[#6E4E37]">
              पासवर्ड सफलतापूर्वक अपडेट हो गया। अब आपको लॉगिन पेज पर भेजा जा रहा है...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
