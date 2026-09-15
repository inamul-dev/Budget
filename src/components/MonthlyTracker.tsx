import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import { Category, CategoryLimit, Currency, Transaction } from '../types';
import { formatCurrency, getConvertedAmount } from '../utils/formatters';
import { DEFAULT_CATEGORY_LIMITS } from '../data/initialData';
import { ResetAllCategoriesModal } from './ResetAllCategoriesModal';

interface MonthlyTrackerProps {
  transactions: Transaction[];
  categoryLimits: CategoryLimit[];
  currency: Currency;
  onUpdateLimit: (category: Category, newLimit: number) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddTransaction: (preselectedCategory?: Category) => void;
  onOpenAI: (mode: 'afford' | 'review') => void;
  onOpenReset?: () => void;
  onUndoReset?: () => void;
  hasUndoBackup?: boolean;
}

export const MonthlyTracker: React.FC<MonthlyTrackerProps> = ({
  transactions,
  categoryLimits,
  currency,
  onUpdateLimit,
  onDeleteTransaction,
  onOpenAddTransaction,
  onOpenAI,
  onOpenReset,
  onUndoReset,
  hasUndoBackup = false,
}) => {
  // Current active date view (defaults to today's month/year)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');
  const [isResetCategoriesOpen, setIsResetCategoriesOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthStr = String(month + 1).padStart(2, '0');
  const yearMonthPrefix = `${year}-${monthStr}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Filter transactions for this month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(yearMonthPrefix));
  }, [transactions, yearMonthPrefix]);

  // Aggregate stats
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + getConvertedAmount(t, currency), 0);
  }, [monthTransactions, currency]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + getConvertedAmount(t, currency), 0);
  }, [monthTransactions, currency]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category spending aggregation
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    categoryLimits.forEach((cl) => {
      map[cl.category] = 0;
    });

    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const amt = getConvertedAmount(t, currency);
        map[t.category] = (map[t.category] || 0) + amt;
      });

    return map;
  }, [monthTransactions, categoryLimits, currency]);

  // Check over-budget alerts
  const overBudgetAlerts = useMemo(() => {
    return categoryLimits
      .map((cl) => {
        const spent = categorySpentMap[cl.category] || 0;
        const limit = currency === 'INR' ? cl.limitINR : cl.limitUSD;
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;
        const isExceeded = spent > limit;
        const isClose = !isExceeded && percentage >= 80;
        const overAmount = spent - limit;

        return {
          ...cl,
          limit,
          spent,
          percentage,
          isExceeded,
          isClose,
          overAmount,
        };
      })
      .filter((item) => item.isExceeded || item.isClose);
  }, [categoryLimits, categorySpentMap, currency]);

  // Filtered transactions for the list
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.bankAccountName && t.bankAccountName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [monthTransactions, searchQuery, selectedCategoryFilter]);

  // Daily spending aggregation for the visual chart
  const dailySpending = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ day: number; expense: number; income: number }> = [];

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, expense: 0, income: 0 });
    }

    monthTransactions.forEach((t) => {
      const dayNum = parseInt(t.date.split('-')[2], 10);
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        const amt = getConvertedAmount(t, currency);
        if (t.type === 'expense') {
          days[dayNum - 1].expense += amt;
        } else {
          days[dayNum - 1].income += amt;
        }
      }
    });

    return days;
  }, [monthTransactions, year, month, currency]);

  const maxDailyExpense = Math.max(...dailySpending.map((d) => d.expense), 100);

  // Handle inline limit save
  const handleSaveLimit = (cat: Category) => {
    const val = parseFloat(editLimitValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateLimit(cat, val);
    }
    setEditingCategory(null);
    setEditLimitValue('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Separation Banner */}
      <div
        id="monthly-independent-banner"
        className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            📅
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-950 font-outfit flex items-center gap-2">
              <span>Monthly Tracker (Runs Separately)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                Independent Monthly Mode
              </span>
            </h3>
            <p className="text-xs text-emerald-800/80">
              For monthly users: Track daily expenses, monthly bills, and category limits. Does not mix with Yearly or Life Tracker.
            </p>
          </div>
        </div>

        {hasUndoBackup && onUndoReset && (
          <button
            type="button"
            onClick={onUndoReset}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Recent Reset</span>
          </button>
        )}
      </div>

      {/* Month Navigator Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="btn-prev-month"
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-1 text-base sm:text-lg font-bold text-slate-900 font-outfit min-w-[160px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              id="btn-next-month"
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            id="btn-today-month"
            type="button"
            onClick={handleCurrentMonth}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Quick Add Expense & Ask AI */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-quick-ai-review"
            type="button"
            onClick={() => onOpenAI('review')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Monthly AI Review</span>
          </button>

          <button
            id="btn-monthly-add-expense"
            type="button"
            onClick={() => onOpenAddTransaction()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* OVER-BUDGET NOTIFICATION BANNER */}
      {overBudgetAlerts.length > 0 && (
        <div
          id="over-budget-notification-banner"
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  <span>Category Limit Notice!</span>
                  <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                    {overBudgetAlerts.filter((a) => a.isExceeded).length} Over Limit
                  </span>
                </h2>
                <div className="mt-1 flex flex-wrap gap-2 text-xs sm:text-sm text-amber-800">
                  {overBudgetAlerts.map((alert) => (
                    <span
                      key={alert.category}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold ${
                        alert.isExceeded
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <span>{alert.emoji}</span>
                      <span>{alert.category}:</span>
                      {alert.isExceeded ? (
                        <span className="font-extrabold">
                          Over by {formatCurrency(alert.overAmount, currency)} ({Math.round(alert.percentage)}%)
                        </span>
                      ) : (
                        <span>
                          At {Math.round(alert.percentage)}% of limit
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              id="btn-alert-ask-ai"
              type="button"
              onClick={() => onOpenAI('afford')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Friend for Advice</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Child-Friendly Big Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Money In */}
        <div
          id="card-money-in"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Money In (Income)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
              {formatCurrency(totalIncome, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-700 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total earnings this month</span>
          </p>
        </div>

        {/* Money Out */}
        <div
          id="card-money-out"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Money Out (Spent)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
              {formatCurrency(totalExpense, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-rose-700 flex items-center gap-1 font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{monthTransactions.filter((t) => t.type === 'expense').length} purchases made</span>
          </p>
        </div>

        {/* Money Saved */}
        <div
          id="card-money-saved"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Money Saved (Balance)
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-outfit ${
                netSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(netSavings, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700 font-semibold">
            {netSavings >= 0 ? (
              <span className="text-indigo-700">🎉 {savingsRate}% savings rate</span>
            ) : (
              <span className="text-rose-700 font-bold">⚠️ Spent more than earned</span>
            )}
          </p>
        </div>

        {/* Child-Friendly Budget Health Indicator */}
        <div
          id="card-budget-health"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              4. Budget Health
            </span>
            <span className="text-2xl">
              {netSavings >= 0 && overBudgetAlerts.length === 0
                ? '🟢'
                : overBudgetAlerts.filter((a) => a.isExceeded).length > 0
                ? '🔴'
                : '🟡'}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">
              {netSavings >= 0 && overBudgetAlerts.length === 0
                ? 'Super Safe!'
                : overBudgetAlerts.filter((a) => a.isExceeded).length > 0
                ? 'Over Limit!'
                : 'Watch Out!'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700">
            {netSavings >= 0 && overBudgetAlerts.length === 0
              ? 'All categories are nicely within budget.'
              : overBudgetAlerts.filter((a) => a.isExceeded).length > 0
              ? 'Some spending has passed your limit.'
              : 'Nearing your spending limit soon.'}
          </p>
        </div>
      </div>

      {/* Visual Chart: Daily Spending Trend Throughout the Month */}
      <div
        id="monthly-daily-chart-card"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <span>Monthly Daily Spending Trend</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-normal">
                {monthNames[month]} {year}
              </span>
            </h3>
            <p className="text-xs text-slate-700">
              See on which days of the month money was spent
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-rose-500" />
              <span className="text-slate-600">Daily Spending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-slate-600">Daily Income</span>
            </div>
          </div>
        </div>

        {/* Interactive SVG / Bar Chart */}
        <div className="h-44 w-full flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 border-b border-slate-100 overflow-x-auto">
          {dailySpending.map((day) => {
            const expHeight = day.expense > 0 ? Math.max((day.expense / maxDailyExpense) * 120, 6) : 0;
            const incHeight = day.income > 0 ? Math.max((day.income / maxDailyExpense) * 120, 6) : 0;

            return (
              <div
                key={day.day}
                className="flex-1 min-w-[12px] flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover */}
                {(day.expense > 0 || day.income > 0) && (
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] whitespace-nowrap shadow-md pointer-events-none">
                    <span>Day {day.day}</span>
                    {day.expense > 0 && (
                      <span className="text-rose-300">Spent: {formatCurrency(day.expense, currency)}</span>
                    )}
                    {day.income > 0 && (
                      <span className="text-emerald-300">In: {formatCurrency(day.income, currency)}</span>
                    )}
                  </div>
                )}

                <div className="w-full flex items-end justify-center gap-0.5">
                  {day.income > 0 && (
                    <div
                      style={{ height: `${incHeight}px` }}
                      className="w-1.5 bg-emerald-400 rounded-t-xs hover:bg-emerald-500 transition"
                    />
                  )}
                  <div
                    style={{ height: `${expHeight}px` }}
                    className={`w-full max-w-[14px] rounded-t-xs transition ${
                      day.expense > 0 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-100'
                    }`}
                  />
                </div>
                <span className="text-[9px] text-slate-600 mt-1">
                  {day.day % 5 === 0 || day.day === 1 ? day.day : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Monthly Spending Limits (Core User Requirement) */}
      <div
        id="category-limits-section"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-outfit">
                Custom Monthly Spending Limits by Category
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                Auto-Monitored
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              Set personal monthly limits for each category to keep your savings on track
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Total Budget pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">Overall Budget:</span>
              <span className="font-black text-slate-900 font-outfit">
                {formatCurrency(
                  categoryLimits.reduce(
                    (sum, cl) => sum + (currency === 'INR' ? cl.limitINR : cl.limitUSD),
                    0
                  ),
                  currency
                )}
              </span>
            </div>

            <button
              id="btn-reset-categories-modal"
              type="button"
              onClick={() => setIsResetCategoriesOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
              title="Reset category spend or limits"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Categories</span>
            </button>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryLimits.map((cat) => {
            const spent = categorySpentMap[cat.category] || 0;
            const limit = currency === 'INR' ? cat.limitINR : cat.limitUSD;
            const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
            const exactPercentage = limit > 0 ? (spent / limit) * 100 : 0;
            const isExceeded = spent > limit;
            const remaining = limit - spent;
            const isEditing = editingCategory === cat.category;

            // Bar color logic
            let progressColor = 'bg-emerald-500';
            if (isExceeded) progressColor = 'bg-rose-500';
            else if (exactPercentage >= 80) progressColor = 'bg-amber-500';

            return (
              <div
                key={cat.category}
                id={`category-card-${cat.category.replace(/\s+/g, '-').toLowerCase()}`}
                className={`p-4 rounded-xl border transition-all ${
                  isExceeded
                    ? 'border-red-300 bg-red-50/30'
                    : exactPercentage >= 80
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {cat.category}
                      </h4>
                      <p className="text-[11px] text-slate-700">
                        Spent: <span className="font-semibold text-slate-900">{formatCurrency(spent, currency)}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black ${
                      isExceeded
                        ? 'bg-rose-100 text-rose-800'
                        : exactPercentage >= 80
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {Math.round(exactPercentage)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-700 font-medium">
                    <span>
                      {isExceeded ? (
                        <span className="text-rose-600 font-bold">
                          Over by {formatCurrency(spent - limit, currency)}
                        </span>
                      ) : (
                        <span>
                          Remaining: <span className="text-emerald-700 font-bold">{formatCurrency(remaining, currency)}</span>
                        </span>
                      )}
                    </span>
                    <span>Limit: {formatCurrency(limit, currency)}</span>
                  </div>
                </div>

                {/* Footer Controls: Edit Limit or Inline Input */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-slate-700 font-bold">
                        {currency === 'INR' ? '₹' : '$'}
                      </span>
                      <input
                        id={`input-limit-${cat.category}`}
                        type="number"
                        value={editLimitValue}
                        onChange={(e) => setEditLimitValue(e.target.value)}
                        placeholder={`Limit in ${currency}`}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveLimit(cat.category)}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-300 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        id={`btn-edit-limit-${cat.category}`}
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat.category);
                          setEditLimitValue(String(limit));
                        }}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-semibold cursor-pointer transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Limit</span>
                      </button>

                      <button
                        id={`btn-quick-add-${cat.category}`}
                        type="button"
                        onClick={() => onOpenAddTransaction(cat.category)}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Expense</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions List with Search & Filter */}
      <div
        id="monthly-transactions-card"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <span>Transactions in {monthNames[month]} {year}</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                {filteredTransactions.length} records
              </span>
            </h3>
            <p className="text-xs text-slate-700">
              Review and manage your logged and synced spending
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-600 absolute left-2.5 top-2.5" />
              <input
                id="search-transactions-input"
                type="text"
                placeholder="Search merchant, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
              />
            </div>

            {/* Category Filter */}
            <select
              id="category-filter-select"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoryLimits.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.emoji} {c.category}
                </option>
              ))}
              <option value="Salary & Income">💵 Salary & Income</option>
            </select>

            {/* Clear History / Reset Button */}
            {onOpenReset && transactions.length > 0 && (
              <button
                id="btn-clear-history-ledger"
                type="button"
                onClick={onOpenReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 transition cursor-pointer"
                title="Clear all expense history or reset budgets"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table / List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <span className="text-3xl">🧾</span>
            <div>
              <p className="text-sm font-bold text-slate-800">No transactions found</p>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                {transactions.length === 0
                  ? 'All expenses have been cleared. You are in fresh start mode with a clean slate!'
                  : 'No transactions match your current search or category filter for this month.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenAddTransaction()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Transaction</span>
              </button>

              {hasUndoBackup && onUndoReset && (
                <button
                  id="btn-undo-empty-state"
                  type="button"
                  onClick={onUndoReset}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold hover:bg-amber-200 transition cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Undo Reset (Restore History)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-700 font-semibold bg-slate-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Merchant / Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const amt = getConvertedAmount(tx, currency);
                  const isExpense = tx.type === 'expense';
                  const catObj = categoryLimits.find((c) => c.category === tx.category);

                  return (
                    <tr
                      key={tx.id}
                      id={`transaction-row-${tx.id}`}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{tx.title}</div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-700">{tx.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          <span>{catObj?.emoji || (isExpense ? '📦' : '💵')}</span>
                          <span>{tx.category}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            tx.source === 'bank_sync'
                              ? 'bg-blue-100 text-blue-800'
                              : tx.source === 'sms_import'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tx.source === 'bank_sync' && '🏦 Bank Sync'}
                          {tx.source === 'sms_import' && '💬 SMS Fetch'}
                          {tx.source === 'manual' && '✍️ Manual'}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-black whitespace-nowrap font-outfit text-sm ${
                          isExpense ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(amt, currency)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          id={`btn-delete-tx-${tx.id}`}
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-slate-600 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset All Categories Modal */}
      <ResetAllCategoriesModal
        isOpen={isResetCategoriesOpen}
        onClose={() => setIsResetCategoriesOpen(false)}
        monthName={monthNames[month]}
        year={year}
        totalExpense={totalExpense}
        currency={currency}
        categoryLimits={categoryLimits}
        overBudgetCount={overBudgetAlerts.filter((a) => a.isExceeded).length}
        onResetAllSpend={() => {
          monthTransactions
            .filter((t) => t.type === 'expense')
            .forEach((t) => onDeleteTransaction(t.id));
        }}
        onResetAllLimitsToDefault={() => {
          categoryLimits.forEach((cat) => {
            const def = DEFAULT_CATEGORY_LIMITS.find((d) => d.category === cat.category);
            if (def) {
              const val = currency === 'INR' ? def.limitINR : def.limitUSD;
              onUpdateLimit(cat.category, val);
            }
          });
        }}
        onResetAllToZero={() => {
          monthTransactions
            .filter((t) => t.type === 'expense')
            .forEach((t) => onDeleteTransaction(t.id));
          categoryLimits.forEach((cat) => {
            onUpdateLimit(cat.category, 0);
          });
        }}
      />
    </div>
  );
};
