import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Loader2,
  Lightbulb,
  ShoppingBag,
  AlertOctagon,
  RotateCw,
  Coffee,
  Banknote,
  ShoppingCart,
  Bot,
  SendHorizontal,
  Copy,
  Check,
  Compass,
  ArrowRight,
  ShieldCheck,
  Coins,
  ReceiptText,
} from 'lucide-react';
import {
  AIAdvisorResponse,
  BankAccount,
  CanIAffordResponse,
  Category,
  CategoryLimit,
  Currency,
  LifeMilestone,
  TrackerType,
  Transaction,
} from '../types';
import { formatCurrency } from '../utils/formatters';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onCurrencyChange?: (c: Currency) => void;
  categoryLimits: CategoryLimit[];
  transactions: Transaction[];
  initialMode?: 'chat' | 'afford' | 'review' | 'paste';
  trackerType?: TrackerType;
  bankAccounts?: BankAccount[];
  lifeMilestones?: LifeMilestone[];
  monthlyIncome?: number;
  onAddTransaction: (tx: Omit<Transaction, 'id'>, targetTracker?: TrackerType) => void;
}

const DEFAULT_SUGGESTION_PROMPTS = [
  'How to start SIP in Mutual Funds with my salary?',
  'How to save ₹10,000 to ₹20,000 every month?',
  'Tips to control daily UPI, Swiggy & shopping spends',
  'How much emergency fund should I keep in bank FD?',
  'Should I clear credit card / EMI or invest first?',
  'Best ways to save for buying a home or car in India',
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currency,
  onCurrencyChange,
  categoryLimits,
  transactions,
  initialMode = 'chat',
  trackerType = 'monthly',
  bankAccounts = [],
  lifeMilestones = [],
  monthlyIncome = 0,
  onAddTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'afford' | 'review' | 'paste'>(initialMode);
  // Default currency is INR (Primary), Dollar is second option
  const [activeCurrency, setActiveCurrency] = useState<Currency>(currency || 'INR');

  // Keep in sync with parent currency if changed outside
  useEffect(() => {
    if (currency) {
      setActiveCurrency(currency);
    }
  }, [currency]);

  const handleToggleCurrency = (newCurrency: Currency) => {
    setActiveCurrency(newCurrency);
    onCurrencyChange?.(newCurrency);
  };

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
    }
  }, [isOpen, initialMode]);

  // Chat Tab States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Namaste! I am your AI Financial Guide.

I help you in simple, plain English to manage your money:
• Save Smartly: Emergency fund in Bank FD/RD, Public Provident Fund (PPF), and the 50-30-20 rule.
• Cut Extra Expenses: Control daily UPI spends (GPay/PhonePe), Swiggy/Zomato orders, and cancel unused OTT apps.
• Start Investing Easily: Monthly Mutual Fund SIPs in Nifty 50, Sovereign Gold Bonds, and PPF.
• Plan Family Goals: Buying a home or car, wedding fund, or child education.

