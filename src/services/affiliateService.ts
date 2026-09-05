import {
  AffiliateRank,
  AffiliateRankCriteria,
  CommissionRecord,
  CommissionSettings,
  FraudAuditLog,
  LeaderboardUser,
  ReferralLink,
  TeamMember,
  WalletBalance,
  WalletLedgerItem,
  WithdrawalRequest,
  AffiliateDashboardStats,
  AffiliateNotification
} from '../types/affiliate';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_KEYS = {
  SETTINGS: 'dharma_affiliate_settings',
  REFERRALS: 'dharma_affiliate_referrals',
  WALLETS: 'dharma_affiliate_wallets',
  COMMISSIONS: 'dharma_affiliate_commissions',
  WITHDRAWALS: 'dharma_affiliate_withdrawals',
  TEAM: 'dharma_affiliate_team',
  FRAUD_LOGS: 'dharma_affiliate_fraud',
  NOTIFICATIONS: 'dharma_affiliate_notifications',
  ACTIVE_REF: 'dharma_active_referral_code',
};

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  level1Percent: 10,
  level2Percent: 5,
  level3Percent: 2.5,
  unlimitedTierPercent: 1,
  minWithdrawalAmount: 500,
  holdPeriodDays: 7,
  autoApproveWithdrawalsUnder: 1000,
};

export const DEFAULT_RANKS_CRITERIA: AffiliateRankCriteria[] = [
  {
    rank: 'Bronze',
    minSalesAmount: 0,
    minActiveReferrals: 0,
    commissionBonusPercent: 0,
    badgeColor: '#CD7F32',
    perks: ['Standard 3-Level Commission', 'Instant Unique QR Link', 'Weekly Payouts'],
  },
  {
    rank: 'Silver',
    minSalesAmount: 15000,
    minActiveReferrals: 5,
    commissionBonusPercent: 1.5,
    badgeColor: '#C0C0C0',
    perks: ['+1.5% Extra Bonus Commission', 'Priority Support', 'Custom Coupon Code'],
  },
  {
    rank: 'Gold',
    minSalesAmount: 50000,
    minActiveReferrals: 15,
    commissionBonusPercent: 3.0,
    badgeColor: '#D4AF37',
    perks: ['+3.0% Extra Bonus Commission', '24-Hour Express Withdrawals', 'Exclusive Marketing Kit'],
  },
  {
    rank: 'Platinum',
    minSalesAmount: 150000,
    minActiveReferrals: 35,
    commissionBonusPercent: 5.0,
    badgeColor: '#E5E4E2',
    perks: ['+5.0% Extra Bonus Commission', 'Dedicated Affiliate Manager', 'Monthly Milestone Bonuses'],
  },
  {
    rank: 'Diamond',
    minSalesAmount: 500000,
    minActiveReferrals: 100,
    commissionBonusPercent: 7.5,
    badgeColor: '#B9F2FF',
    perks: ['+7.5% Extra Bonus Commission', 'VVIP Event Passes', 'Zero Payout Fee'],
  },
  {
    rank: 'Crown',
    minSalesAmount: 1500000,
    minActiveReferrals: 300,
    commissionBonusPercent: 10.0,
    badgeColor: '#9B51E0',
    perks: ['+10.0% Extra Bonus Commission', 'Profit Sharing Pool', 'Custom Domain Branding'],
  },
];

// FIXED: this file used to default every brand-new affiliate (0 real clicks,
// 0 real sales) straight to fabricated demo numbers — impressive-looking
// fake stats (₹18,450 earnings, 1,420 clicks, 32 orders, a pre-built 3-level
// team) presented as if they were the user's own real, current data. That
// was reported as "dummy data instead of real data" on the Affiliate &
// Referral Portal. A brand-new affiliate should see honest zeros / an empty
// team until they actually generate real activity.
const EMPTY_WALLET: WalletBalance = {
  totalEarnings: 0,
  pendingEarnings: 0,
  withdrawableBalance: 0,
  lifetimeEarnings: 0,
};

const EMPTY_STATS: AffiliateDashboardStats = {
  totalClicks: 0,
  uniqueVisitors: 0,
  totalSignups: 0,
  totalOrders: 0,
  conversionRate: 0,
  totalIncome: 0,
  monthlyIncome: 0,
};

// FIXED: these four arrays used to be seeded with fake sample rows
// ('Acharya Rahul Sharma', 'COMM-8801', a hardcoded leaderboard, etc.)
// that showed up for literally every visitor — logged in or not — any
// time localStorage / Supabase had no real rows yet. That's what was
// being reported as "dummy data on the affiliate page even after
// login". A brand-new (or logged-out) affiliate should see genuinely
// empty lists, matching EMPTY_WALLET / EMPTY_STATS above.
const INITIAL_COMMISSIONS: CommissionRecord[] = [];

const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [];

const INITIAL_FRAUD_LOGS: FraudAuditLog[] = [];

