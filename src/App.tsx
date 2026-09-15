import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Category,
  CategoryLimit,
  Currency,
  BankAccount,
  LifeBaseline,
  LifeMilestone,
  TrackerType,
  Transaction,
  AuthUser,
} from './types';
import {
  DEFAULT_CATEGORY_LIMITS,
  DEFAULT_LIFE_BASELINE,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_LIFE_MILESTONES,
  generateInitialTransactions,
  generateInitialYearlyTransactions,
  USD_TO_INR,
} from './data/initialData';
import { Header } from './components/Header';
import { MonthlyTracker } from './components/MonthlyTracker';
import { YearlyTracker } from './components/YearlyTracker';
import { LifeTracker } from './components/LifeTracker';
import { AIAssistantModal } from './components/AIAssistantModal';
import { BankSyncModal } from './components/BankSyncModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ExportModal } from './components/ExportModal';
import { ResetModal } from './components/ResetModal';
import { UndoBanner } from './components/UndoBanner';
import { LoginPage } from './components/LoginPage';
import { ProfileModal } from './components/ProfileModal';

interface TrackerDataState {
  monthly: Transaction[];
  yearly: Transaction[];
}

interface UndoBackup {
  trackerData: TrackerDataState;
  categoryLimits: CategoryLimit[];
  lifeBaseline: LifeBaseline;
  lifeMilestones: LifeMilestone[];
  bankAccounts?: BankAccount[];
  timestamp: number;
  description: string;
}

