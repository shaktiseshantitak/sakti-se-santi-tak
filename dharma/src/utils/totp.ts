import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Standard Supabase Multi-Factor Authentication (MFA) Helper
 */

export interface TotpSetupDetails {
  secret: string;
  qrCodeUrl: string;
  factorId: string;
}

/**
 * Returns seconds remaining in the current 30-second TOTP window.
 */
export function getTotpSecondsRemaining(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

/**
 * Initiates standard Supabase MFA TOTP enrollment for an admin account.
 */
export async function setupAdminTotpMfa(): Promise<{ success: boolean; details?: TotpSetupDetails; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Authentication service is not configured.' };
  }

  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to enroll MFA factor.' };
    }

    return {
      success: true,
      details: {
        secret: data.totp.secret,
        qrCodeUrl: data.totp.qr_code,
        factorId: data.id,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'MFA Enrollment error.' };
  }
}