Currency is set to Indian Rupee (₹) as primary, with US Dollar ($) as second option.
Ask any question below in simple words, or tap a quick topic to start.`,
      timestamp: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, loadingChat]);

  if (!isOpen) return null;

  // Calculate current month metrics using activeCurrency
  const isINR = activeCurrency === 'INR';
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTxs = transactions.filter((t) => t.date.startsWith(currentYearMonth));

  const recordedIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (activeCurrency === 'INR' ? t.amountINR : t.amountUSD), 0);

  const effectiveIncome = recordedIncome > 0 ? recordedIncome : monthlyIncome > 0 ? monthlyIncome : (isINR ? 75000 : 900);

  const totalExpense = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (activeCurrency === 'INR' ? t.amountINR : t.amountUSD), 0);

  const savingsRate = effectiveIncome > 0 ? Math.max(0, Math.round(((effectiveIncome - totalExpense) / effectiveIncome) * 100)) : 0;

  // Category specific spent & limit
  const catObj = categoryLimits.find((c) => c.category === selectedCategory);
  const catLimit = catObj ? (activeCurrency === 'INR' ? catObj.limitINR : catObj.limitUSD) : 0;
  const catSpent = monthTxs
    .filter((t) => t.type === 'expense' && t.category === selectedCategory)
    .reduce((sum, t) => sum + (activeCurrency === 'INR' ? t.amountINR : t.amountUSD), 0);

  // Over budget categories
  const exceededCategories = categoryLimits
    .filter((cl) => {
      const limit = activeCurrency === 'INR' ? cl.limitINR : cl.limitUSD;
      const spent = monthTxs
        .filter((t) => t.type === 'expense' && t.category === cl.category)
        .reduce((sum, t) => sum + (activeCurrency === 'INR' ? t.amountINR : t.amountUSD), 0);
      return spent > limit;
    })
    .map((cl) => cl.category);

  // Highest spending category
  const categorySpends = categoryLimits.map((cl) => {
    const spent = monthTxs
      .filter((t) => t.type === 'expense' && t.category === cl.category)
      .reduce((sum, t) => sum + (activeCurrency === 'INR' ? t.amountINR : t.amountUSD), 0);
    return { category: cl.category, spent };
  });
  categorySpends.sort((a, b) => b.spent - a.spent);
  const topExpenseCategory = categorySpends[0]?.category || 'General';

  // Total liquid bank balances
  const totalBankBalance = bankAccounts.reduce((sum, b) => {
    return sum + (activeCurrency === 'INR' ? b.balanceINR : b.balanceUSD);
  }, 0);

  // Handle Sending Chat Message
  const handleSendChatMessage = async (presetText?: string) => {
    const messageToSend = presetText || chatInput.trim();
    if (!messageToSend || loadingChat) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setLoadingChat(true);

    try {
      const historyPayload = chatMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text,
        }));

      const contextPayload = {
        currency: activeCurrency,
        monthlyIncome: effectiveIncome,
        monthlySpent: totalExpense,
        savingsRate,
        exceededCategories,
        topExpenseCategory,
        bankBalance: totalBankBalance,
        milestones: lifeMilestones.map((m) => ({
          title: m.title,
          targetYears: m.targetYears,
          targetAmount: activeCurrency === 'INR' ? m.targetAmountINR : m.targetAmountUSD,
        })),
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: historyPayload,
          context: contextPayload,
        }),
      });

      const data = await response.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.message || 'No response from financial advisor');
      }
    } catch (err: any) {
      console.error('Chat error', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `Here is simple financial guidance for you:

