import { createClient } from '@supabase/supabase-js';
import { runDailyBackup } from '../../src/lib/googleSheetsBackup';

// Scheduled via netlify.toml's [functions."daily-backup"] schedule — Netlify
// invokes this on its own; nothing else needs to call it. Uses the same
// service-role Supabase client pattern as server.ts (never the anon key —
// this needs to read every table across the whole store, not just what a
// public client is allowed to see).
export const handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Daily Backup] Supabase not configured — skipping.');
    return { statusCode: 500, body: 'Supabase not configured.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseKey);

  try {
    const results = await runDailyBackup(supabaseServer);
    console.log('[Daily Backup] Completed:', results);
    return { statusCode: 200, body: JSON.stringify({ success: true, results }) };
  } catch (err: any) {
    console.error('[Daily Backup] Failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
