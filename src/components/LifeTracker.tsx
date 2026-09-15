import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Sliders,
  TrendingUp,
  Target,
  Plus,
  Compass,
  CheckCircle2,
  HelpCircle,
  PiggyBank,
  Award,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { Currency, LifeBaseline, LifeMilestone, Transaction } from '../types';
import { INITIAL_LIFE_MILESTONES, USD_TO_INR } from '../data/initialData';
import { formatCurrency, getConvertedAmount } from '../utils/formatters';

interface LifeTrackerProps {
  baseline: LifeBaseline;
  onUpdateBaseline: (newBaseline: LifeBaseline) => void;
  milestones: LifeMilestone[];
  onUpdateMilestones: (newMilestones: LifeMilestone[]) => void;
  currency: Currency;
  onOpenAI: (mode?: 'afford' | 'review') => void;
  onOpenReset?: () => void;
  onUndoReset?: () => void;
  hasUndoBackup?: boolean;
}

export const LifeTracker: React.FC<LifeTrackerProps> = ({
  baseline,
  onUpdateBaseline,
  milestones,
  onUpdateMilestones,
  currency,
  onOpenAI,
  onOpenReset,
  onUndoReset,
  hasUndoBackup = false,
}) => {
  // Time period: 1 to 60 years (default 10 years)
  const [lifeSpanYears, setLifeSpanYears] = useState<number>(10);
  // Expected investment return rate (default 7% p.a.)
  const [returnRate, setReturnRate] = useState<number>(7);
  // Expected inflation / annual expense growth rate (default 4% p.a.)
  const [inflationRate, setInflationRate] = useState<number>(4);
  // Extra monthly savings booster for simulation
  const [extraMonthlySave, setExtraMonthlySave] = useState<number>(0);

  // Editing baseline finances
  const [isEditingBaseline, setIsEditingBaseline] = useState(false);
  const [inputIncome, setInputIncome] = useState(
    String(currency === 'INR' ? baseline.incomeINR : baseline.incomeUSD)
  );
  const [inputExpense, setInputExpense] = useState(
    String(currency === 'INR' ? baseline.expenseINR : baseline.expenseUSD)
  );

  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newYears, setNewYears] = useState<number>(5);
  const [newAmount, setNewAmount] = useState<string>('500000');
  const [newEmoji, setNewEmoji] = useState('🎯');

  // Compute baseline monthly income and expense from independent life baseline
  const baselineMonthly = useMemo(() => {
    const monthlyIncome = currency === 'INR' ? baseline.incomeINR : baseline.incomeUSD;
    const monthlyExpense = currency === 'INR' ? baseline.expenseINR : baseline.expenseUSD;

    return {
      income: monthlyIncome,
      expense: monthlyExpense,
      netMonthlySave: Math.max(0, monthlyIncome - monthlyExpense),
    };
  }, [baseline, currency]);

  // Calculate year-by-year trajectory for the chosen lifespan (1 to 60 years)
  const trajectory = useMemo(() => {
    const yearsData: Array<{
      year: number;
      cumulativeExpenses: number;
      cashSavings: number;
      investedWealth: number;
    }> = [];

    const monthlyContribution = baselineMonthly.netMonthlySave + extraMonthlySave;
    let runningInvestedWealth = 0;
    let runningCashSavings = 0;
    let runningCumulativeExpenses = 0;

    let currentAnnualExpense = baselineMonthly.expense * 12;

    const r = returnRate / 100;
    const inf = inflationRate / 100;

    for (let yr = 1; yr <= lifeSpanYears; yr++) {
      // Annual expenses with inflation
      runningCumulativeExpenses += currentAnnualExpense;
      currentAnnualExpense *= 1 + inf;

      // Annual savings added
      const annualSaved = monthlyContribution * 12;
      runningCashSavings += annualSaved;

      // Compound wealth calculation: (previous wealth + year's savings) * (1 + return)
      runningInvestedWealth = (runningInvestedWealth + annualSaved) * (1 + r);

      yearsData.push({
        year: yr,
        cumulativeExpenses: Math.round(runningCumulativeExpenses),
        cashSavings: Math.round(runningCashSavings),
        investedWealth: Math.round(runningInvestedWealth),
      });
    }

    return yearsData;
  }, [
    baselineMonthly,
    extraMonthlySave,
    lifeSpanYears,
    returnRate,
    inflationRate,
  ]);

  const finalYearData = trajectory[trajectory.length - 1] || {
    cumulativeExpenses: 0,
    cashSavings: 0,
    investedWealth: 0,
  };

  const maxChartValue = Math.max(
    finalYearData.investedWealth,
    finalYearData.cumulativeExpenses,
    1000
  );

  // Handle adding new custom milestone
  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const amt = parseFloat(newAmount) || 100000;
    const item: LifeMilestone = {
      id: `milestone-${Date.now()}`,
      title: newTitle,
      targetYears: newYears,
      targetAmountINR: currency === 'INR' ? amt : amt * USD_TO_INR,
      targetAmountUSD: currency === 'USD' ? amt : amt / USD_TO_INR,
      category: 'Personal Goal',
      emoji: newEmoji,
    };

    const updated = [...milestones, item].sort((a, b) => a.targetYears - b.targetYears);
    onUpdateMilestones(updated);

    setNewTitle('');
    setShowAddMilestoneModal(false);
  };

  const handleDeleteMilestone = (id: string) => {
    const updated = milestones.filter((m) => m.id !== id);
    onUpdateMilestones(updated);
  };

  const handleSaveBaseline = () => {
    const inc = parseFloat(inputIncome) || 0;
    const exp = parseFloat(inputExpense) || 0;

    const isINR = currency === 'INR';
    onUpdateBaseline({
      incomeINR: isINR ? Math.round(inc) : Math.round(inc * USD_TO_INR),
      incomeUSD: isINR ? Number((inc / USD_TO_INR).toFixed(2)) : inc,
      expenseINR: isINR ? Math.round(exp) : Math.round(exp * USD_TO_INR),
      expenseUSD: isINR ? Number((exp / USD_TO_INR).toFixed(2)) : exp,
    });
    setIsEditingBaseline(false);
  };

  const handleSetZeroBaseline = () => {
    onUpdateBaseline({
      incomeINR: 0,
      incomeUSD: 0,
      expenseINR: 0,
      expenseUSD: 0,
    });
    setInputIncome('0');
    setInputExpense('0');
    setIsEditingBaseline(false);
  };

  const handleSetStandardBaseline = () => {
    onUpdateBaseline({
      incomeINR: 95000,
      incomeUSD: 1120,
      expenseINR: 52000,
      expenseUSD: 610,
    });
    setInputIncome(currency === 'INR' ? '95000' : '1120');
    setInputExpense(currency === 'INR' ? '52000' : '610');
    setIsEditingBaseline(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Separation Banner */}
      <div
        id="life-independent-banner"
        className="bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            🌱
          </div>
          <div>
            <h3 className="text-sm font-black text-purple-950 font-outfit flex items-center gap-2">
              <span>Life Tracker (Runs Separately)</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                Independent 1-60 Year Roadmap
              </span>
            </h3>
            <p className="text-xs text-purple-800/80">
              For long-term life planning: Model compound wealth, inflation impact, and lifetime milestones. Monthly & yearly expenses do not bleed into this space.
            </p>
          </div>
        </div>

        {hasUndoBackup && onUndoReset && (
          <button
            type="button"
            onClick={onUndoReset}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Recent Reset</span>
          </button>
        )}
      </div>

      {/* Title & Concept Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Independent Section 3: Overall Life Expense & Wealth Tracker</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-outfit text-white">
              Plan Your Future: 1 Year to 60 Years
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 max-w-xl">
              See how small habits today compound into immense freedom over 1 to 60 years.
              Runs independently from monthly and yearly tracking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReset && (
              <button
                id="btn-life-reset-scratch"
                type="button"
                onClick={onOpenReset}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition cursor-pointer"
                title="Reset baseline to 0 & clear milestones"
              >
                <RotateCcw className="w-4 h-4 text-rose-300" />
                <span>Reset Life to 0</span>
              </button>
            )}
            <button
              id="btn-life-ask-ai"
              type="button"
              onClick={() => onOpenAI('review')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/25 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Life Coaching</span>
            </button>
          </div>
        </div>
      </div>

      {/* Independent Life Baseline Finances Card */}
      <div
        id="life-baseline-finances-card"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <span>Life Baseline Monthly Finances (Independent)</span>
            </h3>
            <p className="text-xs text-slate-700">
              The monthly earnings and living costs used to calculate your 1 to 60-year projection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingBaseline ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setInputIncome(String(baselineMonthly.income));
                    setInputExpense(String(baselineMonthly.expense));
                    setIsEditingBaseline(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition cursor-pointer"
                >
                  Edit Baseline
                </button>
                <button
                  type="button"
                  onClick={handleSetZeroBaseline}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition cursor-pointer"
                >
                  Set to 0 (Scratch)
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBaseline(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBaseline}
                  className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Baseline
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditingBaseline ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Baseline Monthly Income ({currency})
              </label>
              <input
                type="number"
                value={inputIncome}
                onChange={(e) => setInputIncome(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Baseline Monthly Expenses ({currency})
              </label>
              <input
                type="number"
                value={inputExpense}
                onChange={(e) => setInputExpense(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 uppercase">Monthly Income</span>
              <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                {formatCurrency(baselineMonthly.income, currency)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 uppercase">Monthly Living Expense</span>
              <div className="text-xl font-black text-rose-700 font-outfit mt-1">
                {formatCurrency(baselineMonthly.expense, currency)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 uppercase">Net Monthly Savings</span>
              <div className="text-xl font-black text-indigo-700 font-outfit mt-1">
                {formatCurrency(baselineMonthly.netMonthlySave, currency)}
              </div>
            </div>
          </div>
        )}

        {baselineMonthly.expense === 0 && baselineMonthly.income === 0 && (
          <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <span>Baseline is currently 0 (Clean Slate). You can model via Extra Booster below or click restore:</span>
            <button
              type="button"
              onClick={handleSetStandardBaseline}
              className="font-bold underline hover:text-amber-950 cursor-pointer"
            >
              Restore Standard Baseline
            </button>
          </div>
        )}
      </div>

      {/* Time Horizon Slider & Quick Presets (1 to 60 Years) */}
      <div
        id="life-horizon-controls"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Choose Your Life Time Horizon (1 to 60 Years)</span>
            </h3>
            <p className="text-xs text-slate-700">
              Select how many years into your future you want to project
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-indigo-700 font-bold uppercase">Horizon:</span>
            <span className="text-lg font-black text-indigo-700 font-outfit">
              {lifeSpanYears} {lifeSpanYears === 1 ? 'Year' : 'Years'}
            </span>
          </div>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Quick Pick:</span>
          {[1, 5, 10, 20, 30, 40, 50, 60].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setLifeSpanYears(preset)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                lifeSpanYears === preset
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset} {preset === 1 ? 'Yr' : 'Yrs'}
            </button>
          ))}
        </div>

        {/* Main Slider */}
        <div className="space-y-2 pt-2">
          <input
            id="life-span-slider"
            type="range"
            min={1}
            max={60}
            step={1}
            value={lifeSpanYears}
            onChange={(e) => setLifeSpanYears(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-600 font-semibold px-1">
            <span>1 Year (Short term)</span>
            <span>10 Years (Medium term)</span>
            <span>30 Years (Retirement)</span>
            <span>60 Years (Full Lifetime)</span>
          </div>
        </div>
      </div>

      {/* 3 Big Projection Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Invested Wealth with Compound Growth */}
        <div
          id="card-projected-wealth"
          className="bg-white p-5 rounded-2xl border-2 border-emerald-300 shadow-2xs hover:shadow-sm transition relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              1. Projected Lifetime Wealth
            </span>
            <span className="text-2xl">🏆</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-outfit">
              {formatCurrency(finalYearData.investedWealth, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700">
            Compound growth @ {returnRate}% annual return
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            <span>+</span>
            <span>
              {formatCurrency(finalYearData.investedWealth - finalYearData.cashSavings, currency)}
            </span>
            <span>from compound interest!</span>
          </div>
        </div>

        {/* Lifetime Cumulative Living Expenses */}
        <div
          id="card-projected-expenses"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Total Lifetime Expenses
            </span>
            <span className="text-2xl">💸</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
              {formatCurrency(finalYearData.cumulativeExpenses, currency)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700">
            Total money needed to live over {lifeSpanYears} years (with {inflationRate}% inflation)
          </p>
        </div>

        {/* Financial Freedom Ratio */}
        <div
          id="card-freedom-ratio"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Financial Freedom Status
            </span>
            <span className="text-2xl">🌱</span>
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-outfit ${
                finalYearData.investedWealth >= finalYearData.cumulativeExpenses * 0.5
                  ? 'text-indigo-600'
                  : 'text-amber-600'
              }`}
            >
              {finalYearData.investedWealth >= finalYearData.cumulativeExpenses * 0.5
                ? 'Super Independent!'
                : 'Building Momentum'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700">
            Your invested wealth could cover{' '}
            <span className="font-bold text-indigo-700">
              {((finalYearData.investedWealth / Math.max(finalYearData.cumulativeExpenses, 1)) * 100).toFixed(0)}%
            </span>{' '}
            of your lifetime expenses!
          </p>
        </div>
      </div>

      {/* Interactive Trajectory Visualization Chart */}
      <div
        id="life-trajectory-chart-card"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Life Progress Visualization Curve (Year 1 to Year {lifeSpanYears})</span>
            </h3>
            <p className="text-xs text-slate-700">
              Watch how your wealth outpaces linear expenses through consistent saving & compound growth
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">Invested Wealth</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-400" />
              <span className="font-semibold text-slate-700">Cash Saved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-400" />
              <span className="font-semibold text-slate-700">Living Expenses</span>
            </div>
          </div>
        </div>

        {/* SVG Multi-Line Chart */}
        <div className="h-64 sm:h-72 w-full pt-4 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid horizontal lines */}
            {[20, 40, 60, 80].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}

            {/* Path 1: Cumulative Expenses (Rose) */}
            <path
              d={trajectory.reduce((acc, pt, i) => {
                const x = (i / Math.max(trajectory.length - 1, 1)) * 100;
                const y = 100 - (pt.cumulativeExpenses / maxChartValue) * 90;
                return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${Math.max(y, 5)}`;
              }, '')}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Path 2: Cash Savings (Indigo) */}
            <path
              d={trajectory.reduce((acc, pt, i) => {
                const x = (i / Math.max(trajectory.length - 1, 1)) * 100;
                const y = 100 - (pt.cashSavings / maxChartValue) * 90;
                return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${Math.max(y, 5)}`;
              }, '')}
              fill="none"
              stroke="#818CF8"
              strokeWidth="2"
              strokeDasharray="4,2"
            />

            {/* Path 3: Invested Wealth (Emerald with gradient) */}
            <path
              d={trajectory.reduce((acc, pt, i) => {
                const x = (i / Math.max(trajectory.length - 1, 1)) * 100;
                const y = 100 - (pt.investedWealth / maxChartValue) * 90;
                return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${Math.max(y, 5)}`;
              }, '')}
              fill="none"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>

          {/* X Axis Year Labels */}
          <div className="flex justify-between text-[11px] text-slate-600 font-semibold mt-3 pt-2 border-t border-slate-200">
            <span>Year 1</span>
            {lifeSpanYears > 5 && <span>Year {Math.round(lifeSpanYears / 2)}</span>}
            <span>Year {lifeSpanYears}</span>
          </div>
        </div>
      </div>

      {/* Child-Friendly Compound Savings Simulator */}
      <div
        id="compound-simulator-card"
        className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-5 rounded-2xl border-2 border-emerald-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-emerald-950 font-outfit flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Child-Friendly Wealth Magic Simulator: "The Power of ₹1,000 / $15"</span>
            </h3>
            <p className="text-xs text-emerald-800">
              Drag the booster to see how saving just a tiny bit extra per month multiplies into a fortune!
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-800 font-bold">Extra Monthly Boost:</span>
            <div className="text-lg font-black text-emerald-900 font-outfit">
              +{formatCurrency(extraMonthlySave, currency)} / month
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <input
            id="extra-savings-booster-slider"
            type="range"
            min={0}
            max={currency === 'INR' ? 10000 : 150}
            step={currency === 'INR' ? 500 : 5}
            value={extraMonthlySave}
            onChange={(e) => setExtraMonthlySave(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-emerald-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
            <span>₹0 / $0</span>
            <span>
              {extraMonthlySave > 0
                ? `🎉 In ${lifeSpanYears} years, this small habit creates an extra ${formatCurrency(
                    ((extraMonthlySave * 12) * ((Math.pow(1 + returnRate / 100, lifeSpanYears) - 1) / (returnRate / 100))),
                    currency
                  )}!`
                : 'Slide right to add an extra monthly saving boost!'}
            </span>
            <span>{formatCurrency(currency === 'INR' ? 10000 : 150, currency)}</span>
          </div>
        </div>
      </div>

      {/* Life Milestones Roadmap (1 Year to 60 Years) */}
      <div
        id="life-milestones-section"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-outfit flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Life Milestones Roadmap (1 Year to 60 Years)</span>
            </h3>
            <p className="text-xs text-slate-700">
              Track your savings goals for life stages (Vacation, Car, Home, College, Retirement)
            </p>
          </div>

          <button
            id="btn-add-milestone"
            type="button"
            onClick={() => setShowAddMilestoneModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Life Milestone</span>
          </button>
        </div>

        {/* Milestone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m) => {
            const targetAmount = currency === 'INR' ? m.targetAmountINR : m.targetAmountUSD;
            const projectedWealthAtYear = trajectory[Math.min(m.targetYears - 1, trajectory.length - 1)]?.investedWealth || 0;
            const isAchievable = projectedWealthAtYear >= targetAmount;
            const progressPercent = Math.min(Math.round((projectedWealthAtYear / targetAmount) * 100), 100);

            return (
              <div
                key={m.id}
                id={`milestone-card-${m.id}`}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100">
                      {m.emoji}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {m.title}
                      </h4>
                      <span className="text-[11px] text-slate-700 font-medium">
                        Target: Year {m.targetYears} ({m.category})
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isAchievable
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isAchievable ? '✅ On Track' : '⏳ In Progress'}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700">Target Cost:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(targetAmount, currency)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className={`h-full rounded-full ${
                        isAchievable ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                    <span>Projected at Yr {m.targetYears}: {formatCurrency(projectedWealthAtYear, currency)}</span>
                    <span className="font-bold">{progressPercent}%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                  <span className="text-slate-700">
                    {isAchievable
                      ? 'Fully funded ahead of time!'
                      : `Needs ~${formatCurrency(Math.max((targetAmount - projectedWealthAtYear) / (m.targetYears * 12), 10), currency)}/mo boost`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(m.id)}
                    className="text-slate-600 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-outfit">
              Add New Life Milestone Goal
            </h3>
            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Milestone Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master's Degree, Dream Cabin, Wedding"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Year (1 to 60)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newYears}
                    onChange={(e) => setNewYears(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emoji Icon
                  </label>
                  <select
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="🎯">🎯 Goal</option>
                    <option value="🏡">🏡 House</option>
                    <option value="✈️">✈️ Travel</option>
                    <option value="🚗">🚗 Vehicle</option>
                    <option value="🎓">🎓 College</option>
                    <option value="💍">💍 Wedding</option>
                    <option value="👶">👶 Baby</option>
                    <option value="🌴">🌴 Freedom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimated Cost ({currency})
                </label>
                <input
                  type="number"
                  min={100}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