1. Save First on Salary Day: Put 20% of your income into savings or a bank RD/PPF right when your salary arrives.
2. Build an Emergency Fund: Keep 3 to 6 months of living expenses (${formatCurrency(totalExpense * 6, activeCurrency)}) safe in a bank Fixed Deposit or savings account.
3. Control UPI Spends: Check small daily payments and food delivery apps (Swiggy/Zomato) to prevent budget leaks.
4. Start a Mutual Fund SIP: Invest in a simple Nifty 50 Index Fund for long-term growth.`,
        timestamp: 'Just now',
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
          currency: activeCurrency,
          category: selectedCategory,
          categoryBudget: catLimit,
          categorySpent: catSpent,
          totalIncome: effectiveIncome,
          totalMonthlySpent: totalExpense,
        }),
      });

      const json = await response.json();
      if (json.success && json.data) {
        setAffordResult(json.data);
      }
    } catch (err) {
      console.error('Failed to call AI afford endpoint', err);
    } finally {
      setLoadingAfford(false);
    }
  };

  // Handle General AI Review
  const handleGenerateReview = async () => {
    setLoadingReview(true);
    setReviewResult(null);

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: activeCurrency,
          monthlyIncome: effectiveIncome,
          monthlySpent: totalExpense,
          savingsRate,
          exceededCategories,
          topExpenseCategory,
        }),
      });

      const json = await response.json();
      if (json.success && json.data) {
        setReviewResult(json.data);
      }
    } catch (err) {
      console.error('Failed to generate AI review', err);
    } finally {
      setLoadingReview(false);
    }
  };

  // Handle Bank SMS parse
  const handleParseSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;

    setLoadingParse(true);
    setParseResult(null);

    try {
      const response = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: smsText, currency: activeCurrency }),
      });

      const json = await response.json();
      if (json.success && json.data) {
        setParseResult(json.data);
      }
    } catch (err) {
      console.error('Failed to parse SMS transaction', err);
    } finally {
      setLoadingParse(false);
    }
  };

  const handleApplyParsedTransaction = () => {
    if (!parseResult) return;
    const isCurrentlyINR = activeCurrency === 'INR';
    const amountVal = parseResult.amount;

    onAddTransaction(
      {
        title: parseResult.title || 'Parsed Transaction',
        amount: amountVal,
        amountINR: isCurrentlyINR ? amountVal : amountVal * 85,
        amountUSD: isCurrentlyINR ? amountVal / 85 : amountVal,
        category: parseResult.category || 'Other',
        type: parseResult.type || 'expense',
        date: new Date().toISOString().split('T')[0],
        source: 'sms_import',
        notes: `Imported via SMS Auto-Fetch: "${smsText.slice(0, 45)}..."`,
      },
      trackerType === 'yearly' ? 'yearly' : 'monthly'
    );

    setParseResult(null);
    setSmsText('');
    onClose();
  };

  return (
    <div
      id="ai-assistant-modal-backdrop"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
    >
      <div
        id="ai-assistant-modal-content"
        className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto relative max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-outfit flex items-center gap-2">
                <span>AI Financial Guide</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200/80">
                  India Focus (₹ INR)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Simple advice on savings, cutting expenses, SIP investing, and goals
              </p>
            </div>
          </div>
          <button
            id="btn-close-ai-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Switcher (INR Primary, USD Secondary) */}
        <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-emerald-900">AI Currency:</span>
            <span className="text-[10px] text-emerald-800 hidden sm:inline">
              Tailored for Indian users (₹ INR Primary • $ USD Secondary)
            </span>
          </div>
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-emerald-200 shadow-2xs">
            <button
              id="ai-currency-inr-btn"
              type="button"
              onClick={() => handleToggleCurrency('INR')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 cursor-pointer ${
                activeCurrency === 'INR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>₹ INR</span>
              <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-semibold ${
                activeCurrency === 'INR' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>Primary</span>
            </button>
            <button
              id="ai-currency-usd-btn"
              type="button"
              onClick={() => handleToggleCurrency('USD')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 cursor-pointer ${
                activeCurrency === 'USD'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>$ USD</span>
              <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-semibold ${
                activeCurrency === 'USD' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>Second Option</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl mt-3 shrink-0 overflow-x-auto no-scrollbar">
          <button
            id="tab-ai-chat"
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>AI Advisor</span>
          </button>

          <button
            id="tab-ai-afford"
            type="button"
            onClick={() => setActiveTab('afford')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'afford'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Can I Afford?</span>
          </button>

          <button
            id="tab-ai-review"
            type="button"
            onClick={() => {
              setActiveTab('review');
              if (!reviewResult) handleGenerateReview();
            }}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'review'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Money Review</span>
          </button>

          <button
            id="tab-ai-paste"
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'paste'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>SMS Auto-Fetch</span>
          </button>
        </div>

        {/* TAB 0: INTERACTIVE AI WEALTH ADVISOR CHAT */}
        {activeTab === 'chat' && (
          <div className="mt-3 flex-1 flex flex-col min-h-0 space-y-3">
            {/* Real-time Context Bar */}
            <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 shrink-0">
              <span className="font-semibold text-slate-800">Your Current Numbers:</span>
              <span>Income: <strong className="text-slate-900">{formatCurrency(effectiveIncome, activeCurrency)}</strong></span>
              <span>·</span>
              <span>Spent: <strong className="text-slate-900">{formatCurrency(totalExpense, activeCurrency)}</strong></span>
              <span>·</span>
              <span>Savings Rate: <strong className="text-emerald-700">{savingsRate}%</strong></span>
              {totalBankBalance > 0 && (
                <>
                  <span>·</span>
                  <span>Bank Balance: <strong className="text-blue-700">{formatCurrency(totalBankBalance, activeCurrency)}</strong></span>
                </>
              )}
            </div>

            {/* Chat Stream */}
            <div
              id="ai-chat-messages-container"
              className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[260px] max-h-[380px]"
            >
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    <span>{msg.role === 'user' ? 'You' : 'AI Financial Guide'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[92%] sm:max-w-[85%] relative group ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white shadow-xs rounded-tr-xs'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line font-sans select-text">
                      {msg.text}
                    </div>

                    {msg.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {loadingChat && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                    <span>AI Financial Guide</span>
                    <span>•</span>
                    <span>Thinking...</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Analyzing your monthly numbers and planning simple advice...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Strategy Suggestion Chips */}
            <div className="shrink-0 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Suggested Questions for Indian Earners:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {DEFAULT_SUGGESTION_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChatMessage(prompt)}
                    disabled={loadingChat}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] text-slate-700 transition border border-slate-200/60 cursor-pointer disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center gap-2 shrink-0 pt-1"
            >
              <input
                id="input-ai-chat-question"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask in simple words (e.g. How to start SIP in Mutual Funds, or save ₹10,000 every month)..."
                disabled={loadingChat}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs"
              />
              <button
                id="btn-send-ai-chat"
                type="submit"
                disabled={!chatInput.trim() || loadingChat}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Send</span>
                <SendHorizontal className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 1: CAN I AFFORD THIS? */}
        {activeTab === 'afford' && (
          <div className="mt-4 space-y-4 overflow-y-auto">
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-950">
              <span className="font-bold">Affordability Check:</span> Enter what you want to buy. The AI checks if it fits within your monthly category limits and gives simple, practical advice.
            </div>

            <form onSubmit={handleCheckAffordability} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  What do you want to buy?
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Smartphone, Smart TV, Shoes, Goa trip, Home Appliance"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price ({activeCurrency === 'INR' ? '₹ INR' : '$ USD'})
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    placeholder={activeCurrency === 'INR' ? 'e.g. 15000' : 'e.g. 180'}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Budget Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {categoryLimits.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>
                  {selectedCategory} Limit: <b>{formatCurrency(catLimit, activeCurrency)}</b>
                </span>
                <span>
                  Remaining: <b>{formatCurrency(Math.max(0, catLimit - catSpent), activeCurrency)}</b>
                </span>
              </div>

              <button
                type="submit"
                disabled={loadingAfford}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingAfford ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking your monthly budget...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Check If I Can Afford This</span>
                  </>
                )}
              </button>
            </form>

            {affordResult && (
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  affordResult.decision === 'YES'
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : affordResult.decision === 'WAIT'
                    ? 'border-rose-300 bg-rose-50/50'
                    : 'border-amber-300 bg-amber-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-white/90 border border-slate-200/50 shadow-2xs">
                      {affordResult.decision === 'YES' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : affordResult.decision === 'WAIT' ? (
                        <AlertOctagon className="w-5 h-5 text-rose-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <span
                        className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-md ${
                          affordResult.decision === 'YES'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : affordResult.decision === 'WAIT'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {affordResult.decision === 'YES'
                          ? 'Fits In Budget'
                          : affordResult.decision === 'WAIT'
                          ? 'Crosses Monthly Limit'
                          : 'Caution: Nearing Limit'}
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
                    <span><b>Smart Tip:</b> {affordResult.smartAlternative}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FINANCIAL SPENDING REVIEW */}
        {activeTab === 'review' && (
          <div className="mt-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Monthly Spending & Savings Summary
              </span>
              <button
                type="button"
                onClick={handleGenerateReview}
                disabled={loadingReview}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loadingReview ? 'animate-spin' : ''}`} />
                <span>{loadingReview ? 'Reviewing...' : 'Refresh Summary'}</span>
              </button>
            </div>

            {loadingReview ? (
              <div className="text-center py-10 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  Checking your monthly expenses, limits, and savings rate...
                </p>
              </div>
            ) : reviewResult ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 space-y-1">
                  <p className="text-xs font-bold text-emerald-950">
                    {reviewResult.greeting}
                  </p>
                  <p className="text-xs text-emerald-800">
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
                      <p className="text-xs text-slate-600 pl-5">
                        {tip.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-center p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 italic border border-slate-100">
                  "{reviewResult.cheer}"
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 3: AUTO-PARSE BANK SMS / STATEMENT TEXT */}
        {activeTab === 'paste' && (
          <div className="mt-4 space-y-4 overflow-y-auto">
            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100 text-xs text-blue-900">
              <span className="font-bold">Indian Bank & UPI SMS Reader:</span> Paste any SMS from your bank or payment app (e.g. HDFC, SBI, ICICI, Axis, Google Pay, PhonePe, Paytm). The AI extracts the amount, merchant, and sets the right category.
            </div>

            <form onSubmit={handleParseSMS} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank SMS Notification Text
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste bank or UPI SMS here, e.g. 'Debited INR 480.00 to Swiggy on 14-Sep via UPI Ref 4291'"
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              {/* Sample quick buttons for Indian banks & services */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium">Sample SMS:</span>
                <button
                  type="button"
                  onClick={() =>
                    setSmsText('A/c *4920 debited for INR 480.00 on 14-Sep via UPI to Swiggy UPI Ref 429102')
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition border border-slate-200/50"
                >
                  <Coffee className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>Swiggy (₹480)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSmsText('Salary of Rs 75,000.00 credited to your A/c *8112 on 01-Sep by Acme Technologies')
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition border border-slate-200/50"
                >
                  <Banknote className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span>Salary Credit (₹75k)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSmsText('Paid Rs 890.00 to Blinkit via Google Pay UPI on 12-Sep Ref 91823')
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition border border-slate-200/50"
                >
                  <ShoppingCart className="w-3 h-3 text-blue-700 shrink-0" />
                  <span>Blinkit (₹890)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSmsText('Txn of Rs 2,499.00 spent on your HDFC Bank Card ending 3301 at Amazon India on 10-Sep')
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition border border-slate-200/50"
                >
                  <ShoppingBag className="w-3 h-3 text-purple-700 shrink-0" />
                  <span>Amazon (₹2,499)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSmsText('Paid $45.20 at Supermarket on 13-Sep via Apple Pay')
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition border border-slate-200/50 text-[10px]"
                >
                  <span>USD ($45)</span>
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
                    <span>Reading SMS details...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Auto-Extract Transaction</span>
                  </>
                )}
              </button>
            </form>

            {/* Extracted Transaction Card */}
            {parseResult && (
              <div className="p-4 rounded-2xl bg-white border-2 border-blue-400 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Extracted Details</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      parseResult.type === 'expense'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {parseResult.type.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Merchant:</span>
                    <span className="font-bold text-slate-900">{parseResult.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Detected Amount:</span>
                    <span className="font-black text-slate-900 font-outfit text-sm">
                      {formatCurrency(parseResult.amount, currency)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Auto-Assigned Category:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {parseResult.category}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyParsedTransaction}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record In {trackerType === 'yearly' ? 'Yearly' : 'Monthly'} Tracker</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
