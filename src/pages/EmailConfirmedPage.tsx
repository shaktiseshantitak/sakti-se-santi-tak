import React, { useState, useEffect } from 'react';
import { MailCheck, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface EmailConfirmedPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// Where Supabase's email-confirmation link lands (emailRedirectTo, set in
// AuthContext.register()). Supabase's client automatically detects the
// confirmation token in the URL and establishes a real logged-in session —
// this page just needs to show the user that it worked and get them moving.
export const EmailConfirmedPage: React.FC<EmailConfirmedPageProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<'checking' | 'confirmed' | 'failed'>('checking');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('failed');
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'confirmed' : 'failed');
    });
  }, []);

  return (
    <div className="py-16 bg-[#F8F4E8] text-[#4A2C17] min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-3xl p-8 shadow-sm text-center space-y-4">
        {status === 'checking' && (
          <p className="text-sm text-[#6E4E37]">कृपया प्रतीक्षा करें... / Please wait...</p>
        )}

        {status === 'confirmed' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
              <MailCheck className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#8B1E3F]">
              ईमेल की पुष्टि हो गई! ✓
            </h1>
            <p className="text-sm text-[#6E4E37]">
              आपका खाता सफलतापूर्वक सक्रिय हो गया है। अब आप खरीदारी शुरू कर सकते हैं।
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              मेरा खाता खोलें
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
            <h1 className="font-serif text-xl font-bold text-[#8B1E3F]">
              यह लिंक अमान्य या समय-सीमा समाप्त हो चुका है
            </h1>
            <p className="text-sm text-[#6E4E37]">
              कृपया दोबारा साइन अप करें, या लॉगिन करने की कोशिश करें।
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="text-[#8B1E3F] font-bold underline"
            >
              लॉगिन पेज पर जाएँ
            </button>
          </>
        )}
      </div>
    </div>
  );
};
