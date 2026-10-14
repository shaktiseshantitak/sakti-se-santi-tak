// Simplified Google Sheets backup integration: the original version needed a Google Cloud Console
// project + service account + downloaded JSON private key, which is a lot
// of technical setup for a shop owner doing office backups. This version
// instead posts data to a Google Apps Script "Web App" — a script pasted
// directly INSIDE the Google Sheet itself (Extensions -> Apps Script),
// with one URL to copy after deploying it. No Cloud Console, no service
// account, no private key. See the Apps Script source at the bottom of
// this file — paste that into the Sheet's Apps Script editor once.

import crypto from 'crypto';

interface BackupPayload {
  tabs: { tab: string; rows: (string | number)[][] }[];
}

function objectsToRows(records: Record<string, any>[]): (string | number)[][] {
  if (records.length === 0) return [['(no rows)']];
  const headers = Object.keys(records[0]);
  const rows: (string | number)[][] = [headers];
  // A single cell over Google Sheets' ~50,000 character limit (easy to
  // hit with a long JSON blob in one field) can make the whole Apps
  // Script write loop abort partway — see the updated script at the
  // bottom of this file. Truncating defensively here means a single
  // oversized field can no longer trigger that at all, on top of the
  // Apps Script itself now isolating failures per-tab.
  const MAX_CELL_LENGTH = 45000;
  for (const rec of records) {
    rows.push(headers.map(h => {
      const v = rec[h];
      if (v === null || v === undefined) return '';
      const str = typeof v === 'object' ? JSON.stringify(v) : v;
      if (typeof str === 'string' && str.length > MAX_CELL_LENGTH) {
        return str.slice(0, MAX_CELL_LENGTH) + '...[truncated]';
      }
      return str;
    }));
  }
  return rows;
}

export function getBackupWebhookUrl(): string | null {
  return process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL || null;
}

// FIXED (BUG-031 — FINAL_BUG_SECURITY_AUDIT.md): the Apps Script Web App
// is deployed with "Who has access: Anyone" (required for a server-to-
// server POST with no Google login) and, until now, doPost() accepted
// and wrote ANY payload posted to that URL with zero verification —
// whoever obtained the URL (a leaked env var, a browser history entry on
// a shared machine, etc.) could overwrite the backup sheet with
// arbitrary data. This computes an HMAC-SHA256 signature over the tabs
// payload using a shared secret only the server and the pasted Apps
// Script know, and the updated Apps Script (bottom of this file) rejects
// any request whose signature doesn't match — turning "anyone with the
// URL" into "anyone with the URL AND the secret".
function signPayload(tabsJson: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(tabsJson).digest('hex');
}

