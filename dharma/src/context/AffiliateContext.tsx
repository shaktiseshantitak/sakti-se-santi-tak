import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AffiliateRankCriteria,
  AffiliateDashboardStats,
  CommissionRecord,
  CommissionSettings,
  FraudAuditLog,
  LeaderboardUser,
  TeamMember,
  WalletBalance,
  WithdrawalRequest
} from '../types/affiliate';
import { AffiliateService, DEFAULT_RANKS_CRITERIA } from '../services/affiliateService';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AffiliateContextType {
  referralCode: string;
  referralUrl: string;
  wallet: WalletBalance;
  stats: AffiliateDashboardStats;
  team: TeamMember[];
  commissions: CommissionRecord[];
  withdrawals: WithdrawalRequest[];
  leaderboard: LeaderboardUser[];
  fraudLogs: FraudAuditLog[];
  settings: CommissionSettings;
  currentRank: AffiliateRankCriteria;
  nextRank: AffiliateRankCriteria | null;
  
  // Actions
  createWithdrawal: (amount: number, method: 'upi' | 'bank', details: WithdrawalRequest['details']) => Promise<{ success: boolean; message: string }>;
  processOrderCommission: (orderId: string, orderAmount: number, buyerName: string, buyerEmail?: string, couponCode?: string) => void;
  updateSettings: (newSettings: CommissionSettings) => void;
  approveWithdrawal: (id: string, transactionId?: string, note?: string) => void;
  rejectWithdrawal: (id: string, note?: string) => void;
  manualWalletAdjustment: (amount: number, type: 'credit' | 'debit', reason: string) => void;
  refreshData: () => void;
  exportCSV: () => void;
}

const AffiliateContext = createContext<AffiliateContextType | undefined>(undefined);

