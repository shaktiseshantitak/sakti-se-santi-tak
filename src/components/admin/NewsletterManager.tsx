import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Download, Trash2, RefreshCw } from 'lucide-react';
import {
  adminListSubscribersApi, adminDeleteSubscriberApi, subscribersToCsv, NewsletterSubscriber,
} from '../../lib/newsletterApi';

export const NewsletterManager: React.FC = () => {
  const [rows, setRows] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRows(await adminListSubscribersApi()); }
    catch (e: any) { setError(e?.message || 'लोड नहीं हो सका (migration 028 चलाई है?)'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (r: NewsletterSubscriber) => {
    if (!window.confirm(`${r.email} को सूची से हटाएँ?`)) return;
    try { await adminDeleteSubscriberApi(r.id); setRows(prev => prev.filter(x => x.id !== r.id)); }
    catch (e: any) { setError(e?.message || 'हट नहीं सका'); }
  };

  const exportCsv = () => {
    const blob = new Blob([subscribersToCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'newsletter-subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-amber-600" /> Newsletter Subscribers
          <span className="text-[11px] font-bold text-zinc-500">({rows.length})</span>
        </h3>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={exportCsv} disabled={rows.length === 0} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white disabled:opacity-40 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-rose-700">{error}</p>}
      {loading ? (
        <p className="text-xs text-zinc-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-zinc-500">अभी कोई subscriber नहीं।</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto text-xs">
          {rows.map(r => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0 truncate font-medium">{r.email}</span>
              <span className="shrink-0 text-zinc-500">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
              <button onClick={() => remove(r)} aria-label={`Remove ${r.email}`} className="shrink-0 text-rose-700 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
