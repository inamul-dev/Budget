import React, { useState } from 'react';
import { Plus, X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { BankAccount, Category, CategoryLimit, Currency, Transaction } from '../types';
import { USD_TO_INR } from '../data/initialData';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  categoryLimits: CategoryLimit[];
  bankAccounts: BankAccount[];
  preselectedCategory?: Category;
  defaultTracker?: 'monthly' | 'yearly';
  onAddTransaction: (tx: Omit<Transaction, 'id'>, targetTracker: 'monthly' | 'yearly') => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  currency,
  categoryLimits,
  bankAccounts,
  preselectedCategory,
  defaultTracker = 'monthly',
  onAddTransaction,
}) => {
  const [trackerMode, setTrackerMode] = useState<'monthly' | 'yearly'>(defaultTracker);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(preselectedCategory || 'Food & Dining');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [bankAccountName, setBankAccountName] = useState<string>(
    bankAccounts[0]?.name || 'Cash'
  );
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!title.trim() || isNaN(amtNum) || amtNum <= 0) return;

    const isINR = currency === 'INR';
    const amountINR = isINR ? amtNum : amtNum * USD_TO_INR;
    const amountUSD = isINR ? amtNum / USD_TO_INR : amtNum;

    onAddTransaction(
      {
        title: title.trim(),
        amount: amtNum,
        amountINR: Math.round(amountINR),
        amountUSD: Number(amountUSD.toFixed(2)),
        category: type === 'income' ? 'Salary & Income' : category,
        type,
        date,
        source: 'manual',
        bankAccountName,
        notes: notes.trim() || undefined,
      },
      trackerMode
    );

    onClose();
  };

  return (
    <div
      id="add-transaction-modal-backdrop"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
    >
      <div
        id="add-transaction-modal-content"
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto relative space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-outfit">
              Add New Transaction
            </h3>
            <p className="text-xs text-slate-700">
              Select which independent tracker receives this entry
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tracker Destination Selector (Separate Trackers) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Add To Tracker (Runs Separately):
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setTrackerMode('monthly')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                trackerMode === 'monthly'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📅</span>
              <span>Monthly Tracker</span>
            </button>
            <button
              type="button"
              onClick={() => setTrackerMode('yearly')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                trackerMode === 'yearly'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📊</span>
              <span>Yearly Tracker</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-700 mt-1">
            {trackerMode === 'monthly'
              ? '✅ Stored strictly in your Monthly Tracker. Does not affect Yearly or Life.'
              : '✅ Stored strictly in your Yearly Tracker. Does not affect Monthly or Life.'}
          </p>
        </div>

        {/* Expense vs Income Switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Money Out (Expense)</span>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Money In (Income)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Merchant Name
            </label>
            <input
              id="input-new-tx-title"
              type="text"
              placeholder={type === 'expense' ? 'e.g. Grocery Store, Swiggy, Uber' : 'e.g. Monthly Salary, Freelance'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-600">
                  {currency === 'INR' ? '₹' : '$'}
                </span>
                <input
                  id="input-new-tx-amount"
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-outfit font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date
              </label>
              <input
                id="input-new-tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                id="select-new-tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                {categoryLimits.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.emoji} {c.category}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Paid With / Deposited To
            </label>
            <select
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.bankLogo} {b.name} ({b.accountNumber})
                </option>
              ))}
              <option value="Cash / Pocket Money">💵 Cash / Pocket Money</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Optional Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Split with roomie, discount applied"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-new-tx"
              type="submit"
              className="px-5 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
