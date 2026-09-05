import React, { useState } from 'react';
import {
  Share2, Copy, Check, QrCode, Wallet, TrendingUp, Users, Award,
  ArrowUpRight, DollarSign, Clock, ShieldCheck, ChevronRight, AlertCircle,
  Building2, Smartphone, Send, Trophy, Percent, HelpCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAffiliate } from '../../context/AffiliateContext';
import { QrShareModal } from './QrShareModal';

export const AffiliatePortal: React.FC = () => {
  const {
    referralCode,
    referralUrl,
    wallet,
    stats,
    team,
    commissions,
    withdrawals,
    leaderboard,
    settings,
    currentRank,
    nextRank,
    createWithdrawal,
  } = useAffiliate();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet' | 'team' | 'rank' | 'leaderboard'>('dashboard');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Withdrawal form state
  const [withdrawalMethod, setWithdrawalMethod] = useState<'upi' | 'bank'>('upi');
  const [amountInput, setAmountInput] = useState<string>('1000');
  const [upiIdInput, setUpiIdInput] = useState<string>('rahulsharma@okaxis');
  const [accNumInput, setAccNumInput] = useState<string>('987654321011');
  const [ifscInput, setIfscInput] = useState<string>('SBIN0001234');
  const [holderInput, setHolderInput] = useState<string>('Acharya Rahul Sharma');
  const [withdrawFeedback, setWithdrawFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'telegram' | 'x') => {
    const text = encodeURIComponent(
      `नमस्ते! परम पावन धार्मिक ग्रंथों एवं मंत्र शक्ति की प्रामाणिक पुस्तकों के लिए इस विशेष रेफ़रल लिंक से जुड़ें और विशेष छूट पाएं: ${referralUrl}`
    );
    let shareUrl = '';
    if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${text}`;
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`;
    if (platform === 'x') shareUrl = `https://twitter.com/intent/tweet?text=${text}`;

    window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawFeedback({ type: 'error', text: 'Please enter a valid withdrawal amount.' });
      return;
    }

    const details =
      withdrawalMethod === 'upi'
        ? { upiId: upiIdInput }
        : {
            accountNumber: accNumInput,
            ifscCode: ifscInput,
            bankName: 'Verified Bank',
            holderName: holderInput,
          };

    const res = await createWithdrawal(amt, withdrawalMethod, details);
    if (res.success) {
      setWithdrawFeedback({ type: 'success', text: res.message });
      setAmountInput('1000');
    } else {
      setWithdrawFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6 text-[#4A2C17]">
      {/* Top Banner: Referral Code & Link Box */}
      <div className="bg-[#FFF8EE] border border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#D4AF37]/30 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F] text-xs font-extrabold border border-[#8B1E3F]/20">
              <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Partner Rank: {currentRank.rank}</span>
            </div>
            <h2 className="font-serif text-2xl font-extrabold text-[#8B1E3F]">
              Enterprise Affiliate & Referral Portal
            </h2>
            <p className="text-xs text-[#6E4E37] font-medium">
              Share scriptures, build your 3-level team, and earn auto-calculated payouts on verified sales.
            </p>
          </div>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-bold text-xs px-4 py-2.5 rounded-xl border border-amber-400/40 shadow-xs flex items-center gap-2 transition-all shrink-0"
          >
            <QrCode className="w-4 h-4 text-[#D4AF37]" />
            <span>Generate Referral QR Code</span>
          </button>
        </div>

        {/* Unique Link & Code Copy Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-[#F8F4E8] p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2">
            <label className="text-[11px] font-extrabold uppercase text-[#6E4E37] tracking-wider block">
              Unique Referral Link
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-[#8B1E3F] font-bold truncate">
                {referralUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#F8F4E8] p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2">
            <label className="text-[11px] font-extrabold uppercase text-[#6E4E37] tracking-wider block">
              Referral Code / Coupon
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-extrabold text-[#8B1E3F]">
                {referralCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="bg-[#3A1F0D] hover:bg-[#251307] text-[#F4E285] font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-all"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Social Share Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs font-bold text-[#6E4E37] flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-[#8B1E3F]" /> Quick Share to Social Networks:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> WhatsApp
            </button>

            <button
              onClick={() => handleSocialShare('telegram')}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Telegram
            </button>

            <button
              onClick={() => handleSocialShare('facebook')}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" /> Facebook
            </button>

            <button
              onClick={() => handleSocialShare('x')}
              className="bg-zinc-900 hover:bg-black text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" /> X (Twitter)
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#D4AF37]/30 overflow-x-auto gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
              : 'border-transparent text-[#6E4E37] hover:text-[#8B1E3F]'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Overview & Performance
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'wallet'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
              : 'border-transparent text-[#6E4E37] hover:text-[#8B1E3F]'
          }`}
        >
          <Wallet className="w-4 h-4" /> Wallet & Withdrawals (₹{wallet.withdrawableBalance})
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'team'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
              : 'border-transparent text-[#6E4E37] hover:text-[#8B1E3F]'
          }`}
        >
          <Users className="w-4 h-4" /> My 3-Level Team ({team.length})
        </button>

        <button
          onClick={() => setActiveTab('rank')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'rank'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
              : 'border-transparent text-[#6E4E37] hover:text-[#8B1E3F]'
          }`}
        >
          <Award className="w-4 h-4" /> Ranks & Rewards ({currentRank.rank})
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
              : 'border-transparent text-[#6E4E37] hover:text-[#8B1E3F]'
          }`}
        >
          <Trophy className="w-4 h-4" /> Leaderboard & Contests
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PERFORMANCE */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#FFF8EE] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#6E4E37] uppercase tracking-wider block">Total Clicks</span>
              <p className="font-serif text-2xl font-extrabold text-[#8B1E3F]">{stats.totalClicks.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-800 font-bold">Unique Visitors: {stats.uniqueVisitors}</span>
            </div>

            <div className="bg-[#FFF8EE] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#6E4E37] uppercase tracking-wider block">Referred Orders</span>
              <p className="font-serif text-2xl font-extrabold text-[#8B1E3F]">{stats.totalOrders}</p>
              <span className="text-[10px] text-emerald-800 font-bold">Conv. Rate: {stats.conversionRate}%</span>
            </div>

            <div className="bg-[#FFF8EE] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#6E4E37] uppercase tracking-wider block">Total Earnings</span>
              <p className="font-serif text-2xl font-extrabold text-[#8B1E3F]">₹{wallet.totalEarnings.toLocaleString()}</p>
              <span className="text-[10px] text-amber-800 font-bold">Pending: ₹{wallet.pendingEarnings}</span>
            </div>

            <div className="bg-[#FFF8EE] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[#6E4E37] uppercase tracking-wider block">Withdrawable</span>
              <p className="font-serif text-2xl font-extrabold text-emerald-800">₹{wallet.withdrawableBalance.toLocaleString()}</p>
              <span className="text-[10px] text-[#8B1E3F] font-bold">Lifetime: ₹{wallet.lifetimeEarnings.toLocaleString()}</span>
            </div>
          </div>

          {/* 3-Level Commission Engine Architecture Overview */}
          <div className="bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#D4AF37]" />
              <span>3-Level Referral Commission Structure</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#F8F4E8] rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#8B1E3F]">Level 1 (Direct)</span>
                  <span className="bg-[#8B1E3F] text-amber-100 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                    {settings.level1Percent}%
                  </span>
                </div>
                <p className="text-[11px] text-[#6E4E37]">
                  Earned when someone registers or buys scriptures directly using your referral link or coupon.
                </p>
              </div>

              <div className="p-4 bg-[#F8F4E8] rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#8B1E3F]">Level 2 (Sub-Tier)</span>
                  <span className="bg-[#8B1E3F] text-amber-100 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                    {settings.level2Percent}%
                  </span>
                </div>
                <p className="text-[11px] text-[#6E4E37]">
                  Earned when your Level 1 team members bring new customers or readers.
                </p>
              </div>

              <div className="p-4 bg-[#F8F4E8] rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#8B1E3F]">Level 3 (Extended)</span>
                  <span className="bg-[#8B1E3F] text-amber-100 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                    {settings.level3Percent}%
                  </span>
                </div>
                <p className="text-[11px] text-[#6E4E37]">
                  Earned on purchases generated by your Level 2 team members.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Commission History Ledger */}
          <div className="bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center justify-between">
              <span>Recent Commission Transactions</span>
              <span className="text-xs text-[#6E4E37] font-sans font-medium">Auto-Calculated & Verified</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F4E8] border-b border-[#D4AF37]/30 text-[#6E4E37] font-bold">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Buyer Name</th>
                    <th className="p-3">Order Value</th>
                    <th className="p-3">Level Tier</th>
                    <th className="p-3">Commission %</th>
                    <th className="p-3">Earned Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/20">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8F4E8]/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#8B1E3F]">{c.orderId}</td>
                      <td className="p-3 font-bold">{c.buyerName}</td>
                      <td className="p-3">₹{c.orderAmount}</td>
                      <td className="p-3">
                        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          Level {c.level}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#8B1E3F]">{c.ratePercent}%</td>
                      <td className="p-3 font-extrabold text-emerald-800">₹{c.commissionAmount}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            c.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-[#6E4E37]">{c.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WALLET & WITHDRAWALS */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Withdrawal Request Form Left */}
            <div className="lg:col-span-6 bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-4">
              <h3 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#D4AF37]" />
                <span>Request Payout / Withdrawal</span>
              </h3>

              {withdrawFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    withdrawFeedback.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{withdrawFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#6E4E37] block mb-1">Select Payout Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWithdrawalMethod('upi')}
                      className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                        withdrawalMethod === 'upi'
                          ? 'bg-[#8B1E3F] text-amber-100 border-[#8B1E3F]'
                          : 'bg-[#F8F4E8] text-[#4A2C17] border-[#D4AF37]/40'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> Instant UPI
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawalMethod('bank')}
                      className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                        withdrawalMethod === 'bank'
                          ? 'bg-[#8B1E3F] text-amber-100 border-[#8B1E3F]'
                          : 'bg-[#F8F4E8] text-[#4A2C17] border-[#D4AF37]/40'
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> Bank Wire Transfer
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#6E4E37] block mb-1">
                    Withdrawal Amount (₹) • Minimum: ₹{settings.minWithdrawalAmount}
                  </label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    min={settings.minWithdrawalAmount}
                    max={wallet.withdrawableBalance}
                    className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-2xl p-3 font-bold text-sm focus:outline-none focus:border-[#8B1E3F]"
                    required
                  />
                  <p className="text-[10px] text-[#6E4E37] mt-1">
                    Available withdrawable balance: <strong>₹{wallet.withdrawableBalance}</strong>
                  </p>
                </div>

                {withdrawalMethod === 'upi' ? (
                  <div>
                    <label className="font-bold text-[#6E4E37] block mb-1">UPI ID (VPA)</label>
                    <input
                      type="text"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      placeholder="e.g. name@okaxis or name@paytm"
                      className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-2xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-[#6E4E37] block mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={holderInput}
                        onChange={(e) => setHolderInput(e.target.value)}
                        className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-2xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-[#6E4E37] block mb-1">Account Number</label>
                        <input
                          type="text"
                          value={accNumInput}
                          onChange={(e) => setAccNumInput(e.target.value)}
                          className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-2xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[#6E4E37] block mb-1">IFSC Code</label>
                        <input
                          type="text"
                          value={ifscInput}
                          onChange={(e) => setIfscInput(e.target.value)}
                          className="w-full bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-2xl p-3 font-bold focus:outline-none focus:border-[#8B1E3F]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={wallet.withdrawableBalance < settings.minWithdrawalAmount}
                  className="w-full bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold text-xs py-3.5 rounded-2xl shadow-xs transition-all border border-amber-200 disabled:opacity-50"
                >
                  Submit Payout Request Now
                </button>
              </form>
            </div>

            {/* Wallet Summary Right */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#8B1E3F] text-amber-100 p-6 rounded-3xl border border-[#D4AF37]/40 shadow-sm space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                  Wallet Balance Overview
                </span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-amber-200">Withdrawable Balance</p>
                    <p className="font-serif text-3xl font-extrabold text-amber-100">
                      ₹{wallet.withdrawableBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-200">Pending Hold</p>
                    <p className="font-serif text-xl font-bold text-amber-300">
                      ₹{wallet.pendingEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/30 flex justify-between text-xs text-amber-200">
                  <span>Lifetime Earnings: <strong>₹{wallet.lifetimeEarnings}</strong></span>
                  <span>Min Payout: <strong>₹{settings.minWithdrawalAmount}</strong></span>
                </div>
              </div>

              {/* Withdrawal History */}
              <div className="bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-4">
                <h3 className="font-serif font-bold text-base text-[#8B1E3F]">
                  Withdrawal History & Status
                </h3>

                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#8B1E3F]">{w.id}</span>
                        <p className="text-[11px] text-[#6E4E37]">
                          Method: {w.method.toUpperCase()} • {w.requestedAt}
                        </p>
                        {w.transactionId && (
                          <p className="text-[10px] text-emerald-800 font-mono font-bold">
                            Txn: {w.transactionId}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-[#8B1E3F] block text-sm">₹{w.amount}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {w.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MY 3-LEVEL TEAM */}
      {activeTab === 'team' && (
        <div className="bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#8B1E3F]">
                3-Level Referral Team Tree
              </h3>
              <p className="text-xs text-[#6E4E37]">
                Track all active direct and multi-tier sub-referrals in your network.
              </p>
            </div>

            <div className="flex gap-2 text-xs font-bold">
              <span className="bg-amber-100 text-[#8B1E3F] px-3 py-1 rounded-xl border border-amber-300">
                Total Members: {team.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {team.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#8B1E3F] text-amber-100 flex items-center justify-center font-bold text-sm">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#8B1E3F]">{m.name}</h4>
                      <p className="text-[11px] text-[#6E4E37]">{m.email} • Joined: {m.joinDate}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Level {m.level} Member
                    </span>
                    <p className="text-xs font-bold text-[#8B1E3F] mt-1">Sales: ₹{m.totalSales}</p>
                  </div>
                </div>

                {/* Sub-members Level 2 and Level 3 */}
                {m.subMembers && m.subMembers.length > 0 && (
                  <div className="pl-6 border-l-2 border-[#D4AF37]/40 space-y-2 mt-2">
                    <span className="text-[10px] font-extrabold uppercase text-[#6E4E37] tracking-wider block">
                      Level 2 Downline:
                    </span>
                    {m.subMembers.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 bg-white rounded-xl border border-[#D4AF37]/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#8B1E3F]">{sub.name}</p>
                          <span className="text-[10px] text-[#6E4E37]">{sub.email}</span>
                        </div>
                        <span className="font-bold text-emerald-800">Sales: ₹{sub.totalSales}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RANKS & REWARDS */}
      {activeTab === 'rank' && (
        <div className="bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-6">
          <div>
            <h3 className="font-serif font-bold text-xl text-[#8B1E3F]">
              Affiliate Rank & Milestones Tier
            </h3>
            <p className="text-xs text-[#6E4E37]">
              Unlock higher commission multipliers and exclusive bonuses as your sales grow.
            </p>
          </div>

          {/* Current Rank Banner */}
          <div className="p-6 bg-[#8B1E3F] text-amber-100 rounded-2xl border border-[#D4AF37]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-[#3A1F0D] flex items-center justify-center font-extrabold text-2xl shadow-xs">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">
                  Current Achieved Rank
                </span>
                <h4 className="font-serif text-2xl font-bold text-amber-100">{currentRank.rank} Tier</h4>
                <p className="text-xs text-amber-200">
                  Bonus Multiplier: +{currentRank.commissionBonusPercent}% Extra Payout
                </p>
              </div>
            </div>

            {nextRank && (
              <div className="text-center sm:text-right text-xs space-y-1">
                <span className="text-amber-300 font-bold block">Next Rank Target: {nextRank.rank}</span>
                <p className="text-amber-100 font-mono">
                  Min Sales Required: ₹{nextRank.minSalesAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Perks Grid */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-base text-[#8B1E3F]">Your Unlocked Perks:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {currentRank.perks.map((p, idx) => (
                <div key={idx} className="p-3 bg-[#F8F4E8] rounded-xl border border-[#D4AF37]/30 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span className="font-bold">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LEADERBOARD & MONTHLY CONTEST */}
      {activeTab === 'leaderboard' && (
        <div className="bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#8B1E3F]">
                Monthly Top Affiliate Leaderboard
              </h3>
              <p className="text-xs text-[#6E4E37]">
                Top performers win exclusive cash prize pools every month!
              </p>
            </div>
            <span className="bg-[#8B1E3F] text-amber-100 font-bold text-xs px-3 py-1 rounded-xl">
              Prize Pool: ₹25,000
            </span>
          </div>

          <div className="space-y-3">
            {leaderboard.map((u) => (
              <div
                key={u.rank}
                className="p-4 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs ${
                      u.rank === 1
                        ? 'bg-amber-400 text-amber-950'
                        : u.rank === 2
                        ? 'bg-zinc-300 text-zinc-900'
                        : u.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-[#8B1E3F]/10 text-[#8B1E3F]'
                    }`}
                  >
                    #{u.rank}
                  </span>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#8B1E3F]">{u.userName}</h4>
                    <span className="text-[10px] text-[#6E4E37] font-bold">Tier: {u.tier}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-emerald-800 text-sm block">
                    ₹{u.monthlyVolume.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#6E4E37]">Monthly Sales</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QrShareModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        referralUrl={referralUrl}
        referralCode={referralCode}
      />
    </div>
  );
};
