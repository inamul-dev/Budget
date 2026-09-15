import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Flame,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Undo2,
  Filter,
} from 'lucide-react';
import { Category, CategoryLimit, Currency, Transaction } from '../types';
import { formatCurrency, getConvertedAmount } from '../utils/formatters';

interface YearlyTrackerProps {
  transactions: Transaction[];
  categoryLimits: CategoryLimit[];
  currency: Currency;
  onOpenAI: (mode: 'review') => void;
  onUpdateLimit?: (category: Category, newLimit: number) => void;
  onDeleteTransaction?: (id: string) => void;
  onOpenAddTransaction?: (preselectedCategory?: Category) => void;
  onOpenReset?: () => void;
  onUndoReset?: () => void;
  hasUndoBackup?: boolean;
}

export const YearlyTracker: React.FC<YearlyTrackerProps> = ({
  transactions,
  categoryLimits,
  currency,
  onOpenAI,
  onUpdateLimit,
  onDeleteTransaction,
  onOpenAddTransaction,
  onOpenReset,
  onUndoReset,
  hasUndoBackup = false,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');

  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // Filter transactions for the selected year (Yearly independent data)
  const yearTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(`${selectedYear}-`));
  }, [transactions, selectedYear]);

  // Aggregate annual income and expenses
  const totalAnnualIncome = useMemo(() => {
    return yearTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + getConvertedAmount(t, currency), 0);
  }, [yearTransactions, currency]);

  const totalAnnualExpense = useMemo(() => {
    return yearTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + getConvertedAmount(t, currency), 0);
  }, [yearTransactions, currency]);

  const netAnnualSavings = totalAnnualIncome - totalAnnualExpense;
  const annualSavingsRate = totalAnnualIncome > 0
    ? Math.round((netAnnualSavings / totalAnnualIncome) * 100)
    : 0;

  // Monthly breakdown (Jan - Dec)
  const monthlyData = useMemo(() => {
    const list = monthShortNames.map((name, index) => {
      const monthPrefix = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
      const monthTxs = yearTransactions.filter((t) => t.date.startsWith(monthPrefix));

      const income = monthTxs
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + getConvertedAmount(t, currency), 0);

      const expense = monthTxs
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + getConvertedAmount(t, currency), 0);

      const savings = income - expense;

      return {
        monthIndex: index,
        monthName: name,
        income,
        expense,
        savings,
      };
    });

    return list;
  }, [yearTransactions, selectedYear, currency]);

  // Average monthly burn
  const monthsWithSpending = monthlyData.filter((m) => m.expense > 0 || m.income > 0);
  const activeMonthsCount = Math.max(monthsWithSpending.length, 1);
  const avgMonthlyExpense = totalAnnualExpense / activeMonthsCount;

  // Best savings month & biggest spend month
  const bestSavingMonth = useMemo(() => {
    const validMonths = monthlyData.filter((m) => m.income > 0);
    if (validMonths.length === 0) return null;
    return [...validMonths].sort((a, b) => b.savings - a.savings)[0];
  }, [monthlyData]);

  const highestSpendMonth = useMemo(() => {
    const validMonths = monthlyData.filter((m) => m.expense > 0);
    if (validMonths.length === 0) return null;
    return [...validMonths].sort((a, b) => b.expense - a.expense)[0];
  }, [monthlyData]);

  // Category Annual Aggregation
  const yearlyCategorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    yearTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const amt = getConvertedAmount(t, currency);
        map[t.category] = (map[t.category] || 0) + amt;
      });

    return categoryLimits.map((cl) => {
      const spent = map[cl.category] || 0;
      const limit = currency === 'INR' ? cl.limitINR : cl.limitUSD;
      const percent = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
      const isOver = limit > 0 && spent > limit;

      return {
        category: cl.category,
        spent,
        limit,
        percent,
        isOver,
        emoji: cl.emoji,
        color: cl.color,
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [yearTransactions, categoryLimits, currency]);

  // Total Annual Budget
  const totalAnnualBudget = useMemo(() => {
    return categoryLimits.reduce(
      (sum, cl) => sum + (currency === 'INR' ? cl.limitINR : cl.limitUSD),
      0
    );
  }, [categoryLimits, currency]);

  // Max value for scaling monthly bars
  const maxMonthValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expense)),
    1000
  );

  // Filtered ledger transactions
  const filteredLedger = useMemo(() => {
    return yearTransactions.filter((tx) => {
      const matchesSearch =
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat =
        selectedCategoryFilter === 'all' || tx.category === selectedCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [yearTransactions, searchQuery, selectedCategoryFilter]);

  const handleSaveAnnualLimit = (category: Category) => {
    if (!onUpdateLimit) return;
    const val = parseFloat(editLimitValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateLimit(category, val);
    }
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Separation Banner */}
      <div
        id="yearly-independent-banner"
        className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            📊
          </div>
          <div>
            <h3 className="text-sm font-black text-blue-950 font-outfit flex items-center gap-2">
              <span>Yearly Tracker (Runs Separately)</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                Independent Annual Mode
              </span>
            </h3>
            <p className="text-xs text-blue-800/80">
              For annual users: Track annual expenses (insurance, taxes, travel, bonuses) & set annual category limits. Monthly expenses are not mixed here.
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

      {/* Year Selector & Top Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="btn-prev-year"
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-2 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-5 py-1 text-lg font-black text-slate-900 font-outfit min-w-[120px] text-center">
              {selectedYear}
            </span>
            <button
              id="btn-next-year"
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-2 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            id="btn-current-year"
            type="button"
            onClick={() => setSelectedYear(currentYear)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            This Year ({currentYear})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenAddTransaction && (
            <button
              id="btn-yearly-add-tx"
              type="button"
              onClick={() => onOpenAddTransaction()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Yearly Expense</span>
            </button>
          )}

          {onOpenReset && (
            <button
              id="btn-yearly-reset-scratch"
              type="button"
              onClick={onOpenReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
              title="Reset yearly budget to 0 & clear history"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Reset Yearly to 0</span>
            </button>
          )}

          <button
            id="btn-yearly-ai-review"
            type="button"
            onClick={() => onOpenAI('review')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Ask AI Annual Review</span>
            <span className="sm:hidden">AI Review</span>
          </button>
        </div>
      </div>

      {/* 4 Annual Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Income */}
        <div
          id="card-annual-income"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Annual Income
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
              {formatCurrency(totalAnnualIncome, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700 font-medium">
            Cumulative logged in {selectedYear}
          </p>
        </div>

        {/* Total Annual Expense */}
        <div
          id="card-annual-expense"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Annual Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
              {formatCurrency(totalAnnualExpense, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700 font-medium">
            Avg. burn: {formatCurrency(avgMonthlyExpense, currency)} / mo
          </p>
        </div>

        {/* Net Annual Savings */}
        <div
          id="card-annual-savings"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Net Annual Savings
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-outfit ${
                netAnnualSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(netAnnualSavings, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700 font-medium">
            <span className="font-bold text-indigo-700">{annualSavingsRate}%</span> of income retained
          </p>
        </div>

        {/* Annual Budget Total */}
        <div
          id="card-annual-budget-total"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Overall Annual Budget
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
              {formatCurrency(totalAnnualBudget, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700 font-medium">
            {totalAnnualBudget === 0 ? (
              <span className="text-rose-600 font-bold">Annual budget reset to 0</span>
            ) : totalAnnualExpense > totalAnnualBudget ? (
              <span className="text-rose-600 font-bold">Annual limit exceeded!</span>
            ) : (
              <span className="text-emerald-700 font-bold">
                {formatCurrency(totalAnnualBudget - totalAnnualExpense, currency)} remaining
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Month-by-Month Annual Comparative Chart (Jan - Dec) */}
      <div
        id="annual-comparative-chart-card"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>12-Month Comparative Spending & Income Timeline ({selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-700">
              Annual timeline tracking monthly distributions of your yearly expenses and income
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-xs bg-emerald-500" />
              <span className="text-slate-700">Income In</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-xs bg-rose-500" />
              <span className="text-slate-700">Expenses Out</span>
            </div>
          </div>
        </div>

        {/* 12-Month Bar Chart */}
        <div className="h-64 w-full flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 overflow-x-auto">
          {monthlyData.map((m) => {
            const incHeight = maxMonthValue > 0 ? (m.income / maxMonthValue) * 180 : 0;
            const expHeight = maxMonthValue > 0 ? (m.expense / maxMonthValue) * 180 : 0;

            return (
              <div
                key={m.monthName}
                id={`bar-month-${m.monthName.toLowerCase()}`}
                className="flex-1 min-w-[40px] max-w-[70px] flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover */}
                {(m.income > 0 || m.expense > 0) && (
                  <div className="absolute -top-16 z-20 hidden group-hover:flex flex-col items-center px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] whitespace-nowrap shadow-lg pointer-events-none">
                    <span className="font-bold">{m.monthName} {selectedYear}</span>
                    <span className="text-emerald-300">In: {formatCurrency(m.income, currency)}</span>
                    <span className="text-rose-300">Out: {formatCurrency(m.expense, currency)}</span>
                    <span className="text-slate-300 text-[10px]">Net: {formatCurrency(m.savings, currency)}</span>
                  </div>
                )}

                {/* Bars side by side */}
                <div className="w-full flex items-end justify-center gap-1">
                  {/* Income bar */}
                  <div
                    style={{ height: `${Math.max(incHeight, 4)}px` }}
                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                      m.income > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-100'
                    }`}
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${Math.max(expHeight, 4)}px` }}
                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                      m.expense > 0 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-100'
                    }`}
                  />
                </div>

                <span className="text-xs font-bold text-slate-700 mt-2">
                  {m.monthName}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-slate-700 pt-1">
          💡 Hover over any month to view exact yearly income, expenses, and net savings.
        </div>
      </div>

      {/* Annual Category Spending Limits */}
      <div
        id="annual-category-limits-card"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <span>Annual Spending Limits by Category ({selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-700">
              Independent annual category budgets. Adjust your limits to reflect whole-year targets.
            </p>
          </div>
          <div className="text-xs text-slate-700">
            Total Annual Budget: <b className="text-slate-900">{formatCurrency(totalAnnualBudget, currency)}</b>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {yearlyCategorySpending.map((cat) => (
            <div
              key={cat.category}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-xs font-bold text-slate-900">{cat.category}</span>
                </div>
                {onUpdateLimit && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(cat.category);
                      setEditLimitValue(String(cat.limit));
                    }}
                    className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    title="Edit annual limit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="font-extrabold text-slate-800">
                  {formatCurrency(cat.spent, currency)}
                </span>
                <span className="text-[11px] text-slate-700">
                  Annual Limit: <b>{formatCurrency(cat.limit, currency)}</b>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(cat.percent, 100)}%`,
                    backgroundColor: cat.isOver ? '#EF4444' : cat.color,
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700">
                <span>{Math.round(cat.percent)}% used</span>
                {cat.isOver ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Over by {formatCurrency(cat.spent - cat.limit, currency)}
                  </span>
                ) : (
                  <span className="text-emerald-700">
                    {formatCurrency(Math.max(0, cat.limit - cat.spent), currency)} left
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly Transaction Ledger & History */}
      <div
        id="annual-transactions-ledger-card"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Yearly Expense & Income History ({selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-700">
              Independent ledger of all annual records logged in {selectedYear} ({filteredLedger.length} items)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search annual entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-52"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categoryLimits.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.emoji} {c.category}
                  </option>
                ))}
              </select>
            </div>

            {onOpenAddTransaction && (
              <button
                type="button"
                onClick={() => onOpenAddTransaction()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add</span>
              </button>
            )}
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-xl">
              📊
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                No Yearly Transactions Found for {selectedYear}
              </h4>
              <p className="text-xs text-slate-700 max-w-sm mx-auto">
                This yearly space is completely clean and independent. Log your annual insurance, taxes, vacations, and bonuses here.
              </p>
            </div>
            {onOpenAddTransaction && (
              <button
                type="button"
                onClick={() => onOpenAddTransaction()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log First Annual Expense</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
            {filteredLedger.map((tx) => {
              const isIncome = tx.type === 'income';
              const amt = getConvertedAmount(tx, currency);
              const catObj = categoryLimits.find((c) => c.category === tx.category);

              return (
                <div
                  key={tx.id}
                  id={`yearly-tx-row-${tx.id}`}
                  className="p-3.5 bg-white hover:bg-slate-50/70 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{ backgroundColor: `${catObj?.color || '#3B82F6'}20` }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    >
                      {catObj?.emoji || '📦'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {tx.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold shrink-0">
                          {tx.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-700 mt-0.5">
                        <span>{tx.date}</span>
                        {tx.notes && <span>• {tx.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs sm:text-sm font-black font-outfit ${
                        isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(amt, currency)}
                    </span>

                    {onDeleteTransaction && (
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Annual Limit Modal */}
      {editingCategory && (
        <div
          id="modal-edit-annual-limit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setEditingCategory(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-black text-slate-900 font-outfit">
              Edit Annual Budget Limit
            </h4>
            <p className="text-xs text-slate-700">
              Set the 12-month spending limit for <b>{editingCategory}</b> ({currency}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Annual Limit ({currency === 'INR' ? '₹' : '$'})
              </label>
              <input
                type="number"
                value={editLimitValue}
                onChange={(e) => setEditLimitValue(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveAnnualLimit(editingCategory)}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Save Annual Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

