import React, { useState } from 'react';
import {
  User, Mail, Lock, Phone, ArrowRight, ShieldCheck, CheckCircle2,
  AlertCircle, RefreshCw, BookOpen, UserPlus, LogIn, MailCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

interface AuthPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, initialMode = 'login' }) => {
  const { login, register, authError, sendPasswordResetEmail } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Sign Up Form State
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSent, setForgotSent] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const result = await login(loginEmail, loginPassword);
    setLoading(false);

    if (result.success) {
      setSuccessMsg(t('सफलतापूर्वक लॉगिन किया गया!', 'Login successful! Welcome back...'));
      setTimeout(() => onNavigate('dashboard'), 600);
    } else {
      setErrorMsg(result.error || t('लॉगिन विफल रहा।', 'Login failed. Please verify credentials.'));
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg(t('पासवर्ड मैच नहीं कर रहे हैं।', 'Passwords do not match.'));
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg(t('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।', 'Password must be at least 6 characters.'));
      return;
    }

    setLoading(true);
    const result = await register(signupName, signupEmail, signupPassword, signupPhone);
    setLoading(false);

    if (result.success && result.requiresEmailConfirmation) {
      // The account was created, but the user is NOT logged in yet — Supabase
      // is waiting for them to click the confirmation link in their email.
      // Redirecting to the dashboard here (like the fully-logged-in case
      // below) would send them straight to checkout later with no real
      // session, producing a confusing "please sign in" error on an account
      // they just made. Tell them the truth instead.
      setSuccessMsg(t(
        'खाता बन गया है! कृपया अपना ईमेल देखें और लॉगिन करने से पहले पुष्टिकरण लिंक पर क्लिक करें।',
        'Account created! Please check your email and click the confirmation link before logging in.'
      ));
    } else if (result.success) {
      setSuccessMsg(t('खाता सफलतापूर्वक बनाया गया! स्वागत है।', 'Account created successfully! Welcome.'));
      setTimeout(() => onNavigate('dashboard'), 800);
    } else {
      setErrorMsg(result.error || t('पंजीकरण विफल रहा।', 'Registration failed. Please try again.'));
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setErrorMsg(null);
    setLoading(true);
    const result = await sendPasswordResetEmail(forgotEmail);
    setLoading(false);
    if (result.success) {
      setForgotSent(true);
    } else {
      setErrorMsg(result.error || t('कुछ गड़बड़ हुई। कृपया फिर कोशिश करें।', 'Something went wrong. Please try again.'));
    }
  };

  return (
    <div className="py-10 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[{ label: mode === 'login' ? t('ग्राहक लॉगिन', 'Customer Sign In') : t('नया खाता बनाएं', 'Create Account') }]}
          onHomeClick={() => onNavigate('home')}
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Hero Card */}
          <div className="md:col-span-5 bg-[#8B1E3F] text-[#FFF8EE] p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden border border-[#D4AF37]/40">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30">
                <span className="text-2xl font-serif font-bold">ॐ</span>
              </div>

              <h2 className="font-serif text-2xl font-bold leading-tight text-[#FFF8EE]">
                {t('शक्ति से शांति - प्रामाणिक धार्मिक ग्रन्थ पोर्टल', 'Shakti Se Shanti - Sacred Scripture Portal')}
              </h2>

              <p className="text-xs text-[#E6D0A8] leading-relaxed">
                {t(
                  'प्रामाणिक वैदिक ग्रंथों और आध्यात्मिक पुस्तकों का संग्रह। सुरक्षित लॉगिन के साथ अपने ऑर्डर प्रबंधित करें।',
                  'Access verified sacred scriptures and spiritual literature. Sign in securely to manage your library and orders.'
                )}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#D4AF37]/30 text-xs text-[#FFF8EE]">
              <div className="flex items-center gap-2.5">
                <MailCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{t('सुरक्षित प्रमाणीकरण प्रणाली', 'Encrypted Authentication')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{t('ई-बुक एवं आर्डर ट्रैकिंग', 'Sync Orders & Reading Library')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{t('100% सुरक्षित भुगतान', 'Verified Gateway Integration')}</span>
              </div>
            </div>
          </div>

          {/* Right Auth Portal Form */}
          <div className="md:col-span-7 bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Mode Selector Tabs */}
            <div className="flex p-1 bg-[#F8F4E8] rounded-2xl text-xs font-bold border border-[#D4AF37]/30">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-[#8B1E3F] text-[#FFF8EE] shadow-sm'
                    : 'text-[#6E4E37] hover:text-[#8B1E3F]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{t('लॉगिन करें', 'Sign In')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-[#8B1E3F] text-[#FFF8EE] shadow-sm'
                    : 'text-[#6E4E37] hover:text-[#8B1E3F]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('नया रजिस्ट्रेशन', 'New Sign Up')}</span>
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-amber-100 border border-amber-300 rounded-2xl flex items-center gap-2 text-xs text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Error / Success Banners */}
            {errorMsg && (
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-2xl flex items-center gap-2 text-xs text-rose-900 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORM 1: CUSTOMER LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#8B1E3F] mb-1">
                    {t('ई-मेल एड्रेस *', 'Email Address *')}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                    <Mail className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-[#8B1E3F]">
                      {t('पासवर्ड *', 'Password *')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-[#8B1E3F] hover:underline font-bold"
                    >
                      {t('पासवर्ड भूल गए?', 'Forgot Password?')}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] font-mono"
                    />
                    <Lock className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold py-3 rounded-xl shadow border border-amber-200 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t('लॉगिन करें', 'Sign In')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* FORM 2: CUSTOMER SIGN UP */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#8B1E3F] mb-1">
                    {t('पूरा नाम *', 'Full Name *')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                    <User className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#8B1E3F] mb-1">
                      {t('ई-मेल एड्रेस *', 'Email Address *')}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        placeholder="name@domain.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                      />
                      <Mail className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#8B1E3F] mb-1">
                      {t('मोबाइल नंबर *', 'Mobile Phone *')}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={signupPhone}
                        onChange={e => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                      />
                      <Phone className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#8B1E3F] mb-1">
                      {t('पासवर्ड बनाएं *', 'Create Password *')}
                    </label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] font-mono focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8B1E3F] mb-1">
                      {t('पासवर्ड पुष्टि करें *', 'Confirm Password *')}
                    </label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={e => setSignupConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3.5 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] font-mono focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold py-3 rounded-xl shadow border border-amber-200 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t('रजिस्ट्रेशन करें', 'Complete Registration')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFF8EE] w-full max-w-md rounded-3xl p-6 border border-[#D4AF37]/50 shadow-sm space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">
              {t('पासवर्ड रिसेट करें', 'Reset Account Password')}
            </h3>
            {!forgotSent ? (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-[#6E4E37] font-medium">
                  {t(
                    'पासवर्ड रीसेट करने के लिए अपना ई-मेल एड्रेस दर्ज करें।',
                    'Enter your registered email address to receive password reset instructions.'
                  )}
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17]"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowForgotModal(false)} className="px-3 py-2 text-[#6E4E37] font-bold">
                    {t('रद्द करें', 'Cancel')}
                  </button>
                  <button type="submit" className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold px-4 py-2 rounded-xl shadow">
                    {t('रिसेट लिंक भेजें', 'Send Reset Link')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-emerald-800 font-bold">
                  ✓ {t(`पासवर्ड रिसेट लिंक ${forgotEmail} पर भेज दिया गया है।`, `Password reset instructions sent to ${forgotEmail}.`)}
                </p>
                <button onClick={() => setShowForgotModal(false)} className="w-full bg-[#8B1E3F] text-[#FFF8EE] font-bold py-2 rounded-xl">
                  {t('बंद करें', 'Close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
