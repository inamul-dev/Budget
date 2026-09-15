import React, { useState } from 'react';
import {
  Sparkles,
  X,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  FileText,
  Plus,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import {
  AIAdvisorResponse,
  CanIAffordResponse,
  Category,
  CategoryLimit,
  Currency,
  TrackerType,
  Transaction,
} from '../types';
import { formatCurrency } from '../utils/formatters';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  categoryLimits: CategoryLimit[];
  transactions: Transaction[];
  initialMode?: 'afford' | 'review' | 'paste';
  trackerType?: TrackerType;
  onAddTransaction: (tx: Omit<Transaction, 'id'>, targetTracker?: TrackerType) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currency,
  categoryLimits,
  transactions,
  initialMode = 'afford',
  trackerType = 'monthly',
  onAddTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'afford' | 'review' | 'paste'>(initialMode);

  // "Can I Afford This?" form states
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Shopping');
  const [loadingAfford, setLoadingAfford] = useState(false);
  const [affordResult, setAffordResult] = useState<CanIAffordResponse | null>(null);

  // AI Advisor Review states
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState<AIAdvisorResponse | null>(null);

  // Bank SMS / Text Auto-Parse states
  const [smsText, setSmsText] = useState('');
  const [loadingParse, setLoadingParse] = useState(false);
  const [parseResult, setParseResult] = useState<{
    title: string;
    amount: number;
    type: 'expense' | 'income';
    category: Category;
  } | null>(null);

  if (!isOpen) return null;

  // Calculate current month metrics
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTxs = transactions.filter((t) => t.date.startsWith(currentYearMonth));

  const totalIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (currency === 'INR' ? t.amountINR : t.amountUSD), 0);

  const totalExpense = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (currency === 'INR' ? t.amountINR : t.amountUSD), 0);

  // Category specific spent & limit
  const catObj = categoryLimits.find((c) => c.category === selectedCategory);
  const catLimit = catObj ? (currency === 'INR' ? catObj.limitINR : catObj.limitUSD) : 0;
  const catSpent = monthTxs
    .filter((t) => t.type === 'expense' && t.category === selectedCategory)
    .reduce((sum, t) => sum + (currency === 'INR' ? t.amountINR : t.amountUSD), 0);

  // Handle "Can I Afford This?" submission
  const handleCheckAffordability = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(itemPrice);
    if (!itemName.trim() || isNaN(priceNum) || priceNum <= 0) return;

    setLoadingAfford(true);
    setAffordResult(null);

    try {
      const response = await fetch('/api/ai/can-i-afford', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          price: priceNum,
          currency,
          category: selectedCategory,
          categoryBudget: catLimit,
          categorySpent: catSpent,
          totalIncome,
          totalMonthlySpent: totalExpense,
        }),
      });

      const json = await response.json();
      if (json.success && json.data) {
        setAffordResult(json.data);
      }
    } catch (err) {
      console.error('Failed to call AI buddy afford endpoint', err);
    } finally {
      setLoadingAfford(false);
    }
  };

  // Handle General AI Review
  const handleGenerateReview = async () => {
    setLoadingReview(true);
    setReviewResult(null);

    const exceededCategories = categoryLimits
      .filter((cl) => {
        const limit = currency === 'INR' ? cl.limitINR : cl.limitUSD;
        const spent = monthTxs
          .filter((t) => t.type === 'expense' && t.category === cl.category)
          .reduce((sum, t) => sum + (currency === 'INR' ? t.amountINR : t.amountUSD), 0);
        return spent > limit;
      })
      .map((cl) => cl.category);

    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          monthlyIncome: totalIncome,
          monthlySpent: totalExpense,
          savingsRate,
          exceededCategories,
          topExpenseCategory: selectedCategory,
        }),
      });

      const json = await response.json();
      if (json.success && json.data) {
        setReviewResult(json.data);
      }
    } catch (err) {
      console.error('Failed to get review from AI advisor', err);
    } finally {
      setLoadingReview(false);
    }
  };

  // Handle Bank SMS parse
  const handleParseSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;

    setLoadingParse(true);
    setParseResult(null);

    try {
      const res = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: smsText, currency }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setParseResult(json.data);
      }
    } catch (err) {
      console.error('Failed to parse SMS', err);
    } finally {
      setLoadingParse(false);
    }
  };

  const handleConfirmAddParsed = () => {
    if (!parseResult) return;
    const isINR = currency === 'INR';
    const amountINR = isINR ? parseResult.amount : parseResult.amount * 85;
    const amountUSD = isINR ? parseResult.amount / 85 : parseResult.amount;

    onAddTransaction({
      title: parseResult.title,
      amount: parseResult.amount,
      amountINR: Math.round(amountINR),
      amountUSD: Number(amountUSD.toFixed(2)),
      category: parseResult.category,
      type: parseResult.type,
      date: new Date().toISOString().split('T')[0],
      source: 'sms_import',
      notes: 'Auto-fetched from pasted bank text',
    }, trackerType);

    setParseResult(null);
    setSmsText('');
    onClose();
  };

  return (
    <div
      id="ai-assistant-modal-backdrop"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
    >
      <div
        id="ai-assistant-modal-content"
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto relative"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-outfit">
                Buddy — Your AI Budget Friend
              </h3>
              <p className="text-xs text-slate-700">
                Friendly tracking & advising so you never overspend
              </p>
            </div>
          </div>

          <button
            id="btn-close-ai-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Interactive Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('afford')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'afford'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🛍️</span>
            <span>Can I Afford This?</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('review');
              if (!reviewResult) handleGenerateReview();
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>💡</span>
            <span>Buddy's Review</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>💬</span>
            <span>Auto-Fetch SMS</span>
          </button>
        </div>

        {/* TAB 1: CAN I AFFORD THIS? (Core User Requirement) */}
        {activeTab === 'afford' && (
          <div className="mt-4 space-y-4">
            <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-100 text-xs text-purple-900">
              <span className="font-bold">How it works:</span> Tell Buddy what you want to buy and the price. Buddy will check your monthly allowance and let you know if it's safe or too expensive right now!
            </div>

            <form onSubmit={handleCheckAffordability} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  What do you want to buy?
                </label>
                <input
                  id="input-afford-item-name"
                  type="text"
                  placeholder="e.g. Nike Running Shoes, Video Game, Weekend Outing"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price ({currency})
                  </label>
                  <input
                    id="input-afford-item-price"
                    type="number"
                    min={1}
                    placeholder={`Amount in ${currency}`}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    id="select-afford-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {categoryLimits.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.emoji} {c.category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Current category status summary */}
              <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-700 flex justify-between items-center">
                <span>
                  Current {selectedCategory} Budget: <b>{formatCurrency(catLimit, currency)}</b>
                </span>
                <span>
                  Remaining: <b className="text-emerald-700">{formatCurrency(catLimit - catSpent, currency)}</b>
                </span>
              </div>

              <button
                id="btn-ask-buddy-submit"
                type="submit"
                disabled={loadingAfford}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingAfford ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Buddy is calculating your budget...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Ask Buddy: Can I Buy This?</span>
                  </>
                )}
              </button>
            </form>

            {/* AI Decision Output Card */}
            {affordResult && (
              <div
                id="ai-afford-verdict-card"
                className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                  affordResult.decision === 'YES'
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : affordResult.decision === 'WAIT'
                    ? 'border-rose-300 bg-rose-50/50'
                    : 'border-amber-300 bg-amber-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {affordResult.decision === 'YES'
                        ? '🎉'
                        : affordResult.decision === 'WAIT'
                        ? '🛑'
                        : '⚠️'}
                    </span>
                    <div>
                      <span
                        className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                          affordResult.decision === 'YES'
                            ? 'bg-emerald-200 text-emerald-900'
                            : affordResult.decision === 'WAIT'
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {affordResult.decision === 'YES'
                          ? 'YES! GO FOR IT'
                          : affordResult.decision === 'WAIT'
                          ? 'TOO EXPENSIVE RIGHT NOW'
                          : 'PROCEED WITH CAUTION'}
                      </span>
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  {affordResult.headline}
                </h4>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {affordResult.friendlyAdvice}
                </p>

                {affordResult.smartAlternative && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60 text-xs text-slate-800 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span><b>Buddy's Tip:</b> {affordResult.smartAlternative}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUDDY'S SPENDING REVIEW */}
        {activeTab === 'review' && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Personalized Financial Coach Tips
              </span>
              <button
                type="button"
                onClick={handleGenerateReview}
                disabled={loadingReview}
                className="text-xs text-purple-700 hover:text-purple-800 font-bold cursor-pointer"
              >
                {loadingReview ? 'Analyzing...' : '🔄 Refresh Review'}
              </button>
            </div>

            {loadingReview ? (
              <div className="text-center py-10 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  Buddy is reviewing your transactions and budget limits...
                </p>
              </div>
            ) : reviewResult ? (
              <div className="space-y-3">
                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 space-y-1">
                  <p className="text-xs font-bold text-purple-900">
                    {reviewResult.greeting}
                  </p>
                  <p className="text-xs text-purple-800 font-medium">
                    {reviewResult.summaryHeadline}
                  </p>
                </div>

                <div className="space-y-2">
                  {reviewResult.tips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{tip.title}</span>
                      </div>
                      <p className="text-xs text-slate-700 pl-5.5">
                        {tip.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-center text-xs font-bold text-indigo-600 pt-1">
                  {reviewResult.cheer}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 3: AUTO-FETCH FROM BANK SMS / TEXT (Core User Requirement) */}
        {activeTab === 'paste' && (
          <div className="mt-4 space-y-4">
            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100 text-xs text-blue-900">
              <span className="font-bold">Zero-effort logging:</span> Copy and paste any bank SMS notification or payment receipt (e.g. UPI, HDFC, Chase debit alert). Buddy will automatically extract merchant, amount, and category!
            </div>

            <form onSubmit={handleParseSms} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste Bank SMS / Transaction text
                </label>
                <textarea
                  id="textarea-bank-sms"
                  rows={3}
                  placeholder="e.g. HDFC Bank: INR 450.00 debited from a/c **4920 on 12-Sep-26 to Swiggy UPI. Avl bal INR 145,000."
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              {/* Sample quick buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-600">Sample SMS:</span>
                <button
                  type="button"
                  onClick={() =>
                    setSmsText('Debited INR 1,250.00 at Starbucks Coffee on 14-Sep via Card **8112')
                  }
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  ☕ Starbucks
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSmsText('Salary credited of Rs 95,000.00 from Acme Corp to account **4920 on 01-Sep')
                  }
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  💵 Salary
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSmsText('Paid $45.20 at Trader Joes on 13-Sep via Apple Pay')
                  }
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  🛒 Trader Joe's
                </button>
              </div>

              <button
                type="submit"
                disabled={loadingParse}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingParse ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Auto-fetching details...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Auto-Extract Transaction</span>
                  </>
                )}
              </button>
            </form>

            {/* Extracted preview */}
            {parseResult && (
              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase">
                    Detected Transaction
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md">
                    Ready to Save
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-800">
                  <div>
                    Merchant: <b>{parseResult.title}</b>
                  </div>
                  <div>
                    Amount: <b>{formatCurrency(parseResult.amount, currency)}</b>
                  </div>
                  <div>
                    Category: <b>{parseResult.category}</b>
                  </div>
                  <div>
                    Type: <b className="capitalize">{parseResult.type}</b>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmAddParsed}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirm & Save to Expenses</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
