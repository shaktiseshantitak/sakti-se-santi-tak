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
  for (const rec of records) {
    rows.push(headers.map(h => {
      const v = rec[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
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
=====================================================================
*/
