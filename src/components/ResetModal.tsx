import React, { useState } from 'react';
import {
  RotateCcw,
  Undo2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Sliders,
  Calendar,
  Layers,
} from 'lucide-react';
import { CategoryLimit, Currency, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  activeTab: 'monthly' | 'yearly' | 'life';
  monthlyTransactionsCount: number;
  yearlyTransactionsCount: number;
  hasUndoBackup: boolean;
  undoBackupTime?: number;
  undoBackupCount?: number;
  onReset: (options: {
    scope: 'active' | 'all';
    resetBudgetsToZero: boolean;
    clearTransactions: boolean;
    resetMilestones?: boolean;
  }) => void;
  onRestoreDemoData: () => void;
  onUndoReset: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  currency,
  activeTab,
  monthlyTransactionsCount,
  yearlyTransactionsCount,
  hasUndoBackup,
  undoBackupTime,
  undoBackupCount,
  onReset,
  onRestoreDemoData,
  onUndoReset,
}) => {
  const [resetScope, setResetScope] = useState<'active' | 'all'>('active');
  const [resetBudgets, setResetBudgets] = useState(true);
  const [clearHistory, setClearHistory] = useState(true);
  const [resetMilestones, setResetMilestones] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  if (!isOpen) return null;

  const activeTrackerTitle =
    activeTab === 'monthly'
      ? 'Monthly Tracker'
      : activeTab === 'yearly'
      ? 'Yearly Tracker'
      : 'Life Tracker';

  const handleExecute = () => {
    onReset({
      scope: resetScope,
      resetBudgetsToZero: resetBudgets,
      clearTransactions: clearHistory,
      resetMilestones,
    });
    setConfirmStep(false);
    onClose();
  };

  const formattedBackupTime = undoBackupTime
    ? new Date(undoBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      id="reset-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="reset-modal-container"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 via-slate-50 to-amber-50 p-6 border-b border-slate-200 relative">
          <button
            id="btn-close-reset-modal"
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-outfit">
                Start From Scratch & Reset
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Reset overall budget to 0 & clear expenses separately or everywhere
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* UNDO BANNER (if a backup exists) */}
          {hasUndoBackup && (
            <div
              id="reset-modal-undo-box"
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-start gap-2.5">
                <Undo2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-amber-900">
                    Previous Backup Available
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    Snapshot saved {formattedBackupTime ? `at ${formattedBackupTime}` : ''} ({undoBackupCount ?? 0} items & budgets).
                  </p>
                </div>
              </div>
              <button
                id="btn-undo-from-modal"
                type="button"
                onClick={() => {
                  onUndoReset();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo Reset</span>
              </button>
            </div>
          )}

          {/* Scope Selector: Reset active tracker only vs all 3 trackers */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Which tracker do you want to reset?
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setResetScope('active')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition text-left cursor-pointer ${
                  resetScope === 'active'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="block font-black">
                  {activeTrackerTitle} Only
                </span>
                <span className="text-[10px] text-slate-700 font-normal">
                  Keep other 2 trackers intact
                </span>
              </button>
              <button
                type="button"
                onClick={() => setResetScope('all')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition text-left cursor-pointer ${
                  resetScope === 'all'
                    ? 'bg-white text-rose-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="block font-black">
                  All 3 Trackers
                </span>
                <span className="text-[10px] text-slate-700 font-normal">
                  Fresh clean slate everywhere
                </span>
              </button>
            </div>
          </div>

          {/* Current State Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Independent Records Status
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-700 font-bold block">📅 Monthly</span>
                <span className="text-sm font-black text-slate-900 font-outfit">
                  {monthlyTransactionsCount} items
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-700 font-bold block">📊 Yearly</span>
                <span className="text-sm font-black text-slate-900 font-outfit">
                  {yearlyTransactionsCount} items
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-700 font-bold block">🌱 Life</span>
                <span className="text-sm font-black text-slate-900 font-outfit">
                  Baseline Setup
                </span>
              </div>
            </div>
          </div>

          {/* Checklist / Options */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Choose Reset Actions
            </span>

            {/* Option 1: Reset budgets / baseline to 0 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={resetBudgets}
                onChange={(e) => setResetBudgets(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-900 block">
                  Reset Overall Budget & Spending Limits to 0
                </span>
                <span className="text-[11px] text-slate-700">
                  Sets limits/baseline to {currency === 'INR' ? '₹0' : '$0'} for a zero-budget scratch start.
                </span>
              </div>
            </label>

            {/* Option 2: Clear all expenses & transactions */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={clearHistory}
                onChange={(e) => setClearHistory(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-900 block">
                  Clear All Expenses & History (Zero Transactions)
                </span>
                <span className="text-[11px] text-slate-700">
                  Empties recorded transactions in the selected tracker scope.
                </span>
              </div>
            </label>

            {/* Option 3: Reset life milestones */}
            {(resetScope === 'all' || activeTab === 'life') && (
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={resetMilestones}
                  onChange={(e) => setResetMilestones(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 block">
                    Reset Life Milestones Roadmap
                  </span>
                  <span className="text-[11px] text-slate-700">
                    Clears customized life milestones in the 1-60 years Life Tracker.
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Safety Notice about Undo */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <b>Safe & Reversible:</b> An automatic backup is created before reset. You can click <b>Undo</b> anytime to restore your data.
            </span>
          </div>

          {/* Confirmation Step or Action Buttons */}
          {confirmStep ? (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Are you sure you want to reset?</span>
              </div>
              <p className="text-xs text-rose-800">
                {resetScope === 'active'
                  ? `This will reset budgets to 0 and clear history in ${activeTrackerTitle} only.`
                  : 'This will reset budgets to 0 and clear history across all 3 trackers.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  id="btn-confirm-cancel-reset"
                  type="button"
                  onClick={() => setConfirmStep(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-execute-reset"
                  type="button"
                  onClick={handleExecute}
                  className="px-5 py-2 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition cursor-pointer"
                >
                  Yes, Reset to 0
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {/* Primary Reset Button */}
              <button
                id="btn-trigger-scratch-reset"
                type="button"
                onClick={() => setConfirmStep(true)}
                disabled={!resetBudgets && !clearHistory && !resetMilestones}
                className="w-full py-3 px-4 rounded-xl text-sm font-black bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {resetScope === 'active'
                    ? `Reset ${activeTrackerTitle} to 0`
                    : 'Reset All 3 Trackers to 0'}
                </span>
              </button>

              {/* Restore Demo Data Option */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  id="btn-restore-sample-data"
                  type="button"
                  onClick={() => {
                    onRestoreDemoData();
                    onClose();
                  }}
                  className="text-xs text-slate-700 hover:text-slate-800 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Restore Sample / Demo Data</span>
                </button>

                <button
                  id="btn-cancel-reset-modal"
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-700 hover:text-slate-800 font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
