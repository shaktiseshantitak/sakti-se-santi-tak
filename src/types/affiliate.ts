export type AffiliateRank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Crown';

export interface AffiliateRankCriteria {
  rank: AffiliateRank;
  minSalesAmount: number;
  minActiveReferrals: number;
  commissionBonusPercent: number;
  badgeColor: string;
  perks: string[];
}

export interface ReferralLink {
  code: string;
  url: string;
  createdAt: string;
  clicksCount: number;
  conversionsCount: number;
}

export interface WalletBalance {
  totalEarnings: number;
  pendingEarnings: number;
  withdrawableBalance: number;
  lifetimeEarnings: number;
}

export interface WalletLedgerItem {
  id: string;
  type: 'commission' | 'withdrawal' | 'bonus' | 'manual_credit' | 'manual_debit' | 'refund_reversal';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  description: string;
  createdAt: string;
  referenceId?: string;
}

export interface CommissionRecord {
  id: string;
  orderId: string;
  buyerName: string;
  orderAmount: number;
  level: number; // 1, 2, 3, etc.
  ratePercent: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  level: number;
  joinDate: string;
  totalSales: number;
  totalCommissionsEarned: number;
  status: 'active' | 'inactive';
  parentId?: string;
  subMembers?: TeamMember[];
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'upi' | 'bank';
  details: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    holderName?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: string;
  processedAt?: string;
  adminNote?: string;
  transactionId?: string;
}

export interface AffiliateDashboardStats {
  totalClicks: number;
  uniqueVisitors: number;
  totalSignups: number;
  totalOrders: number;
  conversionRate: number;
  totalIncome: number;
  monthlyIncome: number;
}

export interface AffiliateCoupon {
  code: string;
  discountPercent: number;
  affiliateId: string;
  timesUsed: number;
}

export interface LeaderboardUser {
  rank: number;
  userName: string;
  userAvatar?: string;
  monthlyVolume: number;
  monthlyCommissions: number;
  tier: AffiliateRank;
}

export interface FraudAuditLog {
  id: string;
  userId: string;
  userName: string;
  ipAddress: string;
  eventType: 'self_referral_blocked' | 'duplicate_device' | 'suspicious_click_spike' | 'fake_order_detected' | 'admin_flagged';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: string;
}

export interface CommissionSettings {
  level1Percent: number;
  level2Percent: number;
  level3Percent: number;
  unlimitedTierPercent: number;
  minWithdrawalAmount: number;
  holdPeriodDays: number;
  autoApproveWithdrawalsUnder: number;
}

export interface AffiliateNotification {
  id: string;
  title: string;
  message: string;
  type: 'commission' | 'withdrawal' | 'rank_up' | 'bonus' | 'security';
  read: boolean;
  createdAt: string;
}
