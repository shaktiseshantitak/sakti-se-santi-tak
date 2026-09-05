import React, { useState } from 'react';
import {
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Wallet,
  Copy,
  Check,
  Share2,
  Award,
  ArrowUpRight,
  Clock,
  Sparkles,
  RefreshCw,
  Users
} from 'lucide-react';
import { useAffiliate } from '../../context/AffiliateContext';

interface AffiliateMetricsWidgetProps {
  onViewFullPortal?: () => void;
  title?: string;
  className?: string;
}

export const AffiliateMetricsWidget: React.FC<AffiliateMetricsWidgetProps> = ({
  onViewFullPortal,
  title = "Affiliate Performance Summary",
  className = ""
}) => {
  const { stats, wallet, referralCode, referralUrl, currentRank, commissions, refreshData } = useAffiliate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Calculate estimated upcoming payout (approved + pending)
  const estimatedEarnings = wallet.totalEarnings + wallet.pendingEarnings;
  const recentCommissionsCount = commissions.filter(c => c.status === 'approved' || c.status === 'pending').length;

  return (
    <div className={`bg-[#FFF8EE] border border-[#D4AF37]/50 rounded-3xl p-6 shadow-sm space-y-6 ${className}`}>
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#D4AF37]/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#8B1E3F] text-amber-100 flex items-center justify-center shadow-xs border border-[#D4AF37]/40 shrink-0">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">{title}</h3>
              <span className="bg-[#8B1E3F]/10 text-[#8B1E3F] border border-[#8B1E3F]/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                3-Tier Live Metrics
              </span>
            </div>
            <p className="text-xs text-[#6E4E37] font-medium">
              Real-time referral tracking, click conversion stats, and estimated commissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleRefresh}
            title="Refresh Live Metrics"
            className="p-2 bg-[#F8F4E8] hover:bg-amber-100/80 text-[#8B1E3F] rounded-xl border border-[#D4AF37]/40 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {onViewFullPortal && (
            <button
              onClick={onViewFullPortal}
              className="bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-bold text-xs px-3.5 py-2 rounded-xl border border-amber-400/40 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <span>Full Partner Portal</span>
              <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Performance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Clicks */}
        <div className="bg-[#F8F4E8] p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 space-y-2 relative overflow-hidden group hover:border-[#8B1E3F]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#6E4E37] uppercase tracking-wider">
              Total Link Clicks
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#8B1E3F] flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="font-serif text-2xl sm:text-3xl font-extrabold text-[#8B1E3F]">
              {stats.totalClicks.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1 text-[#6E4E37]">
              <span>Unique Visitors:</span>
              <span className="font-bold text-amber-900">{stats.uniqueVisitors.toLocaleString()}</span>
            </div>
          </div>

          <div className="w-full bg-amber-200/50 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (stats.uniqueVisitors / (stats.totalClicks || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Conversions & Referred Orders */}
        <div className="bg-[#F8F4E8] p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 space-y-2 relative overflow-hidden group hover:border-[#8B1E3F]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#6E4E37] uppercase tracking-wider">
              Total Conversions
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-800 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="font-serif text-2xl sm:text-3xl font-extrabold text-[#8B1E3F] flex items-baseline gap-2">
              <span>{stats.totalOrders}</span>
              <span className="text-xs font-sans font-bold text-emerald-800">
                ({stats.conversionRate}% Conv. Rate)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1 text-[#6E4E37]">
              <span>Successful Sales:</span>
              <span className="font-bold text-emerald-900">{recentCommissionsCount} Orders</span>
            </div>
          </div>

          <div className="w-full bg-emerald-200/50 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(stats.conversionRate) * 10)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Estimated Earnings */}
        <div className="bg-[#F8F4E8] p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 space-y-2 relative overflow-hidden group hover:border-[#8B1E3F]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#6E4E37] uppercase tracking-wider">
              Estimated Earnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-600/15 text-amber-900 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="font-serif text-2xl sm:text-3xl font-extrabold text-[#8B1E3F]">
              ₹{estimatedEarnings.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1 text-[#6E4E37]">
              <span>Pending Release:</span>
              <span className="font-bold text-amber-900">₹{wallet.pendingEarnings.toLocaleString()}</span>
            </div>
          </div>

          <div className="w-full bg-amber-200/50 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#D4AF37] h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (wallet.totalEarnings / (estimatedEarnings || 1)) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* Metric 4: Withdrawable Balance */}
        <div className="bg-[#8B1E3F] text-amber-100 p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/50 space-y-2 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
              Withdrawable Cash
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#3A1F0D] flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="font-serif text-2xl sm:text-3xl font-extrabold text-amber-100">
              ₹{wallet.withdrawableBalance.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1 text-amber-200/90">
              <span>Lifetime Payouts:</span>
              <span className="font-bold text-amber-300">₹{wallet.lifetimeEarnings.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-amber-300/90 font-medium border-t border-amber-500/30">
            <span>Rank Tier: {currentRank.rank}</span>
            <span className="bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-200 border border-amber-400/30">
              +{currentRank.commissionBonusPercent}% Bonus
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Referral Link Strip */}
      <div className="bg-[#F8F4E8] p-4 rounded-2xl border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="truncate">
            <span className="font-extrabold text-[#8B1E3F] block">Your Active Referral Link:</span>
            <span className="font-mono text-[#6E4E37] text-[11px] font-semibold truncate block">
              {referralUrl}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <span className="font-mono text-xs font-extrabold bg-amber-200/60 text-[#8B1E3F] px-2.5 py-1 rounded-lg border border-amber-300">
            Code: {referralCode}
          </span>
          <button
            onClick={handleCopyLink}
            className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all border border-amber-200"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
