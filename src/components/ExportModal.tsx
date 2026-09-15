import React from 'react';
import { Download, Printer, X, FileText, CheckCircle2, Shield } from 'lucide-react';
import { Currency, Transaction } from '../types';
import { exportTransactionsToCSV, formatCurrency, getConvertedAmount } from '../utils/formatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyTransactions: Transaction[];
  yearlyTransactions: Transaction[];
  currency: Currency;
  activeTab: 'monthly' | 'yearly' | 'life';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  monthlyTransactions,
  yearlyTransactions,
  currency,
  activeTab,
}) => {
  const [exportSource, setExportSource] = React.useState<'monthly' | 'yearly' | 'both'>(
    activeTab === 'yearly' ? 'yearly' : 'monthly'
  );

  if (!isOpen) return null;

  const targetTransactions =
    exportSource === 'monthly'
      ? monthlyTransactions
      : exportSource === 'yearly'
      ? yearlyTransactions
      : [...monthlyTransactions, ...yearlyTransactions];

  const handleDownloadCSV = () => {
    exportTransactionsToCSV(targetTransactions, currency);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const totalSpent = targetTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + getConvertedAmount(t, currency), 0);

  const totalIncome = targetTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + getConvertedAmount(t, currency), 0);

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
    >
      <div
        id="export-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto relative space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-outfit">
                Export Budget & Expenses
              </h3>
              <p className="text-xs text-slate-700">
                Official records in {currency === 'INR' ? 'Indian Rupee (₹)' : 'US Dollar ($)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Tracker Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Tracker Ledger to Export
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setExportSource('monthly')}
              className={`py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                exportSource === 'monthly'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 Monthly ({monthlyTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setExportSource('yearly')}
              className={`py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                exportSource === 'yearly'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Yearly ({yearlyTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setExportSource('both')}
              className={`py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                exportSource === 'both'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combined All
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-700 block">Total Records</span>
            <span className="font-black text-slate-900 font-outfit text-base">
              {targetTransactions.length}
            </span>
          </div>
          <div>
            <span className="text-slate-700 block">Total Inflow</span>
            <span className="font-black text-emerald-600 font-outfit text-sm">
              {formatCurrency(totalIncome, currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-700 block">Total Spent</span>
            <span className="font-black text-rose-600 font-outfit text-sm">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
        </div>

        {/* 2 Export Options: CSV and PDF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* CSV Option */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold mb-2">
                CSV
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                Download CSV Spreadsheet
              </h4>
              <p className="text-[11px] text-slate-700 mt-1">
                Universal Excel, Google Sheets & Numbers compatible spreadsheet with all columns.
              </p>
            </div>

            <button
              id="btn-download-csv"
              type="button"
              onClick={handleDownloadCSV}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download .CSV</span>
            </button>
          </div>

          {/* PDF / Print Option */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold mb-2">
                PDF
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                Print or Save as PDF Report
              </h4>
              <p className="text-[11px] text-slate-700 mt-1">
                Generates a clean, beautifully formatted financial statement report ready to print or save.
              </p>
            </div>

            <button
              id="btn-print-pdf"
              type="button"
              onClick={handlePrintReport}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Save as PDF / Print</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-700 pt-1">
          🔒 All financial exports are computed locally on your device for strict confidentiality.
        </div>
      </div>
    </div>
  );
};
