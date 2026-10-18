import { supabase, isSupabaseConfigured } from './supabase';
import { validateEmail } from '../utils/security';

export type SubscribeResult = 'ok' | 'invalid' | 'busy' | 'unavailable';

/**
 * Stores a newsletter email through the database function
 * subscribe_newsletter() (migration 028). Visitors have no direct table
 * access. A duplicate email returns 'ok' on purpose so the form can never be
 * used to find out who is already subscribed.
 */
export async function subscribeNewsletterApi(rawEmail: string): Promise<SubscribeResult> {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!validateEmail(email)) return 'invalid';
  if (!isSupabaseConfigured || !supabase) return 'unavailable';
  try {
    const { error } = await supabase.rpc('subscribe_newsletter', { p_email: email, p_source: 'footer' });
    if (!error) return 'ok';
    if (error.code === '54000') return 'busy';
    if (error.code === '22023') return 'invalid';
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export interface NewsletterSubscriber { id: string; email: string; source: string; created_at: string; }

/** Admin only — the database refuses everyone else. */
export async function adminListSubscribersApi(): Promise<NewsletterSubscriber[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id,email,source,created_at')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data || []) as NewsletterSubscriber[];
}

export async function adminDeleteSubscriberApi(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Spreadsheet-safe CSV: values starting with = + - @ are neutralised (CSV/formula injection). */
export function subscribersToCsv(rows: NewsletterSubscriber[]): string {
  const safe = (v: string) => {
    const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return ['email,source,subscribed_at', ...rows.map(r => [safe(r.email), safe(r.source), safe(r.created_at)].join(','))].join('\n');
}