export default function App() {
  // Authentication user state (persisted across sessions)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('budgetpal_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.email) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing stored user', e);
    }
    return null;
  });

  // Currency state (INR vs USD)
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('budgetpal_currency');
    return (saved as Currency) || 'INR';
  });

  // Section Tab state (Option 1: monthly, Option 2: yearly, Option 3: life)
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly' | 'life'>('monthly');

  // Independent Tracker Data (Monthly & Yearly operate separately without mixing)
  const [trackerData, setTrackerData] = useState<TrackerDataState>(() => {
    try {
      const saved = localStorage.getItem('budgetpal_tracker_data');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            monthly: Array.isArray(parsed.monthly) ? parsed.monthly : generateInitialTransactions(),
            yearly: Array.isArray(parsed.yearly) ? parsed.yearly : generateInitialYearlyTransactions(),
          };
        }
      }
    } catch (e) {
      console.error('Error parsing stored trackerData', e);
    }

    // Backward compatibility for existing users who only had budgetpal_transactions
    try {
      const oldMonthly = localStorage.getItem('budgetpal_transactions');
      if (oldMonthly && oldMonthly !== 'undefined' && oldMonthly !== 'null') {
        const parsed = JSON.parse(oldMonthly);
        if (Array.isArray(parsed)) {
          return {
            monthly: parsed,
            yearly: generateInitialYearlyTransactions(),
          };
        }
      }
    } catch (e) {
      console.error('Error parsing oldMonthly', e);
    }

    return {
      monthly: generateInitialTransactions(),
      yearly: generateInitialYearlyTransactions(),
    };
  });

  // Independent Life Tracker Baseline Finances
  const [lifeBaseline, setLifeBaseline] = useState<LifeBaseline>(() => {
    try {
      const saved = localStorage.getItem('budgetpal_life_baseline');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && typeof parsed.incomeINR === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing stored life baseline', e);
    }
    return DEFAULT_LIFE_BASELINE;
  });

  // Independent Life Tracker Milestones
  const [lifeMilestones, setLifeMilestones] = useState<LifeMilestone[]>(() => {
    try {
      const saved = localStorage.getItem('budgetpal_life_milestones');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing stored life milestones', e);
    }
    return INITIAL_LIFE_MILESTONES;
  });

  // Category Monthly Limits
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>(() => {
    try {
      const saved = localStorage.getItem('budgetpal_category_limits');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing stored limits', e);
    }
    return DEFAULT_CATEGORY_LIMITS;
  });

  // Linked Bank Accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('budgetpal_banks');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing stored banks', e);
    }
    return INITIAL_BANK_ACCOUNTS;
  });

  // Modals state
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'afford' | 'review' | 'paste'>('afford');
  const [isBankSyncOpen, setIsBankSyncOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<Category | undefined>();
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Undo / Backup state
  const [undoBackup, setUndoBackup] = useState<UndoBackup | null>(() => {
    try {
      const saved = localStorage.getItem('budgetpal_undo_backup');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing undo backup', e);
    }
    return null;
  });
  const [showUndoBanner, setShowUndoBanner] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);

  // Safe normalized arrays ensuring no undefined access anywhere in the app
  const safeMonthly = trackerData?.monthly ?? [];
  const safeYearly = trackerData?.yearly ?? [];

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('budgetpal_currency', currency);
  }, [currency]);

  useEffect(() => {
    if (trackerData && Array.isArray(trackerData.monthly) && Array.isArray(trackerData.yearly)) {
      localStorage.setItem('budgetpal_tracker_data', JSON.stringify(trackerData));
    }
  }, [trackerData]);

  useEffect(() => {
    localStorage.setItem('budgetpal_life_baseline', JSON.stringify(lifeBaseline));
  }, [lifeBaseline]);

  useEffect(() => {
    localStorage.setItem('budgetpal_life_milestones', JSON.stringify(lifeMilestones));
  }, [lifeMilestones]);

  useEffect(() => {
    localStorage.setItem('budgetpal_category_limits', JSON.stringify(categoryLimits));
  }, [categoryLimits]);

  useEffect(() => {
    localStorage.setItem('budgetpal_banks', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  // Check if any category has exceeded its limit in the current month (Monthly Tracker only)
  const hasOverage = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTxs = safeMonthly.filter(
      (t) => t.date.startsWith(currentYearMonth) && t.type === 'expense'
    );

    return categoryLimits.some((cl) => {
      const limit = currency === 'INR' ? cl.limitINR : cl.limitUSD;
      const spent = monthTxs
        .filter((t) => t.category === cl.category)
        .reduce((sum, t) => sum + (currency === 'INR' ? t.amountINR : t.amountUSD), 0);
      return spent > limit;
    });
  }, [safeMonthly, categoryLimits, currency]);

  // Handler: Update category limit
  const handleUpdateLimit = (category: Category, newLimit: number) => {
    setCategoryLimits((prev) =>
      prev.map((cl) => {
        if (cl.category !== category) return cl;
        if (currency === 'INR') {
          return {
            ...cl,
            limitINR: newLimit,
            limitUSD: Math.round(newLimit / USD_TO_INR),
          };
        } else {
          return {
            ...cl,
            limitUSD: newLimit,
            limitINR: Math.round(newLimit * USD_TO_INR),
          };
        }
      })
    );
  };

  // Handler: Add transaction routed to the specific tracker (Monthly vs Yearly)
  const handleAddTransaction = (
    tx: Omit<Transaction, 'id'>,
    targetTracker?: TrackerType
  ) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const destination = (targetTracker || activeTab) === 'yearly' ? 'yearly' : 'monthly';

    setTrackerData((prev) => {
      const curMonthly = prev?.monthly || [];
      const curYearly = prev?.yearly || [];
      return {
        monthly: destination === 'monthly' ? [newTx, ...curMonthly] : curMonthly,
        yearly: destination === 'yearly' ? [newTx, ...curYearly] : curYearly,
      };
    });
  };

  // Handler: Delete transaction from specific tracker
  const handleDeleteTransaction = (id: string, targetTracker: TrackerType = activeTab) => {
    const destination = targetTracker === 'yearly' ? 'yearly' : 'monthly';
    setTrackerData((prev) => {
      const curMonthly = prev?.monthly || [];
      const curYearly = prev?.yearly || [];
      return {
        monthly: destination === 'monthly' ? curMonthly.filter((t) => t.id !== id) : curMonthly,
        yearly: destination === 'yearly' ? curYearly.filter((t) => t.id !== id) : curYearly,
      };
    });
  };

  // Handler: Update transaction in specific tracker
  const handleUpdateTransaction = (
    updated: Transaction,
    targetTracker: TrackerType = activeTab
  ) => {
    const destination = targetTracker === 'yearly' ? 'yearly' : 'monthly';
    setTrackerData((prev) => {
      const curMonthly = prev?.monthly || [];
      const curYearly = prev?.yearly || [];
      return {
        monthly: destination === 'monthly' ? curMonthly.map((t) => (t.id === updated.id ? updated : t)) : curMonthly,
        yearly: destination === 'yearly' ? curYearly.map((t) => (t.id === updated.id ? updated : t)) : curYearly,
      };
    });
  };

  // Handler: Auto-fetch transactions from simulated bank sync
  const handleAutoFetchTransactions = (
    newTxs: Array<Omit<Transaction, 'id'>>,
    targetTracker: TrackerType = activeTab
  ) => {
    const destination = targetTracker === 'yearly' ? 'yearly' : 'monthly';
    const prepared = newTxs.map((t, idx) => ({
      ...t,
      id: `tx-sync-${Date.now()}-${idx}`,
    }));

    setTrackerData((prev) => {
      const curMonthly = prev?.monthly || [];
      const curYearly = prev?.yearly || [];
      return {
        monthly: destination === 'monthly' ? [...prepared, ...curMonthly] : curMonthly,
        yearly: destination === 'yearly' ? [...prepared, ...curYearly] : curYearly,
      };
    });

    // Mark bank accounts as synced
    setBankAccounts((prev) =>
      prev.map((bank) => ({
        ...bank,
        lastSynced: 'Just now',
      }))
    );
  };

  // Handler: Add new bank
  const handleAddBank = (bank: BankAccount) => {
    setBankAccounts((prev) => [...prev, bank]);
  };

  // Open Add Transaction modal with optional preselected category
  const handleOpenAdd = (cat?: Category) => {
    setPreselectedCategory(cat);
    setIsAddTxOpen(true);
  };

  // Open AI modal with mode
  const handleOpenAI = (mode: 'afford' | 'review' | 'paste' = 'afford') => {
    setAiMode(mode);
    setIsAIOpen(true);
  };

  // Handler: Reset budgets / transactions with scope selection & reliable undo
  const handleReset = (options: {
    scope: 'active' | 'all';
    resetBudgetsToZero: boolean;
    clearTransactions: boolean;
    resetMilestones?: boolean;
  }) => {
    // 1. Snapshot current state for reliable undo
    const backup: UndoBackup = {
      trackerData: {
        monthly: [...safeMonthly],
        yearly: [...safeYearly],
      },
      categoryLimits: [...categoryLimits],
      lifeBaseline: { ...lifeBaseline },
      lifeMilestones: [...lifeMilestones],
      bankAccounts: [...bankAccounts],
      timestamp: Date.now(),
      description:
        options.scope === 'all'
          ? 'Full Reset to 0 (All 3 Trackers Cleared)'
          : `Reset ${
              activeTab === 'monthly'
                ? 'Monthly Tracker'
                : activeTab === 'yearly'
                ? 'Yearly Tracker'
                : 'Life Tracker'
            } to 0`,
    };

    setUndoBackup(backup);
    localStorage.setItem('budgetpal_undo_backup', JSON.stringify(backup));

    // 2. Perform scoped or complete reset
    if (options.scope === 'active') {
      if (activeTab === 'monthly') {
        if (options.clearTransactions) {
          setTrackerData((prev) => ({
            monthly: [],
            yearly: prev?.yearly || [],
          }));
        }
        if (options.resetBudgetsToZero) {
          setCategoryLimits((prev) =>
            prev.map((cl) => ({
              ...cl,
              limitINR: 0,
              limitUSD: 0,
            }))
          );
        }
      } else if (activeTab === 'yearly') {
        if (options.clearTransactions) {
          setTrackerData((prev) => ({
            monthly: prev?.monthly || [],
            yearly: [],
          }));
        }
        if (options.resetBudgetsToZero) {
          localStorage.removeItem('budgetpal_yearly_custom_limits');
        }
      } else if (activeTab === 'life') {
        if (options.resetBudgetsToZero || options.clearTransactions) {
          setLifeBaseline({
            incomeINR: 0,
            incomeUSD: 0,
            expenseINR: 0,
            expenseUSD: 0,
          });
        }
        if (options.resetMilestones) {
          setLifeMilestones([]);
        }
      }
    } else {
      // Scope === 'all'
      if (options.clearTransactions) {
        setTrackerData({ monthly: [], yearly: [] });
      }
      if (options.resetBudgetsToZero) {
        setCategoryLimits((prev) =>
          prev.map((cl) => ({
            ...cl,
            limitINR: 0,
            limitUSD: 0,
          }))
        );
        localStorage.removeItem('budgetpal_yearly_custom_limits');
        setLifeBaseline({
          incomeINR: 0,
          incomeUSD: 0,
          expenseINR: 0,
          expenseUSD: 0,
        });
      }
      if (options.resetMilestones) {
        setLifeMilestones([]);
      }
    }

    // 3. Trigger floating undo banner
    setShowUndoBanner(true);
  };

  // Handler: Undo the reset action and restore full state safely
  const handleUndoReset = () => {
    if (!undoBackup) return;

    if (
      undoBackup.trackerData &&
      Array.isArray(undoBackup.trackerData.monthly) &&
      Array.isArray(undoBackup.trackerData.yearly)
    ) {
      setTrackerData({
        monthly: [...undoBackup.trackerData.monthly],
        yearly: [...undoBackup.trackerData.yearly],
      });
    } else if (Array.isArray((undoBackup as unknown as { transactions: Transaction[] }).transactions)) {
      // Legacy backup format support
      setTrackerData({
        monthly: [...(undoBackup as unknown as { transactions: Transaction[] }).transactions],
        yearly: generateInitialYearlyTransactions(),
      });
    } else {
      // Failsafe so trackerData is never undefined
      setTrackerData({
        monthly: generateInitialTransactions(),
        yearly: generateInitialYearlyTransactions(),
      });
    }

    if (undoBackup.categoryLimits && Array.isArray(undoBackup.categoryLimits)) {
      setCategoryLimits(undoBackup.categoryLimits);
    }
    if (undoBackup.lifeBaseline && typeof undoBackup.lifeBaseline === 'object') {
      setLifeBaseline(undoBackup.lifeBaseline);
    }
    if (undoBackup.lifeMilestones && Array.isArray(undoBackup.lifeMilestones)) {
      setLifeMilestones(undoBackup.lifeMilestones);
    }
    if (undoBackup.bankAccounts && Array.isArray(undoBackup.bankAccounts)) {
      setBankAccounts(undoBackup.bankAccounts);
    }

    setShowUndoBanner(false);
    setShowRestoredToast(true);
    setTimeout(() => setShowRestoredToast(false), 4500);
  };

  // Handler: Restore demo sample data
  const handleRestoreDemoData = () => {
    const backup: UndoBackup = {
      trackerData: {
        monthly: [...safeMonthly],
        yearly: [...safeYearly],
      },
      categoryLimits: [...categoryLimits],
      lifeBaseline: { ...lifeBaseline },
      lifeMilestones: [...lifeMilestones],
      bankAccounts: [...bankAccounts],
      timestamp: Date.now(),
      description: 'Data prior to Demo Sample Restore',
    };
    setUndoBackup(backup);
    localStorage.setItem('budgetpal_undo_backup', JSON.stringify(backup));

    setTrackerData({
      monthly: generateInitialTransactions(),
      yearly: generateInitialYearlyTransactions(),
    });
    setCategoryLimits(DEFAULT_CATEGORY_LIMITS);
    setLifeBaseline(DEFAULT_LIFE_BASELINE);
    setLifeMilestones(INITIAL_LIFE_MILESTONES);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    localStorage.removeItem('budgetpal_yearly_custom_limits');

    setShowUndoBanner(true);
  };

  // Auth Handlers
  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('budgetpal_user', JSON.stringify(user));
  };

  const handleSignOut = () => {
    localStorage.removeItem('budgetpal_user');
    setCurrentUser(null);
  };

  const handleUpdateUser = (updatedUser: AuthUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('budgetpal_user', JSON.stringify(updatedUser));
  };

  // If user is not logged in, render the login page first
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900 relative">
      {/* Header with Navigation & Quick Actions */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onOpenAI={handleOpenAI}
        onOpenBankSync={() => setIsBankSyncOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAddTransaction={() => handleOpenAdd()}
        onOpenReset={() => setIsResetOpen(true)}
        onUndoReset={handleUndoReset}
        hasUndoBackup={Boolean(undoBackup)}
        bankCount={bankAccounts.length}
        hasOverage={hasOverage}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Sections - Runs Separately */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* SECTION 1: Monthly Expense Tracker (Independent Monthly Data) */}
        {activeTab === 'monthly' && (
          <MonthlyTracker
            transactions={safeMonthly}
            categoryLimits={categoryLimits}
            currency={currency}
            onUpdateLimit={handleUpdateLimit}
            onDeleteTransaction={(id) => handleDeleteTransaction(id, 'monthly')}
            onOpenAddTransaction={handleOpenAdd}
            onOpenAI={handleOpenAI}
            onOpenReset={() => setIsResetOpen(true)}
            onUndoReset={handleUndoReset}
            hasUndoBackup={Boolean(undoBackup)}
          />
        )}

        {/* SECTION 2: Yearly Expense Tracker (Independent Annual Data) */}
        {activeTab === 'yearly' && (
          <YearlyTracker
            transactions={safeYearly}
            categoryLimits={categoryLimits}
            currency={currency}
            onOpenAI={handleOpenAI}
            onOpenAddTransaction={handleOpenAdd}
            onDeleteTransaction={(id) => handleDeleteTransaction(id, 'yearly')}
            onOpenReset={() => setIsResetOpen(true)}
            onUndoReset={handleUndoReset}
            hasUndoBackup={Boolean(undoBackup)}
          />
        )}

        {/* SECTION 3: Overall Life Expense Tracker (Independent 1-60 Years Data) */}
        {activeTab === 'life' && (
          <LifeTracker
            baseline={lifeBaseline}
            onUpdateBaseline={setLifeBaseline}
            milestones={lifeMilestones}
            onUpdateMilestones={setLifeMilestones}
            currency={currency}
            onOpenAI={handleOpenAI}
            onOpenReset={() => setIsResetOpen(true)}
            onUndoReset={handleUndoReset}
            hasUndoBackup={Boolean(undoBackup)}
          />
        )}
      </main>

      {/* Floating Undo Restored Toast */}
      {showRestoredToast && (
        <div
          id="toast-restored-success"
          className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>All data successfully restored to previous state!</span>
        </div>
      )}

      {/* Floating Undo Banner */}
      <UndoBanner
        isOpen={showUndoBanner && Boolean(undoBackup)}
        onUndo={handleUndoReset}
        onDismiss={() => setShowUndoBanner(false)}
        backupDescription={undoBackup?.description}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-700">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 font-outfit">BudgetPal</span>
            <span>•</span>
            <span>3 Independent Trackers: Monthly, Yearly & Life</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <span>
              Currency: <b>{currency} ({currency === 'INR' ? '₹' : '$'})</b>
            </span>
            <span>•</span>
            <span>
              Bank Feeds: <b>{bankAccounts.length} Connected</b>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        currency={currency}
        activeTab={activeTab}
        monthlyTransactionsCount={safeMonthly.length}
        yearlyTransactionsCount={safeYearly.length}
        hasUndoBackup={Boolean(undoBackup)}
        undoBackupTime={undoBackup?.timestamp}
        undoBackupCount={
          activeTab === 'monthly'
            ? safeMonthly.length
            : activeTab === 'yearly'
            ? safeYearly.length
            : 1
        }
        onReset={handleReset}
        onRestoreDemoData={handleRestoreDemoData}
        onUndoReset={handleUndoReset}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        currency={currency}
        categoryLimits={categoryLimits}
        transactions={activeTab === 'yearly' ? safeYearly : safeMonthly}
        initialMode={aiMode}
        trackerType={activeTab}
        onAddTransaction={handleAddTransaction}
      />

      <BankSyncModal
        isOpen={isBankSyncOpen}
        onClose={() => setIsBankSyncOpen(false)}
        bankAccounts={bankAccounts}
        currency={currency}
        onSyncAccounts={() => {}}
        onAddBank={handleAddBank}
        onAutoFetchTransactions={handleAutoFetchTransactions}
      />

      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        currency={currency}
        categoryLimits={categoryLimits}
        bankAccounts={bankAccounts}
        preselectedCategory={preselectedCategory}
        onAddTransaction={handleAddTransaction}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        monthlyTransactions={safeMonthly}
        yearlyTransactions={safeYearly}
        currency={currency}
        activeTab={activeTab}
      />

      {currentUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
          onSignOut={handleSignOut}
          currentCurrency={currency}
          onCurrencyChange={setCurrency}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenReset={() => setIsResetOpen(true)}
        />
      )}
    </div>
  );
}
