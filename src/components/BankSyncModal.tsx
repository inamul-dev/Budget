import React, { useState } from 'react';
import {
  Building2,
  X,
  RefreshCw,
  CheckCircle2,
  Plus,
  ShieldCheck,
  CreditCard,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';
import { BankAccount, Currency, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SAMPLE_SIMULATED_FEED_TRANSACTIONS } from '../data/initialData';

interface BankSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
  currency: Currency;
  onSyncAccounts: () => void;
  onAddBank: (bank: BankAccount) => void;
  onAutoFetchTransactions: (newTxs: Array<Omit<Transaction, 'id'>>) => void;
}

export const BankSyncModal: React.FC<BankSyncModalProps> = ({
  isOpen,
  onClose,
  bankAccounts,
  currency,
  onSyncAccounts,
  onAddBank,
  onAutoFetchTransactions,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [showAddBankForm, setShowAddBankForm] = useState(false);

  // New bank form
  const [bankName, setBankName] = useState('ICICI Bank Wealth');
  const [accountNumber, setAccountNumber] = useState('5541');
  const [initialBalance, setInitialBalance] = useState('50000');

  if (!isOpen) return null;

  // Simulate real-time bank sync & feed ingestion
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setSyncStatusMsg('Connecting to Open Banking API Gateway...');

    setTimeout(() => {
      setSyncStatusMsg('Encrypted connection verified. Fetching cleared transactions...');
      setTimeout(() => {
        // Pick 2 random sample transactions from sample feed
        const sample1 = SAMPLE_SIMULATED_FEED_TRANSACTIONS[Math.floor(Math.random() * SAMPLE_SIMULATED_FEED_TRANSACTIONS.length)];
        const sample2 = SAMPLE_SIMULATED_FEED_TRANSACTIONS[Math.floor(Math.random() * SAMPLE_SIMULATED_FEED_TRANSACTIONS.length)];

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        onAutoFetchTransactions([
          { ...sample1, date: dateStr },
          { ...sample2, date: dateStr },
        ]);

        onSyncAccounts();
        setIsSyncing(false);
        setSyncStatusMsg('✅ 2 new transactions auto-fetched and balances refreshed!');
        setTimeout(() => setSyncStatusMsg(null), 4000);
      }, 1200);
    }, 1000);
  };

  const handleAddNewBank = (e: React.FormEvent) => {
    e.preventDefault();
    const balNum = parseFloat(initialBalance) || 10000;
    const isINR = currency === 'INR';

    const newAccount: BankAccount = {
      id: `bank-${Date.now()}`,
      name: bankName,
      accountNumber: `•••• ${accountNumber.slice(-4) || '1234'}`,
      balanceINR: isINR ? balNum : balNum * 85,
      balanceUSD: isINR ? balNum / 85 : balNum,
      bankLogo: '🏦',
      color: 'from-emerald-700 to-teal-800',
      lastSynced: 'Just now',
      status: 'synced',
    };

    onAddBank(newAccount);
    setShowAddBankForm(false);
  };

  const totalBankBalance = bankAccounts.reduce((sum, b) => {
    return sum + (currency === 'INR' ? b.balanceINR : b.balanceUSD);
  }, 0);

  return (
    <div
      id="bank-sync-modal-backdrop"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
    >
      <div
        id="bank-sync-modal-content"
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto relative space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-outfit">
                Linked Bank Accounts & Sync
              </h3>
              <p className="text-xs text-slate-700">
                Automatic transaction ingestion & balance monitoring
              </p>
            </div>
          </div>

          <button
            id="btn-close-bank-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security badge & Total balance */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit Encrypted Bank Sync API</span>
          </div>
          <div>
            <span className="text-xs text-slate-700 font-medium">Total Liquid Balance: </span>
            <span className="text-base font-black text-slate-900 font-outfit">
              {formatCurrency(totalBankBalance, currency)}
            </span>
          </div>
        </div>

        {/* Sync Trigger Action */}
        <div className="flex items-center justify-between gap-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
          <div>
            <h4 className="text-xs font-bold text-blue-900">
              Real-Time Bank Feeds
            </h4>
            <p className="text-[11px] text-blue-800">
              One-click auto-fetch clears and logs new charges automatically
            </p>
          </div>

          <button
            id="btn-trigger-bank-sync"
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Banks Now'}</span>
          </button>
        </div>

        {/* Sync status toast/message */}
        {syncStatusMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-pulse text-center">
            {syncStatusMsg}
          </div>
        )}

        {/* Connected Bank Cards */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Connected Institutions ({bankAccounts.length})</span>
            <button
              id="btn-show-add-bank-form"
              type="button"
              onClick={() => setShowAddBankForm(!showAddBankForm)}
              className="text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              {showAddBankForm ? 'Cancel' : '+ Link Another Bank'}
            </button>
          </div>

          {showAddBankForm && (
            <form onSubmit={handleAddNewBank} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h5 className="text-xs font-bold text-slate-900">Link Bank Account</h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Chase Bank">Chase Bank</option>
                    <option value="Bank of America">Bank of America</option>
                    <option value="Wells Fargo">Wells Fargo</option>
                    <option value="Citibank">Citibank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 4821"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Starting Balance ({currency})
                </label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddBankForm(false)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  Link Account
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {bankAccounts.map((account) => {
              const bal = currency === 'INR' ? account.balanceINR : account.balanceUSD;

              return (
                <div
                  key={account.id}
                  id={`bank-row-${account.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-1.5 bg-slate-100 rounded-xl">
                      {account.bankLogo}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {account.name}
                      </h4>
                      <p className="text-[10px] text-slate-700">
                        Acct: {account.accountNumber} • Synced {account.lastSynced}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 font-outfit">
                      {formatCurrency(bal, currency)}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Live Sync</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
