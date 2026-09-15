export type Currency = 'INR' | 'USD';

export type TransactionType = 'expense' | 'income';

export type Category =
  | 'Food & Dining'
  | 'Housing & Rent'
  | 'Shopping'
  | 'Transportation'
  | 'Entertainment'
  | 'Health & Medical'
  | 'Education'
  | 'Bills & Utilities'
  | 'Salary & Income'
  | 'Other';

export interface Transaction {
  id: string;
  title: string;
  amount: number; // Stored in base currency or active currency
  amountINR: number;
  amountUSD: number;
  category: Category;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  source: 'manual' | 'bank_sync' | 'sms_import';
  bankAccountName?: string;
  notes?: string;
}

export interface CategoryLimit {
  category: Category;
  limitINR: number;
  limitUSD: number;
  color: string;
  iconName: string;
  emoji: string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  balanceINR: number;
  balanceUSD: number;
  bankLogo: string;
  color: string;
  lastSynced: string;
  status: 'connected' | 'syncing' | 'synced';
}

export interface LifeMilestone {
  id: string;
  title: string;
  targetYears: number; // e.g., 2, 5, 10, 20
  targetAmountINR: number;
  targetAmountUSD: number;
  category: string;
  emoji: string;
}

export type TrackerType = 'monthly' | 'yearly' | 'life';

export interface LifeBaseline {
  incomeINR: number;
  incomeUSD: number;
  expenseINR: number;
  expenseUSD: number;
}

export interface CanIAffordResponse {
  decision: 'YES' | 'CAUTION' | 'WAIT';
  headline: string;
  friendlyAdvice: string;
  smartAlternative: string;
}

export interface AIAdvisorResponse {
  greeting: string;
  summaryHeadline: string;
  tips: Array<{
    title: string;
    description: string;
  }>;
  cheer: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarColor?: string;
  provider: 'email' | 'google' | 'github' | 'apple' | 'guest';
  phone?: string;
  bio?: string;
  monthlyIncome?: number;
  currencyPreference?: Currency;
  joinedDate?: string;
  alertThreshold?: number;
  aiAdvisorStyle?: 'conservative' | 'balanced' | 'aggressive';
}
