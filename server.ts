import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini instance
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// "Can I Afford This?" AI Buddy Endpoint
app.post('/api/ai/can-i-afford', async (req, res) => {
  try {
    const {
      itemName,
      price,
      currency = 'INR',
      category,
      categoryBudget = 0,
      categorySpent = 0,
      totalIncome = 0,
      totalMonthlySpent = 0,
    } = req.body;

    const currencySymbol = currency === 'USD' ? '$' : '₹';
    const remainingCategoryBudget = categoryBudget - categorySpent;
    const isOverBudget = remainingCategoryBudget < price;
    const remainingPercentage = categoryBudget > 0 ? ((categorySpent / categoryBudget) * 100).toFixed(0) : 0;

    const gemini = getGeminiClient();

    if (gemini) {
      const prompt = `You are a helpful, practical Indian financial advisor for BudgetPal.
TARGET AUDIENCE: Indian users, families, and young professionals.
LANGUAGE: Use simple, plain everyday English. DO NOT use high-level English, heavy financial terms, or difficult words.
CURRENCY: Currency is in Indian Rupee (INR - ₹) as the primary option. If Dollar (USD - $) is chosen, mention USD as a secondary reference.
DO NOT use any emojis in your response.

Evaluate whether the user can afford this item right now:
Item: "${itemName}"
Price: ${currencySymbol}${price} (${currency})
Category: ${category}
Monthly Limit for this Category: ${currencySymbol}${categoryBudget}
Already Spent in this Category: ${currencySymbol}${categorySpent} (${remainingPercentage}% used)
Remaining Balance in this Category: ${currencySymbol}${remainingCategoryBudget}
Total Monthly Income: ${currencySymbol}${totalIncome}
Total Expenses so far: ${currencySymbol}${totalMonthlySpent}

Analyze whether this purchase is safe for their monthly budget right now:
Return a valid JSON object with the following fields:
{
  "decision": "YES" | "CAUTION" | "WAIT",
  "headline": "A short, simple 1-sentence verdict in plain English without emojis",
  "friendlyAdvice": "2-3 simple, practical sentences explaining why based on their budget and monthly savings.",
  "smartAlternative": "One easy, practical Indian money-saving tip (e.g. wait 2 days to check if you really need it, check for festive/bank discount offers on Amazon/Flipkart, or adjust from another expense)."
}
Return ONLY pure JSON.`;

      try {
        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const text = response.text?.trim() || '';
        if (text) {
          try {
            const parsed = JSON.parse(text);
            return res.json({ success: true, data: parsed, aiPowered: true });
          } catch (parseErr) {
            console.error('Failed to parse Gemini JSON output', parseErr);
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini afford check unavailable, falling back to local budget rules:', geminiErr);
      }
    }

    // Fallback smart rule-based evaluation in simple Indian English
    let decision: 'YES' | 'CAUTION' | 'WAIT' = 'YES';
    let headline = `Yes, you can buy this. ${currencySymbol}${price} fits inside your monthly budget.`;
    let friendlyAdvice = `You still have ${currencySymbol}${remainingCategoryBudget} left in your ${category} budget. Spending within your set limits helps you save money smoothly without stress.`;
    let smartAlternative = 'Add this expense to your tracker right away so your balance stays updated.';

    if (isOverBudget) {
      decision = 'WAIT';
      const overBy = price - remainingCategoryBudget;
      headline = `Wait: This item is ${currencySymbol}${overBy} more than your remaining ${category} limit.`;
      friendlyAdvice = `Buying "${itemName}" right now will cross your monthly limit for ${category}. It is better to wait for next month or cut down other extra spends first so your savings stay safe.`;
      smartAlternative = 'Try the 48-hour rule: wait 2 days before buying. Often you will realize you can manage without it or find a better price online.';
    } else if (remainingCategoryBudget - price < categoryBudget * 0.15 && categoryBudget > 0) {
      decision = 'CAUTION';
      headline = `Be careful: This purchase leaves very little money in your ${category} budget.`;
      friendlyAdvice = `After buying "${itemName}", you will have only ${currencySymbol}${remainingCategoryBudget - price} left for ${category} this entire month. Make sure you don't have other urgent needs coming up.`;
      smartAlternative = 'Look for a bank credit/debit card discount offer or seasonal sale price before paying.';
    }

    res.json({
      success: true,
      data: {
        decision,
        headline,
        friendlyAdvice,
        smartAlternative,
      },
      aiPowered: false,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/can-i-afford:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Financial Advisor Overview Endpoint
app.post('/api/ai/advisor', async (req, res) => {
  try {
    const {
      currency = 'INR',
      monthlyIncome = 0,
      monthlySpent = 0,
      savingsRate = 0,
      exceededCategories = [],
      topExpenseCategory = 'General',
    } = req.body;

    const currencySymbol = currency === 'USD' ? '$' : '₹';
    const gemini = getGeminiClient();

    if (gemini) {
      const prompt = `You are a friendly Indian personal finance advisor for BudgetPal.
TARGET AUDIENCE: Everyday Indian people, families, and young earners.
LANGUAGE: Use plain, simple English. DO NOT use high-level English, academic terms, or complicated jargon.
CURRENCY: Primary currency is Indian Rupee (INR - ₹). Dollar (USD - $) is secondary.
DO NOT use any emojis in your response.

The user's monthly money numbers:
- Currency: ${currency} (${currencySymbol})
- Monthly Income: ${currencySymbol}${monthlyIncome}
- Monthly Spent: ${currencySymbol}${monthlySpent}
- Current Savings Rate: ${savingsRate}%
- Categories crossing their limit: ${exceededCategories.length > 0 ? exceededCategories.join(', ') : 'None, great control!'}
- Top spending category: ${topExpenseCategory}

Give 3 simple, practical tips in everyday English that an Indian user can do easily today.
Return a valid JSON object:
{
  "greeting": "A warm, simple 1-sentence opening greeting in plain English",
  "summaryHeadline": "A clear, simple sentence about their spending and savings health",
  "tips": [
    { "title": "Catchy 3-word title", "description": "1-2 simple sentences of practical advice (e.g. UPI habit, Swiggy/dining cut, or starting a small SIP/RD)" },
    { "title": "Catchy 3-word title", "description": "1-2 simple sentences of practical advice" },
    { "title": "Catchy 3-word title", "description": "1-2 simple sentences of practical advice" }
  ],
  "cheer": "A short, encouraging closing sentence in simple English"
}`;

      try {
        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        });

        const text = response.text?.trim() || '';
        if (text) {
          try {
            const parsed = JSON.parse(text);
            return res.json({ success: true, data: parsed, aiPowered: true });
          } catch (parseErr) {
            console.error('Failed to parse Gemini advisor output', parseErr);
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini advisor unavailable, falling back to local financial insights:', geminiErr);
      }
    }

    // High quality simple Indian rule-based fallback
    const hasOverage = exceededCategories.length > 0;
    const tips = [
      {
        title: hasOverage ? 'Control High Spends' : 'Keep Up Good Habits',
        description: hasOverage
          ? `Your spending in ${exceededCategories.join(' and ')} is crossing your set limit. Try taking a break from extra shopping or food delivery for one week.`
          : `You have not crossed any category limits this month. Staying disciplined every month helps your bank balance grow steadily.`,
      },
      {
        title: 'The 50/30/20 Rule',
        description: `Try to keep 50% for basic needs (rent, groceries, bills), 30% for personal lifestyle, and save at least 20% right after your salary comes in.`,
      },
      {
        title: 'Save Small Daily',
        description: `Saving just ${currencySymbol}${currency === 'USD' ? '5' : '150'} a day adds up to over ${currencySymbol}${currency === 'USD' ? '1,800' : '54,000'} in a year. You can put this in a bank RD or Mutual Fund SIP.`,
      },
    ];

    res.json({
      success: true,
      data: {
        greeting: "Namaste! Here is your quick monthly money summary.",
        summaryHeadline: hasOverage
          ? `You have a couple of categories running over budget, but simple adjustments this week will bring things back in control.`
          : `Your money management is on track with a healthy ${savingsRate}% savings rate.`,
        tips,
        cheer: 'Saving regularly today gives peace of mind and financial freedom tomorrow.',
      },
      aiPowered: false,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/advisor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auto-Parse / Categorize Bank SMS or Statement Text
app.post('/api/ai/parse-transaction', async (req, res) => {
  try {
    const { text, currency = 'INR' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const gemini = getGeminiClient();
    if (gemini) {
      const prompt = `Extract transaction details from this Indian bank SMS, UPI notification, or expense note: "${text}".
Recognize common Indian banks and apps: HDFC Bank, SBI, ICICI Bank, Axis Bank, Kotak, Punjab National Bank, Google Pay, PhonePe, Paytm, CRED, Swiggy, Zomato, Blinkit, Zepto, Amazon, Flipkart, Uber, Ola.
Currency: Primary is INR (₹).
DO NOT include any emojis.
Return JSON:
{
  "title": "Clean merchant, payee, or employer name (e.g. Swiggy, Starbucks, Acme Salary, Landlord Rent, Amazon India)",
  "amount": number (positive float),
  "type": "expense" | "income",
  "category": "Food & Dining" | "Housing & Rent" | "Shopping" | "Transportation" | "Entertainment" | "Health & Medical" | "Education" | "Bills & Utilities" | "Salary & Work" | "Other"
}`;
      try {
        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const parsed = JSON.parse(response.text?.trim() || '{}');
        return res.json({ success: true, data: parsed, aiPowered: true });
      } catch (err) {
        console.warn('Gemini parse failed, falling back to regex:', err);
      }
    }

    // Regex fallback with Indian formats
    const amountMatch = text.match(/(?:(?:rs\.?|inr|\$)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rs\.?|inr|usd))/i);
    const amount = amountMatch ? parseFloat((amountMatch[1] || amountMatch[2]).replace(/,/g, '')) : 0;
    const isIncome = /credited|salary|received|deposit/i.test(text);

    let category = 'Other';
    if (/swiggy|zomato|starbucks|food|mcdonald|restaurant|cafe|dinner|lunch|grocery|blinkit|zepto|instamart|dmart|chai/i.test(text)) category = 'Food & Dining';
    else if (/uber|ola|metro|petrol|fuel|gas|train|flight|bus|irctc|fastag/i.test(text)) category = 'Transportation';
    else if (/amazon|flipkart|myntra|zara|store|mall|cloth|ajio|meesho|nykaa/i.test(text)) category = 'Shopping';
    else if (/netflix|movie|cinema|game|spotify|concert|hotstar|pvr|inox|prime/i.test(text)) category = 'Entertainment';
    else if (/rent|maintenance|electricity|wifi|water|bill|airtel|jio|broadband|bescom|tneb|tatapower/i.test(text)) category = 'Bills & Utilities';
    else if (/doctor|hospital|pharmacy|medicine|apollo|1mg|practo|clinic/i.test(text)) category = 'Health & Medical';
    else if (/school|college|tuition|course|udemy|coursera|books/i.test(text)) category = 'Education';
    else if (/salary|bonus|freelance|client|stipend|consulting/i.test(text)) category = 'Salary & Work';
    else if (/rent|maintenance|electricity|wifi|water|bill/i.test(text)) category = 'Bills & Utilities';

    res.json({
      success: true,
      data: {
        title: text.slice(0, 30),
        amount: amount || 50,
        type: isIncome ? 'income' : 'expense',
        category,
      },
      aiPowered: false,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive AI Wealth Advisor & Financial Intelligence Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      context = {},
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message string is required' });
    }

    const {
      currency = 'INR',
      monthlyIncome = 0,
      monthlySpent = 0,
      savingsRate = 0,
      exceededCategories = [],
      topExpenseCategory = 'General',
      bankBalance = 0,
      milestones = [],
    } = context;

    const currencySymbol = currency === 'USD' ? '$' : '₹';
    const gemini = getGeminiClient();

    if (gemini) {
      const systemInstruction = `You are a helpful, practical Indian Personal Finance Guide and Wealth Advisor for BudgetPal.
TARGET AUDIENCE:
Everyday Indian people, salaried employees, college students, and Indian families.

LANGUAGE RULES:
- Use SIMPLE, PLAIN, EVERYDAY ENGLISH.
- DO NOT use high-level, fancy, or academic English. Avoid difficult words like "disaggregate", "alpha generation", "drawdowns", "amortization", "satellite equity", or "volatility buffering".
- Explain everything in simple words, just like a helpful, experienced Indian friend or mentor explaining money to family.
- Keep sentences short, clear, and direct.

CURRENCY RULES:
- PRIMARY CURRENCY IS INDIAN RUPEE (INR - ₹).
- Always give recommendations, calculations, SIP numbers, and budget targets in INR (₹) first. Use standard Indian number formatting (e.g. ₹500, ₹2,000, ₹10,000, ₹50,000, ₹1 Lakh, ₹5 Lakhs, ₹10 Lakhs, ₹1 Crore).
- If the user asks in Dollar ($) or if the currency passed is USD, show the Dollar ($) amount as a SECONDARY option with equivalent INR value in brackets (e.g., "$100 (~₹8,500)").

INDIAN FINANCIAL STRATEGIES & CONTEXT:
1. Saving Strategies:
   - Emergency Fund: Keep 3 to 6 months of living expenses safe in a Bank Fixed Deposit (FD), Recurring Deposit (RD), or High-Interest Savings Account / Liquid Mutual Fund. This protects you during medical needs or job changes.
   - The 50/30/20 Rule for Indian Homes: 50% for Needs (Ghar ka kharcha, rent, groceries, electricity, school fees), 30% for Lifestyle (eating out, movies, clothes, trips), 20% for Savings & Investments.
   - Pay Yourself First: Transfer your savings into investments on your salary credit date (1st to 5th of the month) before spending.
2. Expense Reduction:
   - Daily UPI Spends: Small ₹50, ₹100, ₹200 UPI payments on Google Pay, PhonePe, or Paytm add up to thousands without noticing. Track UPI weekly.
   - Food Delivery & Quick Commerce: Reduce ordering on Swiggy, Zomato, Blinkit, and Zepto to 1 or 2 times a week. Cooking at home easily saves ₹3,000 to ₹8,000 every month.
   - Subscriptions: Check and cancel unused OTT streaming apps (Netflix, Prime, Hotstar, Spotify) or gym memberships.
   - 48-Hour Rule: Wait 2 days before buying anything above ₹2,000 on Amazon or Flipkart to stop impulse buying.
3. Simple Investing for Indian People:
   - Mutual Fund SIP (Systematic Investment Plan): Recommend starting an automated SIP in a low-cost Nifty 50 Index Fund or Flexi-Cap fund. Even ₹1,000 to ₹5,000 every month builds huge wealth over 5 to 10 years through compounding.
   - Safe Government Savings: Public Provident Fund (PPF) for guaranteed 7.1%+ tax-free return backed by the Government of India.
   - Gold: Suggest Sovereign Gold Bonds (SGB) or digital gold for family gold needs instead of jewelry with high making charges.
   - Retirement: National Pension Scheme (NPS) for retirement and extra tax deductions (Section 80CCD).
4. Loans & Debts:
   - Credit Cards: Always pay 100% of the total credit card bill before the due date. Never pay just the "minimum due" because credit cards charge huge interest of 40% to 42% per year!
   - Clear high-interest personal loans or instant app loans before doing big investments.

CRITICAL CONSTRAINTS:
- DO NOT USE ANY EMOJIS. Maintain a clean, professional, and clear text layout.
- Ground advice directly in the user's active financial context where relevant:
  * Current Currency: ${currency} (${currencySymbol})
  * Monthly Income: ${currencySymbol}${monthlyIncome.toLocaleString()}
  * Monthly Spent: ${currencySymbol}${monthlySpent.toLocaleString()}
  * Current Savings Rate: ${savingsRate}%
  * Over-limit Categories: ${exceededCategories.length > 0 ? exceededCategories.join(', ') : 'None'}
  * Top Expense Category: ${topExpenseCategory}
  * Liquid Cash in Accounts: ${currencySymbol}${bankBalance.toLocaleString()}
  * Life Milestones: ${milestones.map((m: any) => `${m.title} (Year ${m.targetYears})`).join(', ') || 'General Wealth Building'}
- Format responses cleanly with brief section headers, clear bullet points, and specific Rupee examples.
- Include 3 practical, simple next steps that the user can do today.`;

      // Build conversation contents for Gemini
      const conversationContents: any[] = [];

      // Add recent history if provided
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-6).forEach((h: any) => {
          if (h.role === 'user' || h.role === 'model') {
            conversationContents.push({
              role: h.role,
              parts: [{ text: h.text }],
            });
          }
        });
      }

      // Add current user prompt
      conversationContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      try {
        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: conversationContents,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        const reply = response.text?.trim() || '';
        if (reply) {
          return res.json({
            success: true,
            reply,
            aiPowered: true,
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini chat unavailable, falling back to algorithmic financial strategist:', geminiErr);
      }
    }

    // Simple Indian financial engine fallback (Plain English, INR primary)
    const lower = message.toLowerCase();
    let reply = '';

    const monthlySurplus = Math.max(0, monthlyIncome - monthlySpent);
    const recEmergencyFund = monthlySpent * 6;
    const isUSD = currency === 'USD';
    const primaryCurrencyDisplay = isUSD ? `$${monthlySurplus} (~₹${(monthlySurplus * 85).toLocaleString()})` : `₹${monthlySurplus.toLocaleString()}`;
    const primaryReserveDisplay = isUSD ? `$${recEmergencyFund} (~₹${(recEmergencyFund * 85).toLocaleString()})` : `₹${recEmergencyFund.toLocaleString()}`;

    if (lower.includes('invest') || lower.includes('stock') || lower.includes('portfolio') || lower.includes('mutual') || lower.includes('sip') || lower.includes('asset') || lower.includes('crypto')) {
      reply = `Simple Investment Plan for Indian Earners:

Based on your monthly remaining savings of ${primaryCurrencyDisplay} (${savingsRate}% savings rate), here is an easy step-by-step investment plan:

1. Start a Monthly Mutual Fund SIP:
   - Put 70% of your extra money (about ${isUSD ? `$${(monthlySurplus * 0.7).toFixed(0)} (~₹${(monthlySurplus * 0.7 * 85).toFixed(0)})` : `₹${(monthlySurplus * 0.7).toFixed(0)}`}/month) into a low-cost Nifty 50 Index Fund or Flexi-Cap Mutual Fund.
   - Set up automatic deduction right after your salary date (like 5th of every month).
   - This invests directly in India's top 50 companies and grows along with India's economy.

2. Safe Government Options (PPF or Bank FD):
   - Put 20% into Public Provident Fund (PPF) or a Bank Fixed Deposit.
   - PPF gives guaranteed 7.1%+ tax-free return backed by the Government of India.

3. Gold for Family Safety:
   - Put the remaining 10% into Sovereign Gold Bonds (SGB) or Gold ETFs online.
   - You get real gold price growth plus 2.5% extra yearly interest, with no making charges or theft risk.

4. Important First Step:
   - Make sure you keep at least 3 to 6 months of living expenses (${primaryReserveDisplay}) safe in a bank account or FD before taking high risk in stocks.`;

    } else if (lower.includes('save') || lower.includes('saving') || lower.includes('emergency') || lower.includes('50/30/20') || lower.includes('cushion')) {
      reply = `Easy Savings Plan for Indian Households:

1. The Simple 50-30-20 Rule:
   - 50% for Needs: Keep ${currencySymbol}${(monthlyIncome * 0.5).toLocaleString()} for essential home costs (rent, groceries, electricity, medicines, school fees).
   - 30% for Wants: Keep ${currencySymbol}${(monthlyIncome * 0.3).toLocaleString()} for dining out, movies, shopping, and trips.
   - 20% for Savings: Move ${currencySymbol}${(monthlyIncome * 0.2).toLocaleString()} straight to your savings account or SIP the day your salary arrives.

2. Build Your Emergency Safety Cushion:
   - Target: 3 to 6 months of living expenses (${primaryReserveDisplay}).
   - Keep this money in a Bank Fixed Deposit (FD) or high-interest savings account.
   - Do not invest this emergency money in risky stocks or locked schemes. Use it only when there is an urgent medical or family emergency.

3. Easy Daily Saving Habit:
   - Save just ${currency === 'USD' ? '$2 (~₹170)' : '₹150 to ₹200'} every single day.
   - In 1 year, this quietly becomes over ${currency === 'USD' ? '$700 (~₹60,000)' : '₹60,000'} without hurting your lifestyle.`;

    } else if (lower.includes('expense') || lower.includes('cut') || lower.includes('reduce') || lower.includes('spend') || lower.includes('bill') || lower.includes('budget')) {
      reply = `Simple Ways to Cut Extra Monthly Expenses in India:

1. Check Daily UPI Spends:
   - Small ₹50, ₹100, ₹250 payments on Google Pay, PhonePe, or Paytm feel small, but they add up to thousands every month.
   - Check your UPI bank statement once every Sunday to see where small leaks are happening.

2. Food Orders and Quick Delivery:
   ${exceededCategories.length > 0 
     ? `- Your category limit for ${exceededCategories.join(' and ')} is crossing the line. Avoid food delivery and retail apps for the next 7 days.`
     : `- Your biggest expense is in ${topExpenseCategory}. Cutting just 10% from this saves ${currencySymbol}${(monthlySpent * 0.1).toFixed(0)} every month.`}
   - Limit Swiggy, Zomato, Blinkit, and Zepto orders to once or twice a week. Home cooked food easily saves ₹4,000 to ₹8,000 every month.

3. The 48-Hour Shopping Rule:
   - Whenever you want to buy something above ${currency === 'USD' ? '$30 (~₹2,500)' : '₹2,000'} on Amazon, Flipkart, or Myntra, wait 2 days.
   - In most cases, the impulse will pass and you will save your hard-earned money.

4. Cancel Forgotten Subscriptions:
   - Check mobile auto-debits for Netflix, Prime, Hotstar, Spotify, and gym fees you rarely use.`;

    } else if (lower.includes('debt') || lower.includes('loan') || lower.includes('credit card') || lower.includes('emi') || lower.includes('interest')) {
      reply = `Clear Your Debt Fast - Simple Indian Guide:

1. Golden Rule for Credit Cards:
   - Always pay 100% of your total credit card bill on time!
   - NEVER pay only the "Minimum Amount Due". Banks charge huge interest rates of 40% to 42% per year on the remaining balance.

2. Pay High-Interest Loans First:
   - Pay off instant mobile loan apps and credit card balances first before anything else.
   - Paying off a 36% interest loan is the same as earning a guaranteed 36% return on your money.

3. Home Loans & Vehicle EMIs:
   - If you have a home loan, try paying just 1 extra EMI every year or increase your EMI by 5% every time your salary increases. This can finish a 20-year loan in 12 to 14 years!`;

    } else {
      reply = `Simple Financial Health Check & Plan for You:

Your Monthly Money Numbers:
- Monthly Income: ${currencySymbol}${monthlyIncome.toLocaleString()} ${isUSD ? `(~₹${(monthlyIncome * 85).toLocaleString()})` : ''}
- Monthly Expenses: ${currencySymbol}${monthlySpent.toLocaleString()}
- Monthly Savings Rate: ${savingsRate}%
- Main Spending Area: ${topExpenseCategory}

3 Simple Steps to Follow:
1. Keep Emergency Money: Keep at least ${primaryReserveDisplay} safe in a bank savings account or Fixed Deposit for peace of mind.
2. Automate Your Savings: Move ${primaryCurrencyDisplay} into a Mutual Fund SIP or PPF right on the day your salary is credited.
3. Control Daily Extra Spends: Keep an eye on UPI and food delivery apps to protect your monthly savings.

You can ask me anything about starting a SIP, saving in PPF/FD, cutting food bills, or planning for a home or car!`;
    }

    res.json({
      success: true,
      reply,
      aiPowered: false,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/chat:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite middleware & Static SPA handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BudgetPal server running on port ${PORT}`);
  });
}

startServer();
