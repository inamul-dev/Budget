import { Currency, Transaction } from '../types';
import { USD_TO_INR } from '../data/initialData';

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getConvertedAmount(
  transaction: Transaction,
  currency: Currency
): number {
  if (currency === 'INR') {
    return transaction.amountINR ?? (transaction.amountUSD ? transaction.amountUSD * USD_TO_INR : transaction.amount);
  }
  return transaction.amountUSD ?? (transaction.amountINR ? transaction.amountINR / USD_TO_INR : transaction.amount / USD_TO_INR);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  currency: Currency
) {
  const headers = ['Date', 'Title', 'Category', 'Type', `Amount (${currency})`, 'Source', 'Bank Account', 'Notes'];

  const rows = transactions.map((t) => {
    const amt = getConvertedAmount(t, currency);
    return [
      t.date,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.type.toUpperCase(),
      amt.toFixed(currency === 'INR' ? 0 : 2),
      t.source,
      `"${t.bankAccountName || 'N/A'}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BudgetPal_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