export const AffiliateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const referralCode = AffiliateService.getUserReferralCode(user?.email);
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;

  const [wallet, setWallet] = useState<WalletBalance>(() => AffiliateService.getWalletBalance());
  const [stats, setStats] = useState<AffiliateDashboardStats>(() => AffiliateService.getDashboardStats());
  const [team, setTeam] = useState<TeamMember[]>(() => AffiliateService.getTeamMembers());
  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => AffiliateService.getCommissions());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => AffiliateService.getWithdrawalRequests());
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => AffiliateService.getLeaderboard());
  const [fraudLogs, setFraudLogs] = useState<FraudAuditLog[]>(() => AffiliateService.getFraudLogs());
  const [settings, setSettings] = useState<CommissionSettings>(() => AffiliateService.getSettings());

  // Rank calculation
  const currentRank = AffiliateService.calculateRank(wallet.totalEarnings, team.length);
  const currentRankIndex = DEFAULT_RANKS_CRITERIA.findIndex(r => r.rank === currentRank.rank);
  const nextRank = currentRankIndex < DEFAULT_RANKS_CRITERIA.length - 1 ? DEFAULT_RANKS_CRITERIA[currentRankIndex + 1] : null;

  // URL parameter detection for referral code tracking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('aff');
    if (ref) {
      const wasNewClick = AffiliateService.handleReferralClick(ref, user?.email);
      // Record a REAL click in the database (see migration 010,
      // record_affiliate_click) — previously "clicks" were purely a fake
      // localStorage-only number shown on the dashboard, never an actual
      // count of anything that happened. This works for logged-out visitors
      // too, since it's a public RPC.
      if (wasNewClick && isSupabaseConfigured && supabase) {
        supabase.rpc('record_affiliate_click', { p_referral_code: ref.toUpperCase().trim() })
          .then(({ error }) => {
            if (error) console.warn('record_affiliate_click error:', error.message);
          });
      }
    }
  }, [user?.email]);

  const refreshData = () => {
    if (isSupabaseConfigured && supabase && user?.id) {
      // Sync affiliate account
      supabase.from('affiliate_accounts').select('*').eq('user_id', user.id).maybeSingle().then(({ data: accData, error }) => {
        if (!accData && !error) {
          // Create account row if missing. referred_by_code links this new
          // affiliate to whoever's referral link brought them here (if any)
          // — this is what makes the 3-level team structure real instead of
          // fabricated: without recording this at account-creation time,
          // there would be no way to ever reconstruct who referred whom.
          // Guard against self-referral (defense in depth alongside the
          // check already in AffiliateService.handleReferralClick).
          const activeRef = AffiliateService.getActiveReferralCode();
          supabase.from('affiliate_accounts').insert({
            user_id: user.id,
            referral_code: referralCode,
            referred_by_code: (activeRef && activeRef !== referralCode) ? activeRef : null,
            status: 'active'
          }).then(() => {});
        }
      });

      // Load withdrawals from Supabase
      supabase.from('affiliate_withdrawals').select('*').order('created_at', { ascending: false }).then(({ data: wData }) => {
        if (wData && wData.length > 0) {
          const mapped: WithdrawalRequest[] = wData.map((w: any) => ({
            id: w.id,
            userId: w.affiliate_user_id,
            userName: 'Affiliate Partner',
            amount: Number(w.amount || 0),
            method: w.payment_method === 'bank' ? 'bank' : 'upi',
            details: w.payment_details || {},
            status: (w.status || 'PENDING').toLowerCase() as any,
            transactionId: w.transaction_reference || w.transaction_id,
            adminNote: w.admin_note,
            requestedAt: w.created_at ? w.created_at.replace('T', ' ').slice(0, 16) : new Date().toISOString().slice(0, 16),
            processedAt: w.processed_at ? w.processed_at.replace('T', ' ').slice(0, 16) : undefined
          }));
          setWithdrawals(mapped);
        }
      });

      // Load ledger from Supabase
      supabase.from('affiliate_wallet_ledger').select('*').order('created_at', { ascending: false }).then(({ data: lData }) => {
        if (lData && lData.length > 0) {
          let total = 0;
          let withdrawable = 0;
          let pending = 0;

          lData.forEach((row: any) => {
            const amt = Number(row.amount || 0);
            const entryType = (row.entry_type || row.transaction_type || '').toUpperCase();
            if (entryType === 'COMMISSION' || entryType === 'COMMISSION_EARNED' || entryType === 'ADMIN_CREDIT') {
              total += Math.abs(amt);
              withdrawable += Math.abs(amt);
            } else if (entryType === 'WITHDRAWAL' || entryType === 'WITHDRAWAL_PAYOUT') {
              withdrawable -= Math.abs(amt);
            } else if (entryType === 'COMMISSION_PENDING') {
              pending += Math.abs(amt);
            }
          });

          setWallet({
            totalEarnings: Math.max(0, total),
            pendingEarnings: Math.max(0, pending),
            withdrawableBalance: Math.max(0, withdrawable),
            lifetimeEarnings: Math.max(0, total)
          });
        }
      });

      // Real dashboard stats (clicks, orders, conversion rate) — computed
      // from actual affiliate_clicks and orders rows via migration 010's
      // get_affiliate_dashboard RPC, not the old localStorage-only numbers.
      supabase.rpc('get_affiliate_dashboard', { p_user_id: user.id }).then(({ data, error }) => {
        if (!error && data && !data.error) {
          setStats({
            totalClicks: Number(data.totalClicks || 0),
            // True unique-visitor deduplication would need session/cookie
            // tracking, which affiliate_clicks doesn't do (each row is one
            // click, not one visitor) — using total clicks as a reasonable
            // stand-in rather than inventing a fake number.
            uniqueVisitors: Number(data.totalClicks || 0),
            totalSignups: Number(data.teamSize || 0),
            totalOrders: Number(data.totalOrders || 0),
            conversionRate: Number(data.conversionRate || 0),
            totalIncome: Number(data.totalEarnings || 0),
            monthlyIncome: Number(data.totalEarnings || 0),
          });
        }
      });

      // Real 3-level team — walked from actual referred_by_code chains via
      // migration 010's get_affiliate_team RPC, not fabricated demo members.
      supabase.rpc('get_affiliate_team', { p_user_id: user.id }).then(({ data, error }) => {
        if (!error && Array.isArray(data)) {
          const mappedTeam: TeamMember[] = data.map((row: any) => ({
            id: row.member_user_id,
            name: row.member_name,
            email: row.member_email || '',
            level: row.level,
            joinDate: row.joined_at ? String(row.joined_at).split('T')[0] : '',
            totalSales: 0,
            totalCommissionsEarned: 0,
            status: 'active',
          }));
          setTeam(mappedTeam);
        }
      });

      // Real per-order commission history — read directly from
      // affiliate_wallet_ledger (RLS already lets an affiliate read their
      // own rows: "Affiliates view own ledger"). Previously this tab
      // called AffiliateService.getCommissions(), which only ever read
      // localStorage and fell back to hardcoded sample rows ('Dr. Harihar
      // Trivedi', 'COMM-8801'...) — real DB-backed activity never showed
      // up here at all, which is exactly the "dummy data even after
      // login" bug. Buyer identity is intentionally NOT shown (the
      // referred customer's name isn't the affiliate's data to see);
      // migration 010's credit_affiliate_commission deliberately keeps
      // the description limited to the level and order number.
      supabase
        .from('affiliate_wallet_ledger')
        .select('*')
        .eq('affiliate_user_id', user.id)
        .eq('entry_type', 'COMMISSION')
        .order('created_at', { ascending: false })
        .then(({ data: ledgerRows, error }) => {
          if (!error && Array.isArray(ledgerRows)) {
            const levelRatePercent: Record<number, number> = { 1: 10, 2: 5, 3: 2.5 };
            const mappedCommissions: CommissionRecord[] = ledgerRows.map((row: any) => {
              const levelMatch = /Level (\d+)/.exec(row.description || '');
              const level = levelMatch ? Number(levelMatch[1]) : 1;
              const orderMatch = /order\s+(\S+)/.exec(row.description || '');
              return {
                id: row.id,
                orderId: orderMatch ? orderMatch[1] : (row.reference_order_id || ''),
                buyerName: 'Referred Customer',
                orderAmount: 0,
                level,
                ratePercent: levelRatePercent[level] ?? 0,
                commissionAmount: Number(row.amount || 0),
                status: 'approved',
                createdAt: row.created_at ? row.created_at.replace('T', ' ').slice(0, 16) : '',
              };
            });
            setCommissions(mappedCommissions);
          }
        });
    }

    // Always keep local state fresh
    setWallet(prev => (isSupabaseConfigured ? prev : AffiliateService.getWalletBalance()));
    if (!isSupabaseConfigured) {
      setStats(AffiliateService.getDashboardStats());
      setTeam(AffiliateService.getTeamMembers());
    }
    setCommissions(AffiliateService.getCommissions());
    if (!isSupabaseConfigured) setWithdrawals(AffiliateService.getWithdrawalRequests());
    setFraudLogs(AffiliateService.getFraudLogs());
    setSettings(AffiliateService.getSettings());
  };

  useEffect(() => {
    refreshData();
  }, [user?.id]);

  const createWithdrawal = async (amount: number, method: 'upi' | 'bank', details: WithdrawalRequest['details']) => {
    // NOTE: the actual database insert (with server-enforced balance validation)
    // now happens inside AffiliateService.createWithdrawalRequest itself — a
    // second, separate insert used to happen here too, using column names
    // (`payment_details`) that don't exist on affiliate_withdrawals, which meant
    // it always failed while silently duplicating the request attempt. Removed.
    const res = await AffiliateService.createWithdrawalRequest(
      user?.id || 'user-default',
      user?.fullName || 'Seeker',
      amount,
      method,
      details
    );

    refreshData();
    return res;
  };

  const processOrderCommission = (
    orderId: string,
    orderAmount: number,
    buyerName: string,
    buyerEmail?: string,
    couponCode?: string
  ) => {
    AffiliateService.processOrderCommission(orderId, orderAmount, buyerName, buyerEmail, couponCode);

    if (isSupabaseConfigured && supabase && user?.id) {
      supabase.from('affiliate_wallet_ledger').insert({
        affiliate_user_id: user.id,
        transaction_type: 'commission_earned',
        amount: Math.round(orderAmount * 0.1),
        order_id: orderId,
        description: `Commission from order #${orderId}`
      }).then(({ error }) => {
        if (error) console.warn('Supabase ledger insert error:', error.message);
      });
    }

    refreshData();
  };

  const updateSettings = (newSettings: CommissionSettings) => {
    AffiliateService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const approveWithdrawal = (id: string, transactionId?: string, note?: string) => {
    const list = isSupabaseConfigured ? withdrawals : AffiliateService.getWithdrawalRequests();
    const item = list.find(w => w.id === id);
    if (item && item.status === 'pending') {
      const processedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const txnId = transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      const adminNote = note || 'Approved and paid out successfully.';

      if (isSupabaseConfigured && supabase) {
        supabase.from('affiliate_withdrawals').update({
          status: 'paid',
          processed_at: new Date().toISOString(),
          transaction_id: txnId,
          admin_note: adminNote
        }).eq('id', id).then(({ error }) => {
          if (error) console.warn('Supabase withdrawal update error:', error.message);
        });
      } else {
        item.status = 'paid';
        item.processedAt = processedAt;
        item.transactionId = txnId;
        item.adminNote = adminNote;
        AffiliateService.saveWithdrawalRequests(list);
      }
      refreshData();
    }
  };

  const rejectWithdrawal = (id: string, note?: string) => {
    const list = isSupabaseConfigured ? withdrawals : AffiliateService.getWithdrawalRequests();
    const item = list.find(w => w.id === id);
    if (item && item.status === 'pending') {
      const processedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const adminNote = note || 'Rejected by administrator.';

      if (isSupabaseConfigured && supabase) {
        supabase.from('affiliate_withdrawals').update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          admin_note: adminNote
        }).eq('id', id).then(({ error }) => {
          if (error) console.warn('Supabase withdrawal update error:', error.message);
        });
      } else {
        item.status = 'rejected';
        item.processedAt = processedAt;
        item.adminNote = adminNote;

        // Refund balance back
        const w = AffiliateService.getWalletBalance();
        w.withdrawableBalance += item.amount;
        AffiliateService.updateWalletBalance(w);
        AffiliateService.saveWithdrawalRequests(list);
      }
      refreshData();
    }
  };

  const manualWalletAdjustment = (amount: number, type: 'credit' | 'debit', reason: string) => {
    if (isSupabaseConfigured && supabase && user?.id) {
      supabase.from('affiliate_wallet_ledger').insert({
        affiliate_user_id: user.id,
        transaction_type: type === 'credit' ? 'admin_credit' : 'withdrawal_payout',
        amount: type === 'credit' ? amount : -amount,
        description: `Manual Wallet ${type.toUpperCase()}: ₹${amount} - ${reason}`
      }).then(({ error }) => {
        if (error) console.warn('Supabase wallet adjustment error:', error.message);
      });
    } else {
      const w = AffiliateService.getWalletBalance();
      if (type === 'credit') {
        w.withdrawableBalance += amount;
        w.totalEarnings += amount;
        w.lifetimeEarnings += amount;
      } else {
        w.withdrawableBalance = Math.max(0, w.withdrawableBalance - amount);
      }
      AffiliateService.updateWalletBalance(w);
    }

    AffiliateService.logFraud({
      userId: user?.id || 'admin',
      userName: user?.fullName || 'Admin',
      ipAddress: '127.0.0.1',
      eventType: 'admin_flagged',
      severity: 'low',
      details: `Manual Wallet ${type.toUpperCase()}: ₹${amount} - Reason: ${reason}`
    });

    refreshData();
  };

  const exportCSV = () => {
    const csvContent = AffiliateService.exportCommissionsToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Dharma_Affiliate_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AffiliateContext.Provider
      value={{
        referralCode,
        referralUrl,
        wallet,
        stats,
        team,
        commissions,
        withdrawals,
        leaderboard,
        fraudLogs,
        settings,
        currentRank,
        nextRank,
        createWithdrawal,
        processOrderCommission,
        updateSettings,
        approveWithdrawal,
        rejectWithdrawal,
        manualWalletAdjustment,
        refreshData,
        exportCSV,
      }}
    >
      {children}
    </AffiliateContext.Provider>
  );
};

export const useAffiliate = () => {
  const context = useContext(AffiliateContext);
  if (!context) {
    throw new Error('useAffiliate must be used within an AffiliateProvider');
  }
  return context;
};
