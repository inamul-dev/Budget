import React from 'react';
import {
  Wallet,
  Sparkles,
  Building2,
  Download,
  Plus,
  ArrowRightLeft,
  Flame,
  RotateCcw,
  Undo2,
  LogOut,
  User,
  Chrome,
  Github,
  Apple,
  Mail,
} from 'lucide-react';
import { Currency, AuthUser } from '../types';

interface HeaderProps {
  activeTab: 'monthly' | 'yearly' | 'life';
  setActiveTab: (tab: 'monthly' | 'yearly' | 'life') => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onOpenAI: (mode?: 'afford' | 'review' | 'paste') => void;
  onOpenBankSync: () => void;
  onOpenExport: () => void;
  onOpenAddTransaction: () => void;
  onOpenReset: () => void;
  onUndoReset?: () => void;
  hasUndoBackup?: boolean;
  bankCount: number;
  hasOverage: boolean;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onOpenAI,
  onOpenBankSync,
  onOpenExport,
  onOpenAddTransaction,
  onOpenReset,
  onUndoReset,
  hasUndoBackup = false,
  bankCount,
  hasOverage,
  currentUser,
  onSignOut,
  onOpenProfile,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-outfit">
                  BudgetPal
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  AI Friend
                </span>
              </div>
              <p className="text-xs text-slate-700 hidden md:block">
                Simple & friendly personal finance tracker
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Switcher */}
            <div
              id="currency-switcher-container"
              className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              <button
                id="currency-btn-inr"
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  currency === 'INR'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>₹</span>
                <span>INR</span>
              </button>
              <button
                id="currency-btn-usd"
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  currency === 'USD'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>$</span>
                <span>USD</span>
              </button>
            </div>

            {/* AI Advisor Button */}
            <button
              id="btn-open-ai-friend"
              type="button"
              onClick={() => onOpenAI('afford')}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
              <span className="hidden sm:inline">Ask AI Friend</span>
              <span className="sm:hidden">AI</span>
              {hasOverage && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
              )}
            </button>

            {/* Bank Sync Button */}
            <button
              id="btn-open-bank-sync"
              type="button"
              onClick={onOpenBankSync}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Synced Bank Accounts"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">Banks</span>
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">
                {bankCount}
              </span>
            </button>

            {/* Export Button */}
            <button
              id="btn-open-export"
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Export CSV or PDF"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Export</span>
            </button>

            {/* Undo Reset Button (visible when a backup exists) */}
            {hasUndoBackup && onUndoReset && (
              <button
                id="btn-header-undo-reset"
                type="button"
                onClick={onUndoReset}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs transition cursor-pointer"
                title="Undo last reset and restore all transactions & budgets"
              >
                <Undo2 className="w-4 h-4 text-amber-700" />
                <span className="hidden lg:inline">Undo Reset</span>
              </button>
            )}

            {/* Reset / Start from Scratch Button */}
            <button
              id="btn-open-reset"
              type="button"
              onClick={onOpenReset}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
              title="Reset overall budget to 0 & clear expenses (Start from Scratch)"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span className="hidden md:inline">Reset</span>
            </button>

            {/* Add Transaction Button */}
            <button
              id="btn-add-transaction-header"
              type="button"
              onClick={onOpenAddTransaction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>

            {/* User Profile & Sign Out */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  id="btn-header-profile"
                  type="button"
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs transition cursor-pointer group"
                  title={`View & Edit Profile (${currentUser.name})`}
                >
                  <div
                    className={`w-6 h-6 rounded-full ${
                      currentUser.avatarColor || 'bg-emerald-600'
                    } text-white font-bold flex items-center justify-center text-[10px] shrink-0 group-hover:scale-105 transition shadow-2xs`}
                  >
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-6 h-6 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <span className="font-bold text-slate-800 group-hover:text-emerald-950 block truncate max-w-[110px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                      {currentUser.provider === 'google' && <Chrome className="w-2.5 h-2.5 text-red-500" />}
                      {currentUser.provider === 'github' && <Github className="w-2.5 h-2.5 text-slate-700" />}
                      {currentUser.provider === 'apple' && <Apple className="w-2.5 h-2.5 text-slate-700" />}
                      {currentUser.provider === 'email' && <Mail className="w-2.5 h-2.5 text-emerald-600" />}
                      {currentUser.provider}
                    </span>
                  </div>
                </button>

                {onSignOut && (
                  <button
                    id="btn-header-signout"
                    type="button"
                    onClick={onSignOut}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                    title="Sign Out of BudgetPal"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section Tabs (Option 1: Monthly, Option 2: Yearly, Option 3: Life) */}
        <div className="flex items-center space-x-1 border-t border-slate-100 py-2 overflow-x-auto no-scrollbar">
          <button
            id="tab-btn-monthly"
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">📅</span>
            <span>1. Monthly Tracker</span>
            <span className="px-1.5 py-0.2 bg-emerald-100/70 text-emerald-700 rounded-md text-[10px] font-semibold">
              Monthly Only
            </span>
            {hasOverage && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold animate-pulse">
                Limit Alert!
              </span>
            )}
          </button>

          <button
            id="tab-btn-yearly"
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'yearly'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">📊</span>
            <span>2. Yearly Tracker</span>
            <span className="px-1.5 py-0.2 bg-blue-100/70 text-blue-700 rounded-md text-[10px] font-semibold">
              Yearly Only
            </span>
          </button>

          <button
            id="tab-btn-life"
            type="button"
            onClick={() => setActiveTab('life')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'life'
                ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">🌱</span>
            <span>3. Life Tracker (1-60 Yrs)</span>
            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-md text-[10px] font-semibold">
              Independent Plan
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
