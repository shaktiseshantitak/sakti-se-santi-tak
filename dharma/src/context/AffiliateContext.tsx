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
      AffiliateService.handleReferralClick(ref, user?.email);
    }
  }, [user?.email]);

  const refreshData = () => {
    if (isSupabaseConfigured && supabase && user?.id) {
      // Sync affiliate account
      supabase.from('affiliate_accounts').select('*').eq('user_id', user.id).maybeSingle().then(({ data: accData, error }) => {
        if (!accData && !error) {
          // Create account row if missing
          supabase.from('affiliate_accounts').insert({
            user_id: user.id,
            referral_code: referralCode,
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
    }

    // Always keep local state fresh
    setWallet(prev => (isSupabaseConfigured ? prev : AffiliateService.getWalletBalance()));
    setStats(AffiliateService.getDashboardStats());
    setTeam(AffiliateService.getTeamMembers());
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
