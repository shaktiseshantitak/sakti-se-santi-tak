import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, KeyRound, Smartphone, AlertCircle, ArrowLeft,
  CheckCircle2, RefreshCw, QrCode, Copy, Check, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { getTotpSecondsRemaining, setupAdminTotpMfa, TotpSetupDetails } from '../utils/totp';

interface AdminLoginPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const {
    loginAdminStep1,
    verifyAdminMfa,
    cancelAdminMfa,
    mfaRequired,
    isAdmin,
    authError
  } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');

  // UI states
  const [step, setStep] = useState<1 | 2>(mfaRequired ? 2 : 1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState<number>(getTotpSecondsRemaining());

  // QR Setup state
  const [showQrSetup, setShowQrSetup] = useState<boolean>(false);
  const [qrDetails, setQrDetails] = useState<TotpSetupDetails | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);

  // Auto-redirect if already verified admin
  useEffect(() => {
    if (isAdmin) {
      onNavigate('admin');
    }
  }, [isAdmin, onNavigate]);

  // Sync step with MFA state
  useEffect(() => {
    if (mfaRequired) {
      setStep(2);
    }
  }, [mfaRequired]);

  // Dynamic 30s countdown timer for TOTP window
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(getTotpSecondsRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const result = await loginAdminStep1(email, password);
    setLoading(false);

    if (result.success) {
      if (result.requiresMfa) {
        setStep(2);
        setSuccessMessage('Step 1 authenticated. Please enter your 6-digit MFA security code.');
      } else {
        setSuccessMessage('Authentication Successful! Redirecting to Admin Dashboard...');
        setTimeout(() => onNavigate('admin'), 500);
      }
    } else {
      setErrorMessage(result.error || 'Authentication failed.');
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const result = await verifyAdminMfa(totpCode);
    setLoading(false);

    if (result.success) {
      setSuccessMessage('MFA Verification Passed! Accessing Admin Dashboard...');
      setTimeout(() => {
        onNavigate('admin');
      }, 500);
    } else {
      setErrorMessage(result.error || 'Invalid MFA code.');
    }
  };

  const handleEnrollMfa = async () => {
    setLoading(true);
    const result = await setupAdminTotpMfa();
    setLoading(false);
    if (result.success && result.details) {
      setQrDetails(result.details);
      setShowQrSetup(true);
    } else {
      setErrorMessage(result.error || 'Failed to setup MFA.');
    }
  };

  const copySecretKey = () => {
    if (qrDetails?.secret) {
      navigator.clipboard.writeText(qrDetails.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 3000);
    }
  };

  return (
    <div className="py-12 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-md mx-auto px-4 space-y-6">
        <Breadcrumbs
          items={[{ label: 'Admin Security Login' }]}
          onHomeClick={() => onNavigate('home')}
        />

        {/* Security Login Card */}
        <div className="bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#8B1E3F]" />

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#D4AF37]/20 text-[#8B1E3F] mb-1 border border-[#D4AF37]/40 shadow-inner">
              {step === 1 ? <ShieldCheck className="w-8 h-8" /> : <Smartphone className="w-8 h-8" />}
            </div>

            <h1 className="font-serif text-2xl font-bold text-[#8B1E3F]">
              {step === 1 ? 'Admin Panel Login' : 'MFA 2-Step Verification'}
            </h1>

            <p className="text-xs text-[#6E4E37] font-medium">
              {step === 1
                ? 'Enter your verified administrator credentials'
                : `Enter 6-digit MFA verification code (${email})`}
            </p>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${step === 1 ? 'bg-[#8B1E3F] text-[#FFF8EE]' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                {step === 1 ? 'Step 1: Password' : '✓ Step 1 Passed'}
              </span>
              <span className="text-[#D4AF37]">→</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${step === 2 ? 'bg-[#8B1E3F] text-[#FFF8EE]' : 'bg-[#F8F4E8] text-[#6E4E37]'}`}>
                Step 2: MFA Code
              </span>
            </div>
          </div>

          {/* Configuration Failure Warning */}
          {authError && (
            <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Alert Toast Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-100 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1 FORM: Email & Password */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#8B1E3F] mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-3.5 pr-4 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#8B1E3F] mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-4 py-2.5 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] font-mono"
                  />
                  <Lock className="w-4 h-4 text-[#8B1E3F] absolute right-3 top-3" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold text-xs py-3 rounded-xl shadow border border-amber-200 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Proceed to MFA Verification</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2 FORM: MFA Code */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-[#8B1E3F]">
                    6-Digit Authenticator Code
                  </label>
                  <span className="text-[10px] font-mono text-[#8B1E3F] font-bold bg-[#D4AF37]/20 px-2 py-0.5 rounded-full border border-[#D4AF37]/50">
                    ⏱ Refreshes in {secondsLeft}s
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-[#F8F4E8] border border-[#D4AF37] rounded-xl text-center font-mono font-bold text-xl tracking-[0.5em] text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                  <KeyRound className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading || totpCode.length < 6}
                  className="w-full bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold text-xs py-3 rounded-xl shadow border border-amber-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify MFA & Access Admin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleEnrollMfa}
                  className="w-full bg-[#F8F4E8] text-[#4A2C17] font-bold py-2 rounded-xl text-[11px] border border-[#D4AF37]/40 flex items-center justify-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Enroll MFA Authenticator Factor</span>
                </button>
              </div>

              {/* QR Code Setup */}
              {showQrSetup && qrDetails && (
                <div className="p-4 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#8B1E3F] font-bold text-xs">
                    <QrCode className="w-4 h-4 text-[#8B1E3F]" />
                    <span>Scan with Google Authenticator</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <img
                      src={qrDetails.qrCodeUrl}
                      alt="TOTP QR Code"
                      className="w-32 h-32 rounded-xl border border-[#D4AF37]/40 shadow-sm bg-white p-1"  loading="lazy" decoding="async" />
                    <div className="space-y-1.5 flex-1 text-[11px]">
                      <span className="text-[#6E4E37] font-medium block">Manual Key:</span>
                      <div className="p-2 bg-[#FFF8EE] border border-[#D4AF37]/40 font-mono rounded-lg flex items-center justify-between font-bold text-[#8B1E3F]">
                        <span className="truncate">{qrDetails.secret}</span>
                        <button type="button" onClick={copySecretKey} className="ml-1 p-1 text-[#6E4E37] hover:text-[#8B1E3F]">
                          {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    cancelAdminMfa();
                    setStep(1);
                  }}
                  className="text-[11px] text-[#8B1E3F] font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Password Login
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between text-[11px] text-[#6E4E37] font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Fail-Closed Security
            </span>
            <span>AAL2 MFA Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
