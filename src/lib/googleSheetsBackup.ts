// FIXED (2026-08-28 update — "Google Cloud Console mein service use nahi
// karna, koi aur"): the original version needed a Google Cloud Console
// project + service account + downloaded JSON private key, which is a lot
// of technical setup for a shop owner doing office backups. This version
// instead posts data to a Google Apps Script "Web App" — a script pasted
// directly INSIDE the Google Sheet itself (Extensions -> Apps Script),
// with one URL to copy after deploying it. No Cloud Console, no service
// account, no private key. See the Apps Script source at the bottom of
// this file — paste that into the Sheet's Apps Script editor once.

interface BackupPayload {
  tabs: { tab: string; rows: (string | number)[][] }[];
}

function objectsToRows(records: Record<string, any>[]): (string | number)[][] {
  if (records.length === 0) return [['(no rows)']];
  const headers = Object.keys(records[0]);
  const rows: (string | number)[][] = [headers];
  // FIXED (2026-08-31 — "7 file backup hui bolta hai, par sirf 3 sheet ban
  // rahi hai"): a single cell over Google Sheets' ~50,000 character limit
  // (easy to hit with a long JSON blob in one field) made the whole
  // Apps Script write loop abort partway — see the updated script at the
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

export async function runDailyBackup(supabaseServer: any): Promise<{ tab: string; rows: number }[]> {
  const webhookUrl = getBackupWebhookUrl();
  if (!webhookUrl) {
    throw new Error(
      'Google Sheets backup not configured. Set GOOGLE_APPS_SCRIPT_WEBHOOK_URL ' +
      '(see the deployment guide\'s Google Sheets Backup section for the one-time setup steps).'
    );
  }

  // One tab per table — "tab-wise" backup as requested.
  const tables: { table: string; tab: string }[] = [
    { table: 'orders', tab: 'Orders' },
    { table: 'order_items', tab: 'Order Items' },
    { table: 'books', tab: 'Books' },
    { table: 'coupons', tab: 'Coupons' },
    { table: 'contact_messages', tab: 'Contact Messages' },
    { table: 'affiliate_wallet_ledger', tab: 'Affiliate Ledger' },
    { table: 'affiliate_withdrawals', tab: 'Affiliate Withdrawals' },
  ];

  const payload: BackupPayload = { tabs: [] };
  const results: { tab: string; rows: number }[] = [];

  for (const t of tables) {
    const { data, error } = await supabaseServer.from(t.table).select('*').limit(5000);
    if (error) {
      console.error(`[Daily Backup] Failed reading ${t.table}:`, error.message);
      continue;
    }
    payload.tabs.push({ tab: t.tab, rows: objectsToRows(data || []) });
    results.push({ tab: t.tab, rows: (data || []).length });
  }

  payload.tabs.push({
    tab: 'Backup Log',
    rows: [
      ['Tab', 'Row Count', 'Last Backup (IST)'],
      ...results.map(r => [r.tab, r.rows, new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]),
    ],
  });

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.failed) && parsed.failed.length > 0) {
      throw new Error(`Backup partially failed — these tabs did not save: ${parsed.failed.join('; ')}`);
    }
  } catch (parseErr: any) {
    if (parseErr.message?.startsWith('Backup partially failed')) throw parseErr;
    // Response wasn't JSON — an older, not-yet-updated Apps Script deployment.
    // Not fatal, just can't confirm per-tab success; caller still sees the
    // row counts that were actually SENT (not necessarily saved).
  }

  return results;
}

/*
=====================================================================
ONE-TIME SETUP (no Google Cloud Console needed — do this once):

1. Open your Google Sheet (create a new blank one if you don't have it yet).
2. Extensions -> Apps Script.
3. Delete anything in the editor and paste this:

function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  payload.tabs.forEach(function (t) {
    var sheet = ss.getSheetByName(t.tab) || ss.insertSheet(t.tab);
    sheet.clearContents();
    if (t.rows && t.rows.length > 0) {
      sheet.getRange(1, 1, t.rows.length, t.rows[0].length).setValues(t.rows);
    }
  });
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

4. Click Deploy -> New deployment -> gear icon -> "Web app".
5. "Execute as": Me. "Who has access": Anyone.
6. Click Deploy, authorize it (it's your own script on your own Sheet),
   then copy the Web App URL it gives you.
7. In Netlify: Site Settings -> Environment Variables -> add
   GOOGLE_APPS_SCRIPT_WEBHOOK_URL = (the URL from step 6).

That's it — no Cloud Console project, no service account, no key file.

---------------------------------------------------------------------
FIXED (2026-08-31 — "7 file backup ho gaya bolta hai, par sheet mein
sirf 3 sheet ban rahi hai"): the script above wrote every tab inside one
plain forEach loop with no error handling. If EVEN ONE tab's data hit a
Google Sheets limit (a single cell over ~50,000 characters — easy to
hit if one order's notes/address JSON is unusually long) and threw,
the forEach stopped immediately, silently skipping every tab that came
after the failing one in the list — while the server still correctly
reported "backup succeeded" because it only checks that the request
itself was delivered, not that every tab inside it finished writing.
That's exactly why only the first few tabs (in list order: Orders,
Order Items, Books, ...) ever showed up.

If you already deployed the script above, REPLACE it with this fixed
version — each tab now writes independently, so one bad tab can no
longer take down the rest:

function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var failed = [];
  payload.tabs.forEach(function (t) {
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
---------------------------------------------------------------------
=====================================================================
*/