// FIXED (BUG-030 — FINAL_BUG_SECURITY_AUDIT.md): every table query used a
// flat `.limit(5000)` — any table that ever grows past 5,000 rows (orders
// and order_items are the most likely candidates as the shop grows) would
// be silently, permanently missing everything past row 5000 from every
// future backup, with no error or warning of any kind. This pages through
// with `.range()` in batches until a page comes back with fewer rows than
// requested, so the export is complete regardless of table size.
async function fetchAllRows(supabaseServer: any, table: string): Promise<any[] | null> {
  const PAGE_SIZE = 1000;
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseServer.from(table).select('*').range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error(`[Daily Backup] Failed reading ${table} at offset ${from}:`, error.message);
      return null;
    }
    all.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function runDailyBackup(supabaseServer: any): Promise<{ tab: string; rows: number }[]> {
  const webhookUrl = getBackupWebhookUrl();
  if (!webhookUrl) {
    throw new Error(
      'Google Sheets backup not configured. Set GOOGLE_APPS_SCRIPT_WEBHOOK_URL ' +
      '(see the deployment guide\'s Google Sheets Backup section for the one-time setup steps).'
    );
  }
  const sharedSecret = process.env.GOOGLE_APPS_SCRIPT_SHARED_SECRET;
  if (!sharedSecret) {
    throw new Error(
      'Google Sheets backup is missing GOOGLE_APPS_SCRIPT_SHARED_SECRET. Set this to any long random ' +
      'string in Netlify env vars, and paste the SAME value into the Apps Script SHARED_SECRET constant ' +
      '(see the script at the bottom of this file) — this authenticates backup requests so only your ' +
      'server can write to the sheet, even though the Apps Script URL itself has to allow "Anyone".'
    );
  }

  // FIXED (BUG-029 — FINAL_BUG_SECURITY_AUDIT.md): only 7 tables were ever
  // exported (orders, order_items, books, coupons, contact_messages,
  // affiliate ledger, affiliate withdrawals) — everything else (customer
  // profiles, categories, authors, reviews, site settings/configuration,
  // audit logs, blogs, gallery, FAQs, testimonials, videos, events,
  // order status history, inventory movements, affiliate accounts/clicks,
  // manual customer contacts, admin roles, wishlists) was NOT recoverable
  // from this backup at all. This is now every real business/content/audit
  // table in the schema. Deliberately excluded: `api_rate_limits` (pure
  // ephemeral rate-limit counters, not business data — backing it up would
  // just add noise) and `book_variants` if unused in this deployment.
  const tables: { table: string; tab: string }[] = [
    { table: 'orders', tab: 'Orders' },
    { table: 'order_items', tab: 'Order Items' },
    { table: 'order_status_history', tab: 'Order Status History' },
    { table: 'payments', tab: 'Payments' },
    { table: 'payment_events', tab: 'Payment Events' },
    { table: 'books', tab: 'Books' },
    { table: 'book_variants', tab: 'Book Variants' },
    { table: 'categories', tab: 'Categories' },
    { table: 'authors', tab: 'Authors' },
    { table: 'coupons', tab: 'Coupons' },
    { table: 'reviews', tab: 'Reviews' },
    { table: 'blogs', tab: 'Blogs' },
    { table: 'gallery', tab: 'Gallery' },
    { table: 'faqs', tab: 'FAQs' },
    { table: 'testimonials', tab: 'Testimonials' },
    { table: 'videos', tab: 'Videos' },
    { table: 'events', tab: 'Events' },
    { table: 'inventory_movements', tab: 'Inventory Movements' },
    { table: 'contact_messages', tab: 'Contact Messages' },
    { table: 'manual_customer_contacts', tab: 'Manual Customer Contacts' },
    { table: 'profiles', tab: 'Profiles' },
    { table: 'user_roles', tab: 'User Roles' },
    { table: 'wishlists', tab: 'Wishlists' },
    { table: 'site_settings', tab: 'Site Settings' },
    { table: 'audit_logs', tab: 'Audit Logs' },
    { table: 'affiliate_accounts', tab: 'Affiliate Accounts' },
    { table: 'affiliate_clicks', tab: 'Affiliate Clicks' },
    { table: 'affiliate_wallet_ledger', tab: 'Affiliate Ledger' },
    { table: 'affiliate_withdrawals', tab: 'Affiliate Withdrawals' },
  ];

  const payload: BackupPayload = { tabs: [] };
  const results: { tab: string; rows: number }[] = [];
  const readFailures: string[] = [];

  for (const t of tables) {
    const data = await fetchAllRows(supabaseServer, t.table);
    if (data === null) {
      // FIXED (BUG-032 partial coverage): a table that fails to even READ
      // from Supabase used to just `continue` silently — the backup would
      // "succeed" while quietly missing that table's data entirely, with
      // nothing in the result telling anyone it happened.
      readFailures.push(t.tab);
      continue;
    }
    payload.tabs.push({ tab: t.tab, rows: objectsToRows(data) });
    results.push({ tab: t.tab, rows: data.length });
  }

  payload.tabs.push({
    tab: 'Backup Log',
    rows: [
      ['Tab', 'Row Count', 'Last Backup (IST)'],
      ...results.map(r => [r.tab, r.rows, new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]),
      ...readFailures.map(tab => [tab, 'READ FAILED', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]),
    ],
  });

  const tabsJson = JSON.stringify(payload.tabs);
  const signature = signPayload(tabsJson, sharedSecret);

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabs: payload.tabs, signature }),
    redirect: 'follow',
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Apps Script webhook returned an error: ${text}`);
  }

  // FIXED: previously this only checked resp.ok (the HTTP request itself
  // succeeding) and reported "success" regardless of whether every tab
  // actually got written on the Google Sheets side — which is exactly how
  // "7 file backup ho gaya" could show even when only 3 sheets existed.
  // The Apps Script above now reports which specific tabs failed; surface
  // that here instead of hiding it.
  let sheetsFailed: string[] = [];
  try {
    const parsed = JSON.parse(text);
    if (parsed.status === 'rejected') {
      throw new Error(`Backup rejected by Apps Script: ${parsed.reason || 'signature mismatch'}. Check that GOOGLE_APPS_SCRIPT_SHARED_SECRET matches the SHARED_SECRET pasted into the Apps Script.`);
    }
    if (Array.isArray(parsed.failed)) sheetsFailed = parsed.failed;
  } catch (parseErr: any) {
    if (parseErr.message?.startsWith('Backup rejected')) throw parseErr;
    // Response wasn't JSON — an older, not-yet-updated Apps Script deployment.
    // Not fatal, just can't confirm per-tab success; caller still sees the
    // row counts that were actually SENT (not necessarily saved).
  }

  // FIXED (BUG-032 — FINAL_BUG_SECURITY_AUDIT.md): a table that failed to
  // even be READ (readFailures, above) or failed to be WRITTEN into the
  // sheet (sheetsFailed, from the Apps Script) both used to leave the
  // overall call reporting success. Any failure at either stage now
  // throws, so the admin sees an explicit incomplete-backup error instead
  // of a green checkmark over a partial backup.
  if (readFailures.length > 0 || sheetsFailed.length > 0) {
    const parts = [
      ...readFailures.map(t => `${t} (could not read from database)`),
      ...sheetsFailed.map(t => `${t} (could not write to sheet)`),
    ];
    throw new Error(`Backup partially failed — these tabs did not save: ${parts.join('; ')}`);
  }

  return results;
}

/*
=====================================================================
ONE-TIME SETUP (no Google Cloud Console needed — do this once):

1. Open your Google Sheet (create a new blank one if you don't have it yet).
2. Extensions -> Apps Script.
3. Delete anything in the editor and paste this:

// Replace this with a long random string of your choosing (letters +
// numbers, 32+ characters is plenty) — then set the EXACT SAME string as
// GOOGLE_APPS_SCRIPT_SHARED_SECRET in Netlify's environment variables.
// This is what stops anyone who finds your Web App URL from being able
// to overwrite your backup sheet with their own data (BUG-031 fix).
var SHARED_SECRET = 'REPLACE_WITH_YOUR_OWN_LONG_RANDOM_SECRET';

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var tabsJson = JSON.stringify(body.tabs);
  var expectedSig = computeHmacSha256Hex(tabsJson, SHARED_SECRET);
  if (body.signature !== expectedSig) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'rejected', reason: 'bad signature' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var failed = [];
  body.tabs.forEach(function (t) {
    try {
      var sheet = ss.getSheetByName(t.tab) || ss.insertSheet(t.tab);
      sheet.clearContents();
      if (t.rows && t.rows.length > 0) {
        sheet.getRange(1, 1, t.rows.length, t.rows[0].length).setValues(t.rows);
      }
    } catch (err) {
      failed.push(t.tab + ': ' + err.message);
    }
  });
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', failed: failed }))
    .setMimeType(ContentService.MimeType.JSON);
}

function computeHmacSha256Hex(message, secret) {
  var rawHmac = Utilities.computeHmacSha256Signature(message, secret);
  return rawHmac.map(function (byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

4. Click Deploy -> New deployment -> gear icon -> "Web app".
5. "Execute as": Me. "Who has access": Anyone.
6. Click Deploy, authorize it (it's your own script on your own Sheet),
   then copy the Web App URL it gives you.
7. In Netlify: Site Settings -> Environment Variables -> add
   GOOGLE_APPS_SCRIPT_WEBHOOK_URL = (the URL from step 6), AND
   GOOGLE_APPS_SCRIPT_SHARED_SECRET = (the exact same string you put in
   SHARED_SECRET above).

That's it — no Cloud Console project, no service account, no key file.

---------------------------------------------------------------------
If you deployed an OLDER version of this script (from before the
signature check / per-tab error handling existed), REPLACE it entirely
with the version above — it both authenticates the request (BUG-031)
and isolates each tab's write so one bad tab can't take down the rest
(the original partial-backup issue this file already fixed once).
---------------------------------------------------------------------
=====================================================================
*/