const INITIAL_LEADERBOARD: LeaderboardUser[] = [];

export class AffiliateService {
  /**
   * Reads settings from storage or default
   */
  static getSettings(): CommissionSettings {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : DEFAULT_COMMISSION_SETTINGS;
    } catch {
      return DEFAULT_COMMISSION_SETTINGS;
    }
  }

  static saveSettings(settings: CommissionSettings): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  /**
   * Generates or retrieves unique referral code for user
   */
  static getUserReferralCode(userEmail?: string): string {
    const key = `dharma_ref_code_${userEmail || 'guest'}`;
    let code = localStorage.getItem(key);
    if (!code) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const prefix = userEmail ? userEmail.split('@')[0].toUpperCase().slice(0, 6) : 'SHAKTI';
      code = `${prefix}-${suffix}`;
      localStorage.setItem(key, code);
    }
    return code;
  }

  /**
   * Tracks incoming referral code from URL parameter e.g. ?ref=CODE
   */
  static handleReferralClick(refCode: string, userEmail?: string): boolean {
    if (!refCode) return false;

    // Self-referral protection check
    const userCode = this.getUserReferralCode(userEmail);
    if (userCode.toLowerCase() === refCode.toLowerCase()) {
      this.logFraud({
        userId: userEmail || 'guest',
        userName: userEmail || 'Guest Visitor',
        ipAddress: '127.0.0.1',
        eventType: 'self_referral_blocked',
        severity: 'medium',
        details: `Blocked self-referral click for code: ${refCode}`,
      });
      return false;
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_REF, refCode);
    return true;
  }

  static getActiveReferralCode(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_REF);
  }

  /**
   * Retrieves wallet balance
   */
  static getWalletBalance(): WalletBalance {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.WALLETS);
      return stored ? JSON.parse(stored) : EMPTY_WALLET;
    } catch {
      return EMPTY_WALLET;
    }
  }

  static updateWalletBalance(wallet: WalletBalance): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.WALLETS, JSON.stringify(wallet));
  }

  /**
   * Dashboard Stats
   */
  static getDashboardStats(): AffiliateDashboardStats {
    try {
      const stored = localStorage.getItem('dharma_aff_stats');
      return stored ? JSON.parse(stored) : EMPTY_STATS;
    } catch {
      return EMPTY_STATS;
    }
  }

  /**
   * Team Structure
   */
  static getTeamMembers(): TeamMember[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.TEAM);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Commissions List
   */
  static getCommissions(): CommissionRecord[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.COMMISSIONS);
      return stored ? JSON.parse(stored) : INITIAL_COMMISSIONS;
    } catch {
      return INITIAL_COMMISSIONS;
    }
  }

  static saveCommissions(records: CommissionRecord[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COMMISSIONS, JSON.stringify(records));
  }

  /**
   * Withdrawals List
   */
  static getWithdrawalRequests(): WithdrawalRequest[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.WITHDRAWALS);
      return stored ? JSON.parse(stored) : INITIAL_WITHDRAWALS;
    } catch {
      return INITIAL_WITHDRAWALS;
    }
  }

  static saveWithdrawalRequests(requests: WithdrawalRequest[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.WITHDRAWALS, JSON.stringify(requests));
  }

  /**
   * Request Payout / Withdrawal
   */
  static async createWithdrawalRequest(
    userId: string,
    userName: string,
    amount: number,
    method: 'upi' | 'bank',
    details: WithdrawalRequest['details']
  ): Promise<{ success: boolean; message: string; request?: WithdrawalRequest }> {
    const settings = this.getSettings();
    const wallet = this.getWalletBalance();

    if (amount < settings.minWithdrawalAmount) {
      return {
        success: false,
        message: `Minimum withdrawal amount is ₹${settings.minWithdrawalAmount}.`,
      };
    }

    if (amount > wallet.withdrawableBalance) {
      return {
        success: false,
        message: `Insufficient withdrawable balance (Available: ₹${wallet.withdrawableBalance}).`,
      };
    }

    const newRequest: WithdrawalRequest = {
      id: `WTH-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      userName,
      amount,
      method,
      details,
      status: 'pending',
      requestedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    // IMPORTANT: `wallet` here (and settings.minWithdrawalAmount above) come from
    // localStorage, which is entirely client-controlled and NOT an authoritative
    // balance. The real balance check now lives in the database (see migration
    // 005_affiliate_withdrawal_balance_integrity.sql — a trigger on
    // affiliate_withdrawals rejects any INSERT whose amount exceeds the affiliate's
    // ledger-derived balance). This client-side check is only a fast, friendly
    // pre-check for the UI; it must never be treated as the source of truth for
    // whether a withdrawal is actually valid.

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('affiliate_withdrawals').insert({
        id: newRequest.id,
        affiliate_user_id: userId,
        amount,
        payment_method: method,
        status: 'PENDING',
        transaction_reference: method === 'upi' ? details.upiId : details.accountNumber,
      });

      if (error) {
        // The DB is authoritative — if it rejected the request (e.g. the
        // balance-integrity trigger fired because the real ledger balance is
        // lower than what localStorage claims), surface that honestly instead
        // of pretending the request succeeded.
        console.warn('Supabase affiliate_withdrawals insert error:', error.message);
        return {
          success: false,
          message: error.message.includes('exceeds available')
            ? 'Insufficient verified balance for this withdrawal amount. Your recorded, admin-approved earnings do not cover this request.'
            : 'Could not submit withdrawal request. Please try again or contact support.',
        };
      }
    }

    // Only reflect the deduction/local record locally once the authoritative
    // insert (when Supabase is configured) has actually succeeded.
    wallet.withdrawableBalance -= amount;
    this.updateWalletBalance(wallet);

    const requests = this.getWithdrawalRequests();
    requests.unshift(newRequest);
    this.saveWithdrawalRequests(requests);

    return {
      success: true,
      message: `Withdrawal request of ₹${amount} submitted successfully! Admin review in progress.`,
      request: newRequest,
    };
  }

  /**
   * Automatically calculates 3-Level commissions when an order is completed
   */
  static processOrderCommission(
    orderId: string,
    orderAmount: number,
    buyerName: string,
    buyerEmail?: string,
    couponCode?: string
  ): CommissionRecord[] {
    const refCode = this.getActiveReferralCode() || couponCode;
    if (!refCode) return [];

    const settings = this.getSettings();
    const commissions: CommissionRecord[] = [];

    // Calculate Level 1 (Direct)
    const l1Amount = Math.round((orderAmount * settings.level1Percent) / 100);
    commissions.push({
      id: `COMM-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId,
      buyerName,
      orderAmount,
      level: 1,
      ratePercent: settings.level1Percent,
      commissionAmount: l1Amount,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });

    // Calculate Level 2
    const l2Amount = Math.round((orderAmount * settings.level2Percent) / 100);
    commissions.push({
      id: `COMM-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId,
      buyerName,
      orderAmount,
      level: 2,
      ratePercent: settings.level2Percent,
      commissionAmount: l2Amount,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });

    // Calculate Level 3
    const l3Amount = Math.round((orderAmount * settings.level3Percent) / 100);
    commissions.push({
      id: `COMM-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId,
      buyerName,
      orderAmount,
      level: 3,
      ratePercent: settings.level3Percent,
      commissionAmount: l3Amount,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });

    // Save to stored commissions
    const existing = this.getCommissions();
    this.saveCommissions([...commissions, ...existing]);

    // Update wallet pending earnings
    const wallet = this.getWalletBalance();
    wallet.pendingEarnings += l1Amount;
    wallet.totalEarnings += l1Amount;
    wallet.lifetimeEarnings += l1Amount;
    this.updateWalletBalance(wallet);

    if (isSupabaseConfigured && supabase) {
      commissions.forEach(c => {
        supabase.from('affiliate_wallet_ledger').insert({
          amount: c.commissionAmount,
          entry_type: 'COMMISSION',
          description: `Level ${c.level} commission earned for order #${orderId}`
        }).then(({ error }) => {
          if (error) console.warn('Supabase affiliate_wallet_ledger commission insert error:', error.message);
        });
      });
    }

    return commissions;
  }

  /**
   * Fraud Logging
   */
  static getFraudLogs(): FraudAuditLog[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.FRAUD_LOGS);
      return stored ? JSON.parse(stored) : INITIAL_FRAUD_LOGS;
    } catch {
      return INITIAL_FRAUD_LOGS;
    }
  }

  static logFraud(log: Omit<FraudAuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getFraudLogs();
    const newLog: FraudAuditLog = {
      ...log,
      id: `FRD-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    logs.unshift(newLog);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FRAUD_LOGS, JSON.stringify(logs));
  }

  /**
   * Leaderboard
   */
  static getLeaderboard(): LeaderboardUser[] {
    return INITIAL_LEADERBOARD;
  }

  /**
   * Calculates rank based on total sales volume
   */
  static calculateRank(totalSales: number, activeRefs: number): AffiliateRankCriteria {
    let currentRank = DEFAULT_RANKS_CRITERIA[0];
    for (const r of DEFAULT_RANKS_CRITERIA) {
      if (totalSales >= r.minSalesAmount && activeRefs >= r.minActiveReferrals) {
        currentRank = r;
      }
    }
    return currentRank;
  }

  /**
   * Generates CSV string for export
   */
  static exportCommissionsToCSV(): string {
    const comms = this.getCommissions();
    const headers = ['Commission ID', 'Order ID', 'Buyer Name', 'Order Amount (INR)', 'Level', 'Rate %', 'Earned Amount', 'Status', 'Date'];
    const rows = comms.map(c => [
      c.id,
      c.orderId,
      `"${c.buyerName}"`,
      c.orderAmount,
      c.level,
      c.ratePercent,
      c.commissionAmount,
      c.status,
      c.createdAt
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
