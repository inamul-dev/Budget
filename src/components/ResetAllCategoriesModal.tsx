import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sliders,
  X,
  Sparkles,
  Undo2,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, CategoryLimit, Currency } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ResetAllCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthName: string;
  year: number;
  totalExpense: number;
  currency: Currency;
  categoryLimits: CategoryLimit[];
  overBudgetCount: number;
  onResetAllSpend: () => void;
  onResetAllLimitsToDefault: () => void;
  onResetAllToZero: () => void;
}

export const ResetAllCategoriesModal: React.FC<ResetAllCategoriesModalProps> = ({
  isOpen,
  onClose,
  monthName,
  year,
  totalExpense,
  currency,
  categoryLimits,
  overBudgetCount,
  onResetAllSpend,
  onResetAllLimitsToDefault,
  onResetAllToZero,
}) => {
  const [selectedAction, setSelectedAction] = useState<'spend' | 'limits' | 'both'>('spend');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (selectedAction === 'spend') {
      onResetAllSpend();
    } else if (selectedAction === 'limits') {
      onResetAllLimitsToDefault();
    } else {
      onResetAllToZero();
    }
    setIsConfirming(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        id="reset-all-categories-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          id="reset-all-categories-modal"
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-slate-50 p-6 border-b border-slate-200 relative">
            <button
              id="btn-close-reset-categories"
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 font-outfit">
                  Reset All Categories
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Clear excessive monthly spending or reset budget limits to start fresh
                </p>
              </div>
            </div>

            {/* Current Month Spending Status Alert */}
            <div className="mt-4 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Active Month: {monthName} {year}
                </span>
                <span className="text-lg font-black text-slate-900 font-outfit">
                  {formatCurrency(totalExpense, currency)} Total Spent
                </span>
              </div>
              {overBudgetCount > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-xl text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{overBudgetCount} Over Budget</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Within Budget</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Body: Option Selection */}
          <div className="p-6 space-y-4">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Choose Reset Action:
            </label>

            {/* Option 1: Reset Monthly Spend to 0 */}
            <div
              onClick={() => setSelectedAction('spend')}
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                selectedAction === 'spend'
                  ? 'border-rose-500 bg-rose-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                  selectedAction === 'spend'
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {selectedAction === 'spend' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Reset Monthly Spend to ₹0 / $0</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-extrabold">
                      Recommended
                    </span>
                  </h4>
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Clears all expense transactions recorded for <strong>{monthName} {year}</strong> across all {categoryLimits.length} categories. Your category limits and income remain intact.
                </p>
              </div>
            </div>

            {/* Option 2: Reset Category Limits to Default */}
            <div
              onClick={() => setSelectedAction('limits')}
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                selectedAction === 'limits'
                  ? 'border-rose-500 bg-rose-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                  selectedAction === 'limits'
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {selectedAction === 'limits' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Reset All Category Limits to Default
                  </h4>
                  <Sliders className="w-4 h-4 text-slate-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Restores standard budget limits for all categories (e.g. ₹10,000 for Groceries, ₹4,000 for Dining, ₹3,500 for Utilities, etc.).
                </p>
              </div>
            </div>

            {/* Option 3: Reset Everything to 0 */}
            <div
              onClick={() => setSelectedAction('both')}
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                selectedAction === 'both'
                  ? 'border-rose-500 bg-rose-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                  selectedAction === 'both'
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {selectedAction === 'both' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Reset Both (Spend + Limits to 0)
                  </h4>
                  <Trash2 className="w-4 h-4 text-slate-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Sets all category budget limits to zero and wipes all monthly spending for a completely clean slate.
                </p>
              </div>
            </div>

            {/* Safety & Undo Guarantee Banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <Undo2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-900 block">Instant Undo Guaranteed</span>
                A floating <strong className="text-emerald-700">"Undo & Restore"</strong> banner will immediately appear. You can revert this action in one click if clicked accidentally.
              </div>
            </div>

            {/* Confirmation step if user clicks reset */}
            {isConfirming && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-900 space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Are you sure you want to reset?</span>
                </div>
                <p>
                  {selectedAction === 'spend'
                    ? `This will clear all ${formatCurrency(totalExpense, currency)} spent in ${monthName} ${year} across all categories.`
                    : selectedAction === 'limits'
                    ? 'This will restore all category spending limits to their default values.'
                    : 'This will reset all monthly category spending and limits.'}
                </p>
              </motion.div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              id="btn-cancel-reset-categories"
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            {!isConfirming ? (
              <button
                id="btn-confirm-reset-categories-first"
                type="button"
                onClick={() => setIsConfirming(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {selectedAction === 'spend'
                    ? 'Reset Monthly Spend'
                    : selectedAction === 'limits'
                    ? 'Reset Limits to Default'
                    : 'Reset Everything'}
                </span>
              </button>
            ) : (
              <button
                id="btn-execute-reset-categories"
                type="button"
                onClick={handleExecute}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Reset All Categories Now</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
