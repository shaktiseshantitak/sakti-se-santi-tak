import crypto from 'crypto';

// Lightweight, dependency-free Google Sheets writer for a service account.
// Avoids pulling in the full `googleapis` package (large, mostly unused
// here) — this only needs two REST calls: get an OAuth2 access token via a
// signed JWT assertion, then write values to a sheet tab.

interface BackupCredentials {
  clientEmail: string;
  privateKey: string;
  spreadsheetId: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey.replace(/\\n/g, '\n'));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.access_token) {
    throw new Error(`Google OAuth token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// Writes a 2D array of values (first row = headers) into one tab, replacing
// its previous contents. Creates the tab if it doesn't exist yet.
async function writeSheetTab(
  accessToken: string, spreadsheetId: string, tabName: string, rows: (string | number)[][]
): Promise<void> {
  // Ensure the tab exists (ignore "already exists" errors).
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tabName } } }] }),
  }).catch(() => {});

  // Clear old contents, then write fresh rows — keeps yesterday's rows from
  // lingering underneath a shorter export.
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}:clear`,
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed writing tab "${tabName}": ${err}`);
  }
}

export function getBackupCredentialsFromEnv(): BackupCredentials | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!clientEmail || !privateKey || !spreadsheetId) return null;
  return { clientEmail, privateKey, spreadsheetId };
}

// Converts an array of plain objects into a header row + value rows, so any
// table's rows can be dropped straight into a sheet tab without per-table
// column-mapping code.
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

export async function runDailyBackup(supabaseServer: any): Promise<{ tab: string; rows: number }[]> {
  const creds = getBackupCredentialsFromEnv();
  if (!creds) {
    throw new Error(
      'Google Sheets backup not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, ' +
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and GOOGLE_SHEETS_SPREADSHEET_ID.'
    );
  }
  const accessToken = await getAccessToken(creds.clientEmail, creds.privateKey);

  // One tab per table — "tab-wise" backup as requested.
  const tables: { table: string; tab: string; select: string }[] = [
    { table: 'orders', tab: 'Orders', select: '*' },
    { table: 'order_items', tab: 'Order Items', select: '*' },
    { table: 'books', tab: 'Books', select: '*' },
    { table: 'coupons', tab: 'Coupons', select: '*' },
    { table: 'contact_messages', tab: 'Contact Messages', select: '*' },
    { table: 'affiliate_wallet_ledger', tab: 'Affiliate Ledger', select: '*' },
    { table: 'affiliate_withdrawals', tab: 'Affiliate Withdrawals', select: '*' },
  ];

  const results: { tab: string; rows: number }[] = [];
  for (const t of tables) {
    const { data, error } = await supabaseServer.from(t.table).select(t.select).limit(5000);
    if (error) {
      console.error(`[Daily Backup] Failed reading ${t.table}:`, error.message);
      continue;
    }
    const rows = objectsToRows(data || []);
    await writeSheetTab(accessToken, creds.spreadsheetId, t.tab, rows);
    results.push({ tab: t.tab, rows: (data || []).length });
  }

  // A small "Backup Log" tab so office staff can see when the last run
  // happened and how many rows each tab got, without opening every tab.
  await writeSheetTab(accessToken, creds.spreadsheetId, 'Backup Log', [
    ['Tab', 'Row Count', 'Last Backup (IST)'],
    ...results.map(r => [r.tab, r.rows, new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]),
  ]);

  return results;
}
