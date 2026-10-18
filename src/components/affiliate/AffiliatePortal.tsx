import { useSiteContent } from '../../lib/useSiteContent';
import React, { useState } from 'react';
import {
  Share2, Copy, Check, QrCode, Wallet, TrendingUp, Users, Award,
  ArrowUpRight, DollarSign, Clock, ShieldCheck, ChevronRight, AlertCircle,
  Building2, Smartphone, Send, Trophy, Percent, HelpCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAffiliate } from '../../context/AffiliateContext';
import { QrShareModal } from './QrShareModal';

export const AffiliatePortal: React.FC = () => {
  const tx = useSiteContent();

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
    <div className="space-y-6 text-[color:var(--c-text)]">
      {/* Top Banner: Referral Code & Link Box */}
      <div className="bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[color:var(--c-accent)]/30 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--c-primary)]/10 text-[color:var(--c-primary)] text-xs font-extrabold border border-[color:var(--c-primary)]/20">
              <Award className="w-3.5 h-3.5 text-[color:var(--c-accent)]" />
              <span>{tx('t.AffiliatePortal.a53c333c')} {currentRank.rank}</span>
            </div>
            <h2 className="font-serif text-2xl font-extrabold text-[color:var(--c-primary)]">
              {tx('t.AffiliatePortal.0cc71515')}
            </h2>
            <p className="text-xs text-[color:var(--c-text-muted)] font-medium">
              {tx('t.AffiliatePortal.9e83fbf0')}
            </p>
          </div>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="bg-[color:var(--c-primary)] hover:bg-[color:var(--c-primary-deep)] text-amber-100 font-bold text-xs px-4 py-2.5 rounded-xl border border-amber-400/40 shadow-xs flex items-center gap-2 transition-all shrink-0"
          >
            <QrCode className="w-4 h-4 text-[color:var(--c-accent)]" />
            <span>{tx('t.AffiliatePortal.2cdc82e6')}</span>
          </button>
        </div>

        {/* Unique Link & Code Copy Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-[color:var(--c-page)] p-4 rounded-2xl border border-[color:var(--c-accent)]/30 space-y-2">
            <label className="text-[11px] font-extrabold uppercase text-[color:var(--c-text-muted)] tracking-wider block">
              {tx('t.AffiliatePortal.c3d02e71')}
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-[color:var(--c-primary)] font-bold truncate">
                {referralUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[color:var(--c-page)] p-4 rounded-2xl border border-[color:var(--c-accent)]/30 space-y-2">
            <label className="text-[11px] font-extrabold uppercase text-[color:var(--c-text-muted)] tracking-wider block">
              {tx('t.AffiliatePortal.06b5c9b1')}
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-extrabold text-[color:var(--c-primary)]">
                {referralCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="bg-[color:var(--c-ink)] hover:bg-[#1E120D] text-[color:var(--c-accent-light)] font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-all"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Social Share Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs font-bold text-[color:var(--c-text-muted)] flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-[color:var(--c-primary)]" /> {tx('t.AffiliatePortal.a26645c5')}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> {tx('t.AffiliatePortal.d948957a')}
            </button>

            <button
              onClick={() => handleSocialShare('telegram')}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> {tx('t.AffiliatePortal.5b125ff4')}
            </button>

            <button
              onClick={() => handleSocialShare('facebook')}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" /> {tx('t.AffiliatePortal.06121333')}
            </button>

            <button
              onClick={() => handleSocialShare('x')}
              className="bg-zinc-900 hover:bg-black text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" /> {tx('t.AffiliatePortal.7fe3aaad')}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[color:var(--c-accent)]/30 overflow-x-auto gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
              : 'border-transparent text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> {tx('t.AffiliatePortal.3ed37080')}
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'wallet'
              ? 'border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
              : 'border-transparent text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
          }`}
        >
          <Wallet className="w-4 h-4" /> {tx('t.AffiliatePortal.00997d86')}{wallet.withdrawableBalance})
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'team'
              ? 'border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
              : 'border-transparent text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
          }`}
        >
          <Users className="w-4 h-4" /> {tx('t.AffiliatePortal.23e8ebab')}{team.length})
        </button>

        <button
          onClick={() => setActiveTab('rank')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'rank'
              ? 'border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
              : 'border-transparent text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
          }`}
        >
          <Award className="w-4 h-4" /> {tx('t.AffiliatePortal.423671a4')}{currentRank.rank})
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
              : 'border-transparent text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
          }`}
        >
          <Trophy className="w-4 h-4" /> {tx('t.AffiliatePortal.292ef3ea')}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PERFORMANCE */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[color:var(--c-surface)] p-5 rounded-2xl border border-[color:var(--c-accent)]/40 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[color:var(--c-text-muted)] uppercase tracking-wider block">{tx('t.AffiliatePortal.1c1e3803')}</span>
              <p className="font-serif text-2xl font-extrabold text-[color:var(--c-primary)]">{stats.totalClicks.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-800 font-bold">{tx('t.AffiliatePortal.bfd97dc0')} {stats.uniqueVisitors}</span>
            </div>

            <div className="bg-[color:var(--c-surface)] p-5 rounded-2xl border border-[color:var(--c-accent)]/40 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[color:var(--c-text-muted)] uppercase tracking-wider block">{tx('t.AffiliatePortal.4f8796ca')}</span>
              <p className="font-serif text-2xl font-extrabold text-[color:var(--c-primary)]">{stats.totalOrders}</p>
              <span className="text-[10px] text-emerald-800 font-bold">{tx('t.AffiliatePortal.031c5a7c')} {stats.conversionRate}%</span>
            </div>

            <div className="bg-[color:var(--c-surface)] p-5 rounded-2xl border border-[color:var(--c-accent)]/40 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[color:var(--c-text-muted)] uppercase tracking-wider block">{tx('t.AffiliatePortal.77837ac2')}</span>
              <p className="font-serif text-2xl font-extrabold text-[color:var(--c-primary)]">₹{wallet.totalEarnings.toLocaleString()}</p>
              <span className="text-[10px] text-amber-800 font-bold">{tx('t.AffiliatePortal.3430ae66')}{wallet.pendingEarnings}</span>
            </div>

            <div className="bg-[color:var(--c-surface)] p-5 rounded-2xl border border-[color:var(--c-accent)]/40 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-[color:var(--c-text-muted)] uppercase tracking-wider block">{tx('t.AffiliatePortal.9b29a10b')}</span>
              <p className="font-serif text-2xl font-extrabold text-emerald-800">₹{wallet.withdrawableBalance.toLocaleString()}</p>
              <span className="text-[10px] text-[color:var(--c-primary)] font-bold">{tx('t.AffiliatePortal.1c6b1c59')}{wallet.lifetimeEarnings.toLocaleString()}</span>
            </div>
          </div>

          {/* 3-Level Commission Engine Architecture Overview */}
          <div className="bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)] flex items-center gap-2">
              <Percent className="w-5 h-5 text-[color:var(--c-accent)]" />
              <span>{tx('t.AffiliatePortal.8f202023')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[color:var(--c-page)] rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[color:var(--c-primary)]">{tx('t.AffiliatePortal.6bb02665')}</span>
                  <span className="bg-[color:var(--c-primary)] text-amber-100 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                    {settings.level1Percent}%
                  </span>
                </div>
                <p className="text-[11px] text-[color:var(--c-text-muted)]">
                  {tx('t.AffiliatePortal.d0d206e0')}
                </p>
              </div>

              <div className="p-4 bg-[color:var(--c-page)] rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[color:var(--c-primary)]">{tx('t.AffiliatePortal.be48b53f')}</span>
                  <span className="bg-[color:var(--c-primary)] text-amber-100 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                    {settings.level2Percent}%
                  </span>
                </div>
                <p className="text-[11px] text-[color:var(--c-text-muted)]">
                  {tx('t.AffiliatePortal.e8292af7')}
                </p>
              </div>

              <div className="p-4 bg-[color:var(--c-page)] rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[color:var(--c-primary)]">{tx('t.AffiliatePortal.c34cf3d2')}</span>
                  <span className="bg-[color:var(--c-primary)] text-amber-100 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                    {settings.level3Percent}%
                  </span>
                </div>
                <p className="text-[11px] text-[color:var(--c-text-muted)]">
                  {tx('t.AffiliatePortal.653129b7')}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Commission History Ledger */}
          <div className="bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)] flex items-center justify-between">
              <span>{tx('t.AffiliatePortal.caa7ecad')}</span>
              <span className="text-xs text-[color:var(--c-text-muted)] font-sans font-medium">{tx('t.AffiliatePortal.227a71ae')}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[color:var(--c-page)] border-b border-[color:var(--c-accent)]/30 text-[color:var(--c-text-muted)] font-bold">
                    <th className="p-3">{tx('t.AffiliatePortal.e7ba74b8')}</th>
                    <th className="p-3">{tx('t.AffiliatePortal.4f7a2752')}</th>
                    <th className="p-3">{tx('t.AffiliatePortal.3e7b4952')}</th>
                    <th className="p-3">{tx('t.AffiliatePortal.b3108184')}</th>
                    <th className="p-3">{tx('t.AffiliatePortal.74932b14')}</th>
                    <th className="p-3">{tx('t.AffiliatePortal.883eb333')}</th>
                    <th className="p-3">{tx('t.AffiliatePortal.239a6a13')}</th>
                    <th className="p-3">{tx('t.AffiliatePortal.3791e0b5')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--c-accent)]/20">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-[color:var(--c-page)]/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-[color:var(--c-primary)]">{c.orderId}</td>
                      <td className="p-3 font-bold">{c.buyerName}</td>
                      <td className="p-3">₹{c.orderAmount}</td>
                      <td className="p-3">
                        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          {tx('t.AffiliatePortal.fcba150f')} {c.level}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[color:var(--c-primary)]">{c.ratePercent}%</td>
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
                      <td className="p-3 text-[11px] text-[color:var(--c-text-muted)]">{c.createdAt}</td>
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
            <div className="lg:col-span-6 bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 space-y-4">
              <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)] flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[color:var(--c-accent)]" />
                <span>{tx('t.AffiliatePortal.d3d4fec6')}</span>
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
                  <label className="font-bold text-[color:var(--c-text-muted)] block mb-1">{tx('t.AffiliatePortal.6d0376f5')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWithdrawalMethod('upi')}
                      className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                        withdrawalMethod === 'upi'
                          ? 'bg-[color:var(--c-primary)] text-amber-100 border-[color:var(--c-primary)]'
                          : 'bg-[color:var(--c-page)] text-[color:var(--c-text)] border-[color:var(--c-accent)]/40'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> {tx('t.AffiliatePortal.0784d810')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawalMethod('bank')}
                      className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                        withdrawalMethod === 'bank'
                          ? 'bg-[color:var(--c-primary)] text-amber-100 border-[color:var(--c-primary)]'
                          : 'bg-[color:var(--c-page)] text-[color:var(--c-text)] border-[color:var(--c-accent)]/40'
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> {tx('t.AffiliatePortal.00f0608c')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[color:var(--c-text-muted)] block mb-1">
                    {tx('t.AffiliatePortal.21765b94')}{settings.minWithdrawalAmount}
                  </label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    min={settings.minWithdrawalAmount}
                    max={wallet.withdrawableBalance}
                    className="w-full bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-2xl p-3 font-bold text-sm focus:outline-none focus:border-[color:var(--c-primary)]"
                    required
                  />
                  <p className="text-[10px] text-[color:var(--c-text-muted)] mt-1">
                    {tx('t.AffiliatePortal.d7989e79')} <strong>₹{wallet.withdrawableBalance}</strong>
                  </p>
                </div>

                {withdrawalMethod === 'upi' ? (
                  <div>
                    <label className="font-bold text-[color:var(--c-text-muted)] block mb-1">{tx('t.AffiliatePortal.be46d120')}</label>
                    <input
                      type="text"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      placeholder={tx('t.AffiliatePortal.38c102df')}
                      className="w-full bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-2xl p-3 font-bold focus:outline-none focus:border-[color:var(--c-primary)]"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-[color:var(--c-text-muted)] block mb-1">{tx('t.AffiliatePortal.a78de84a')}</label>
                      <input
                        type="text"
                        value={holderInput}
                        onChange={(e) => setHolderInput(e.target.value)}
                        className="w-full bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-2xl p-3 font-bold focus:outline-none focus:border-[color:var(--c-primary)]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-[color:var(--c-text-muted)] block mb-1">{tx('t.AffiliatePortal.520bf438')}</label>
                        <input
                          type="text"
                          value={accNumInput}
                          onChange={(e) => setAccNumInput(e.target.value)}
                          className="w-full bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-2xl p-3 font-bold focus:outline-none focus:border-[color:var(--c-primary)]"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[color:var(--c-text-muted)] block mb-1">{tx('t.AffiliatePortal.9b5252d7')}</label>
                        <input
                          type="text"
                          value={ifscInput}
                          onChange={(e) => setIfscInput(e.target.value)}
                          className="w-full bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-2xl p-3 font-bold focus:outline-none focus:border-[color:var(--c-primary)]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={wallet.withdrawableBalance < settings.minWithdrawalAmount}
                  className="w-full bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-extrabold text-xs py-3.5 rounded-2xl shadow-xs transition-all border border-amber-200 disabled:opacity-50"
                >
                  {tx('t.AffiliatePortal.19bf3adc')}
                </button>
              </form>
            </div>

            {/* Wallet Summary Right */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[color:var(--c-primary)] text-amber-100 p-6 rounded-3xl border border-[color:var(--c-accent)]/40 shadow-sm space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                  {tx('t.AffiliatePortal.8029f669')}
                </span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-amber-200">{tx('t.AffiliatePortal.abcf6234')}</p>
                    <p className="font-serif text-3xl font-extrabold text-amber-100">
                      ₹{wallet.withdrawableBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-200">{tx('t.AffiliatePortal.ceca9fb9')}</p>
                    <p className="font-serif text-xl font-bold text-amber-300">
                      ₹{wallet.pendingEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/30 flex justify-between text-xs text-amber-200">
                  <span>{tx('t.AffiliatePortal.35b23c58')} <strong>₹{wallet.lifetimeEarnings}</strong></span>
                  <span>{tx('t.AffiliatePortal.58ce7c41')} <strong>₹{settings.minWithdrawalAmount}</strong></span>
                </div>
              </div>

              {/* Withdrawal History */}
              <div className="bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 space-y-4">
                <h3 className="font-serif font-bold text-base text-[color:var(--c-primary)]">
                  {tx('t.AffiliatePortal.3c3a6e79')}
                </h3>

                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 bg-[color:var(--c-page)] rounded-2xl border border-[color:var(--c-accent)]/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[color:var(--c-primary)]">{w.id}</span>
                        <p className="text-[11px] text-[color:var(--c-text-muted)]">
                          {tx('t.AffiliatePortal.7959a903')} {w.method.toUpperCase()} • {w.requestedAt}
                        </p>
                        {w.transactionId && (
                          <p className="text-[10px] text-emerald-800 font-mono font-bold">
                            {tx('t.AffiliatePortal.9801be83')} {w.transactionId}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-[color:var(--c-primary)] block text-sm">₹{w.amount}</span>
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
        <div className="bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-xl text-[color:var(--c-primary)]">
                {tx('t.AffiliatePortal.4ae02931')}
              </h3>
              <p className="text-xs text-[color:var(--c-text-muted)]">
                {tx('t.AffiliatePortal.3dfdd082')}
              </p>
            </div>

            <div className="flex gap-2 text-xs font-bold">
              <span className="bg-amber-100 text-[color:var(--c-primary)] px-3 py-1 rounded-xl border border-amber-300">
                {tx('t.AffiliatePortal.f582751a')} {team.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {team.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-[color:var(--c-page)] rounded-2xl border border-[color:var(--c-accent)]/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[color:var(--c-primary)] text-amber-100 flex items-center justify-center font-bold text-sm">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[color:var(--c-primary)]">{m.name}</h4>
                      <p className="text-[11px] text-[color:var(--c-text-muted)]">{m.email} {tx('t.AffiliatePortal.3e518071')} {m.joinDate}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {tx('t.AffiliatePortal.fcba150f')} {m.level} {tx('t.AffiliatePortal.55fc4230')}
                    </span>
                    <p className="text-xs font-bold text-[color:var(--c-primary)] mt-1">{tx('t.AffiliatePortal.a3967f34')}{m.totalSales}</p>
                  </div>
                </div>

                {/* Sub-members Level 2 and Level 3 */}
                {m.subMembers && m.subMembers.length > 0 && (
                  <div className="pl-6 border-l-2 border-[color:var(--c-accent)]/40 space-y-2 mt-2">
                    <span className="text-[10px] font-extrabold uppercase text-[color:var(--c-text-muted)] tracking-wider block">
                      {tx('t.AffiliatePortal.d52eea2a')}
                    </span>
                    {m.subMembers.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 bg-white rounded-xl border border-[color:var(--c-accent)]/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-[color:var(--c-primary)]">{sub.name}</p>
                          <span className="text-[10px] text-[color:var(--c-text-muted)]">{sub.email}</span>
                        </div>
                        <span className="font-bold text-emerald-800">{tx('t.AffiliatePortal.a3967f34')}{sub.totalSales}</span>
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
        <div className="bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 space-y-6">
          <div>
            <h3 className="font-serif font-bold text-xl text-[color:var(--c-primary)]">
              {tx('t.AffiliatePortal.debf9e67')}
            </h3>
            <p className="text-xs text-[color:var(--c-text-muted)]">
              {tx('t.AffiliatePortal.3c0be8a6')}
            </p>
          </div>

          {/* Current Rank Banner */}
          <div className="p-6 bg-[color:var(--c-primary)] text-amber-100 rounded-2xl border border-[color:var(--c-accent)]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-[color:var(--c-ink)] flex items-center justify-center font-extrabold text-2xl shadow-xs">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">
                  {tx('t.AffiliatePortal.1c4591e3')}
                </span>
                <h4 className="font-serif text-2xl font-bold text-amber-100">{currentRank.rank} {tx('t.AffiliatePortal.5b66b302')}</h4>
                <p className="text-xs text-amber-200">
                  {tx('t.AffiliatePortal.24c0be43')}{currentRank.commissionBonusPercent}{tx('t.AffiliatePortal.be00c912')}
                </p>
              </div>
            </div>

            {nextRank && (
              <div className="text-center sm:text-right text-xs space-y-1">
                <span className="text-amber-300 font-bold block">{tx('t.AffiliatePortal.14da72d5')} {nextRank.rank}</span>
                <p className="text-amber-100 font-mono">
                  {tx('t.AffiliatePortal.6207513b')}{nextRank.minSalesAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Perks Grid */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-base text-[color:var(--c-primary)]">{tx('t.AffiliatePortal.acb5bd32')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {currentRank.perks.map((p, idx) => (
                <div key={idx} className="p-3 bg-[color:var(--c-page)] rounded-xl border border-[color:var(--c-accent)]/30 flex items-center gap-2">
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
        <div className="bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-xl text-[color:var(--c-primary)]">
                {tx('t.AffiliatePortal.e2054f40')}
              </h3>
              <p className="text-xs text-[color:var(--c-text-muted)]">
                {tx('t.AffiliatePortal.ee3e3bc0')}
              </p>
            </div>
            <span className="bg-[color:var(--c-primary)] text-amber-100 font-bold text-xs px-3 py-1 rounded-xl">
              {tx('t.AffiliatePortal.cb130ad3')}
            </span>
          </div>

          <div className="space-y-3">
            {leaderboard.map((u) => (
              <div
                key={u.rank}
                className="p-4 bg-[color:var(--c-page)] rounded-2xl border border-[color:var(--c-accent)]/30 flex items-center justify-between text-xs"
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
                        : 'bg-[color:var(--c-primary)]/10 text-[color:var(--c-primary)]'
                    }`}
                  >
                    #{u.rank}
                  </span>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[color:var(--c-primary)]">{u.userName}</h4>
                    <span className="text-[10px] text-[color:var(--c-text-muted)] font-bold">{tx('t.AffiliatePortal.6e0d94b6')} {u.tier}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-emerald-800 text-sm block">
                    ₹{u.monthlyVolume.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[color:var(--c-text-muted)]">{tx('t.AffiliatePortal.119048cb')}</span>
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
