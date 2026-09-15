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
      const prompt = `You are a supportive, friendly personal financial advisor and friend named "Buddy".
Your style: Warm, super easy to understand (simple enough for a 10-year-old or beginner to grasp instantly), supportive, never condescending.
Evaluate whether the user should purchase this item right now:

Item: "${itemName}"
Cost: ${currencySymbol}${price} (${currency})
Category: ${category}
Category Monthly Budget Limit: ${currencySymbol}${categoryBudget}
Already Spent this month in ${category}: ${currencySymbol}${categorySpent} (${remainingPercentage}% used)
Remaining Category Allowance: ${currencySymbol}${remainingCategoryBudget}
Total Monthly Income: ${currencySymbol}${totalIncome}
Total Expenses so far: ${currencySymbol}${totalMonthlySpent}

Analyze whether this is a smart purchase right now or too expensive.
Return a valid JSON object with the following fields:
{
  "decision": "YES" | "CAUTION" | "WAIT",
  "headline": "A friendly 1-sentence verdict with an emoji",
  "friendlyAdvice": "2-3 short, conversational, encouraging sentences explaining why, just like a best friend who wants you to have fun but also reach your savings dreams.",
  "smartAlternative": "One practical, clever money tip or alternative option (e.g., wait until payday, look for a discount, or reallocate from another category)."
}
Return ONLY pure JSON.`;

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
    }

    // Fallback smart rule-based friend evaluation
    let decision: 'YES' | 'CAUTION' | 'WAIT' = 'YES';
    let headline = `Go for it! ${currencySymbol}${price} fits nicely into your plan. 🎉`;
    let friendlyAdvice = `You have ${currencySymbol}${remainingCategoryBudget} left in your ${category} budget. Treating yourself while staying within your boundaries is what healthy budgeting is all about!`;
    let smartAlternative = 'Log this purchase right away so your progress stays 100% accurate!';

    if (isOverBudget) {
      decision = 'WAIT';
      const overBy = price - remainingCategoryBudget;
      headline = `Whoa friend! That’s ${currencySymbol}${overBy} over your ${category} limit right now. 🛑`;
      friendlyAdvice = `Buying "${itemName}" right now will break your monthly goal for ${category}. If you hold off until next month or shift funds from another category, you won't feel stressed later!`;
      smartAlternative = 'Try the 48-hour rule: wait 2 days. If you still crave it, check if you can trim another expense to make room.';
    } else if (remainingCategoryBudget - price < categoryBudget * 0.15 && categoryBudget > 0) {
      decision = 'CAUTION';
      headline = `You can buy it, but it leaves you very close to the edge! ⚠️`;
      friendlyAdvice = `After buying "${itemName}", you'll only have ${currencySymbol}${remainingCategoryBudget - price} left for ${category} this entire month. If you expect other expenses soon, keep that in mind!`;
      smartAlternative = 'Check if there is a discount code or student/credit-card offer to get it for less.';
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
      const prompt = `You are "Buddy", a cheerful, supportive personal budget advisor.
The user is tracking their finances:
- Currency: ${currency} (${currencySymbol})
- Monthly Income: ${currencySymbol}${monthlyIncome}
- Monthly Spent: ${currencySymbol}${monthlySpent}
- Current Savings Rate: ${savingsRate}%
- Categories that exceeded their limit: ${exceededCategories.length > 0 ? exceededCategories.join(', ') : 'None! Great job!'}
- Biggest spending category: ${topExpenseCategory}

Provide 3 short, friendly, high-impact tips (bullet points) that an everyday person or even a youngster can easily grasp and do today. Be warm, motivating, and practical.
Return a valid JSON object:
{
  "greeting": "A warm, energetic 1-sentence opening greeting",
  "summaryHeadline": "A clear, honest sentence about their financial health right now",
  "tips": [
    { "title": "Catchy 3-word title", "description": "1-2 sentences of actionable advice" },
    { "title": "Catchy 3-word title", "description": "1-2 sentences of actionable advice" },
    { "title": "Catchy 3-word title", "description": "1-2 sentences of actionable advice" }
  ],
  "cheer": "A quick punchy cheering sign-off"
}`;

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
    }

    // High quality rule-based fallback
    const hasOverage = exceededCategories.length > 0;
    const tips = [
      {
        title: hasOverage ? 'Pause Overage Alerts' : 'Keep Up The Momentum',
        description: hasOverage
          ? `Your ${exceededCategories.join(' & ')} spending is running high. Try substituting one paid activity with a free hobby this week!`
          : `You haven't blown any limits this month. Staying under budget builds compound freedom!`,
      },
      {
        title: 'The 50/30/20 Rule',
        description: `Aim to keep needs at 50%, fun at 30%, and channel 20% into savings or life goals every single month.`,
      },
      {
        title: 'Micro-Save Daily',
        description: `Saving just ${currencySymbol}${currency === 'USD' ? '5' : '150'} a day adds up to over ${currencySymbol}${currency === 'USD' ? '1,800' : '54,000'} in a single year without feeling any pinch!`,
      },
    ];

    res.json({
      success: true,
      data: {
        greeting: "Hey there! Buddy's got your back on your money journey. 🌟",
        summaryHeadline: hasOverage
          ? `You have a couple of categories running hot, but we can easily balance them out!`
          : `You're managing your cash flow like a champ with a ${savingsRate}% savings rate!`,
        tips,
        cheer: 'Every small coin saved today is a big dream funded tomorrow! 🚀',
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
      const prompt = `Extract transaction details from this bank SMS or expense note: "${text}".
Return JSON:
{
  "title": "Clean merchant or item name",
  "amount": number (positive float),
  "type": "expense" | "income",
  "category": "Food & Dining" | "Housing & Rent" | "Shopping" | "Transportation" | "Entertainment" | "Health & Medical" | "Education" | "Bills & Utilities" | "Salary & Work" | "Other"
}`;
      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json({ success: true, data: parsed, aiPowered: true });
    }

    // Regex fallback
    const amountMatch = text.match(/(?:(?:rs\.?|inr|\$)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rs\.?|inr|usd))/i);
    const amount = amountMatch ? parseFloat((amountMatch[1] || amountMatch[2]).replace(/,/g, '')) : 0;
    const isIncome = /credited|salary|received|deposit/i.test(text);

    let category = 'Other';
    if (/swiggy|zomato|starbucks|food|mcdonald|restaurant|cafe|dinner|lunch|grocery|mart/i.test(text)) category = 'Food & Dining';
    else if (/uber|ola|metro|petrol|fuel|gas|train|flight|bus/i.test(text)) category = 'Transportation';
    else if (/amazon|flipkart|myntra|zara|store|mall|cloth/i.test(text)) category = 'Shopping';
    else if (/netflix|movie|cinema|game|spotify|concert/i.test(text)) category = 'Entertainment';
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
