import React, { useState } from 'react';
import {
  Users, Wallet, Settings, ShieldAlert, Download, CheckCircle2, XCircle,
  PlusCircle, RefreshCw, DollarSign, Search, Sliders, AlertTriangle, Layers, Filter
} from 'lucide-react';
import { useAffiliate } from '../../context/AffiliateContext';
import { CommissionSettings } from '../../types/affiliate';

export const AdminAffiliateManagement: React.FC = () => {
  const {
    wallet,
    stats,
    team,
    commissions,
    withdrawals,
    fraudLogs,
    settings,
    updateSettings,
    approveWithdrawal,
    rejectWithdrawal,
    manualWalletAdjustment,
    exportCSV,
  } = useAffiliate();

  // Settings form state
  const [l1, setL1] = useState<number>(settings.level1Percent);
  const [l2, setL2] = useState<number>(settings.level2Percent);
  const [l3, setL3] = useState<number>(settings.level3Percent);
  const [minW, setMinW] = useState<number>(settings.minWithdrawalAmount);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Manual Credit/Debit Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualAmount, setManualAmount] = useState('500');
  const [manualType, setManualType] = useState<'credit' | 'debit'>('credit');
  const [manualReason, setManualReason] = useState('Performance bonus credit');

  // Approval Modal State
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null);
  const [txnIdInput, setTxnIdInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: CommissionSettings = {
      ...settings,
      level1Percent: l1,
      level2Percent: l2,
      level3Percent: l3,
      minWithdrawalAmount: minW,
    };
    updateSettings(newConfig);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualAmount);
    if (!isNaN(amt) && amt > 0) {
      manualWalletAdjustment(amt, manualType, manualReason);
      setShowManualModal(false);
    }
  };

  const handleConfirmApprove = () => {
    if (selectedWithdrawalId) {
      approveWithdrawal(selectedWithdrawalId, txnIdInput, adminNoteInput);
      setSelectedWithdrawalId(null);
      setTxnIdInput('');
      setAdminNoteInput('');
    }
  };

  const handleConfirmReject = (id: string) => {
    rejectWithdrawal(id, 'Rejected by admin verification.');
  };

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;

  return (
    <div className="space-y-6 text-[#4A2C17]">
      {/* Admin Top Header & Actions Bar */}
      <div className="bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F] text-xs font-extrabold border border-[#8B1E3F]/20 mb-2">
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Master Enterprise Control</span>
          </div>
          <h2 className="font-serif text-2xl font-extrabold text-[#8B1E3F]">
            Enterprise Affiliate & Referral Management
          </h2>
          <p className="text-xs text-[#6E4E37]">
            Manage 3-tier commission rules, review pending withdrawals, monitor fraud detection logs, and export reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-amber-400/40 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>Manual Credit / Debit</span>
          </button>

          <button
            onClick={exportCSV}
            className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all border border-amber-200"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFF8EE] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#6E4E37] uppercase tracking-wider block">Network Affiliates</span>
          <p className="font-serif text-2xl font-extrabold text-[#8B1E3F]">{team.length + 15}</p>
          <span className="text-[10px] text-emerald-800 font-bold">Active Direct: {team.length}</span>
        </div>

        <div className="bg-[#FFF8EE] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#6E4E37] uppercase tracking-wider block">Pending Payouts</span>
          <p className="font-serif text-2xl font-extrabold text-amber-800">{pendingWithdrawalsCount}</p>
          <span className="text-[10px] text-[#8B1E3F] font-bold">Action Required</span>
        </div>

        <div className="bg-[#FFF8EE] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#6E4E37] uppercase tracking-wider block">Total Commissions</span>
          <p className="font-serif text-2xl font-extrabold text-[#8B1E3F]">₹{wallet.totalEarnings.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-800 font-bold">Verified Sales</span>
        </div>

        <div className="bg-[#FFF8EE] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#6E4E37] uppercase tracking-wider block">Fraud Security Log</span>
          <p className="font-serif text-2xl font-extrabold text-rose-800">{fraudLogs.length}</p>
          <span className="text-[10px] text-rose-800 font-bold">Self-Referrals Blocked</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Commission Settings Configuration Left */}
        <div className="lg:col-span-5 bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D4AF37]" />
            <span>3-Tier Commission & Payout Rules</span>
          </h3>

          {settingsSaved && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              <span>Affiliate settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#6E4E37] block mb-1">Level 1 Direct Commission (%)</label>
              <input
                type="number"
                value={l1}
                onChange={(e) => setL1(parseFloat(e.target.value))}
                min={0}
                max={50}
                className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#6E4E37] block mb-1">Level 2 Sub-Tier Commission (%)</label>
              <input
                type="number"
                value={l2}
                onChange={(e) => setL2(parseFloat(e.target.value))}
                min={0}
                max={30}
                className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#6E4E37] block mb-1">Level 3 Extended Commission (%)</label>
              <input
                type="number"
                value={l3}
                onChange={(e) => setL3(parseFloat(e.target.value))}
                min={0}
                max={20}
                className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#6E4E37] block mb-1">Minimum Payout Threshold (₹)</label>
              <input
                type="number"
                value={minW}
                onChange={(e) => setMinW(parseFloat(e.target.value))}
                min={100}
                step={100}
                className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold text-xs py-3 rounded-xl shadow-xs transition-all border border-amber-200"
            >
              Save System Commission Rules
            </button>
          </form>
        </div>

        {/* Withdrawal Approvals Queue Right */}
        <div className="lg:col-span-7 bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center justify-between">
            <span>Pending Withdrawal Payout Requests</span>
            <span className="bg-amber-100 text-[#8B1E3F] px-2.5 py-0.5 rounded-full text-xs font-bold">
              {pendingWithdrawalsCount} Pending
            </span>
          </h3>

          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-4 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#8B1E3F]">{w.id}</span>
                    <span className="font-bold text-[#4A2C17]">{w.userName}</span>
                  </div>
                  <p className="text-[11px] text-[#6E4E37] mt-0.5">
                    Method: <strong>{w.method.toUpperCase()}</strong> • Amount: <strong>₹{w.amount}</strong>
                  </p>
                  {w.method === 'upi' ? (
                    <p className="text-[10px] text-emerald-800 font-mono">UPI ID: {w.details.upiId}</p>
                  ) : (
                    <p className="text-[10px] text-emerald-800 font-mono">
                      Acc: {w.details.accountNumber} • IFSC: {w.details.ifscCode}
                    </p>
                  )}
                  <span className="text-[10px] text-[#6E4E37] block">{w.requestedAt}</span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {w.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => setSelectedWithdrawalId(w.id)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>

                      <button
                        onClick={() => handleConfirmReject(w.id)}
                        className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        w.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {w.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fraud Security Audit Log */}
      <div className="bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-4">
        <h3 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-700" />
          <span>Anti-Fraud & Abuse Prevention Logs</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F4E8] border-b border-[#D4AF37]/30 text-[#6E4E37] font-bold">
                <th className="p-3">Log ID</th>
                <th className="p-3">User / Visitor</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Details</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/20">
              {fraudLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8F4E8]/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-rose-800">{log.id}</td>
                  <td className="p-3 font-bold">{log.userName}</td>
                  <td className="p-3 font-mono text-[11px] text-[#8B1E3F]">{log.eventType}</td>
                  <td className="p-3">
                    <span className="bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full text-[10px] uppercase">
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-3 text-[11px]">{log.details}</td>
                  <td className="p-3 text-[11px] text-[#6E4E37]">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {selectedWithdrawalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFF8EE] border border-[#D4AF37]/50 w-full max-w-md rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">
              Confirm Payout Approval
            </h3>
            <p className="text-xs text-[#6E4E37]">
              Provide transaction reference ID for record keeping.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#6E4E37] block mb-1">Bank / UPI Txn ID</label>
                <input
                  type="text"
                  value={txnIdInput}
                  onChange={(e) => setTxnIdInput(e.target.value)}
                  placeholder="e.g. UPI-TXN-88771122"
                  className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                />
              </div>

              <div>
                <label className="font-bold text-[#6E4E37] block mb-1">Admin Note (Optional)</label>
                <input
                  type="text"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="e.g. Payout processed successfully"
                  className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmApprove}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Confirm Payout
              </button>
              <button
                onClick={() => setSelectedWithdrawalId(null)}
                className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFF8EE] border border-[#D4AF37]/50 w-full max-w-md rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">
              Manual Wallet Adjustment
            </h3>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#6E4E37] block mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualType('credit')}
                    className={`p-2.5 rounded-xl font-bold border ${
                      manualType === 'credit'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-[#F8F4E8] border-[#D4AF37]/40'
                    }`}
                  >
                    Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('debit')}
                    className={`p-2.5 rounded-xl font-bold border ${
                      manualType === 'debit'
                        ? 'bg-rose-800 text-white border-rose-800'
                        : 'bg-[#F8F4E8] border-[#D4AF37]/40'
                    }`}
                  >
                    Debit (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#6E4E37] block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#6E4E37] block mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-bold py-2.5 rounded-xl text-xs"
                >
                  Apply Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
