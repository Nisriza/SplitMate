/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Roommate, Expense, PaymentActivity, Group } from '../types';

// Let's establish realistic seed data
export const INITIAL_ROOMMATES: Roommate[] = [
  { id: '1', name: 'Alex Tan', email: 'alex.tan@splitmate.com', avatarColor: 'bg-emerald-500', bankName: 'Maybank', bankAccount: '1140-1234-5678', qrType: 'duitnow' },
  { id: '2', name: 'Jordan Myers', email: 'jordan@splitmate.com', avatarColor: 'bg-blue-500', bankName: 'CIMB Bank', bankAccount: '8005-9988-7711', qrType: 'bank' },
  { id: '3', name: 'Taylor Reid', email: 'taylor@splitmate.com', avatarColor: 'bg-amber-500', bankName: 'Touch n Go eWallet', bankAccount: '012-345-6789', qrType: 'duitnow' },
  { id: '4', name: 'Morgan Lee', email: 'morgan@splitmate.com', avatarColor: 'bg-violet-500', bankName: 'Public Bank', bankAccount: '3199-5566-2244', qrType: 'other' },
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp-1',
    name: 'Cosy Corner Suite',
    type: 'roommates',
    houseNo: 'Block B-12-05',
    roommateIds: ['1', '2', '3', '4'],
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Monthly Rent',
    amount: 1200,
    date: '2026-05-01',
    category: 'Rent',
    paidById: '1', // Alex paid
    splitWithIds: ['1', '2', '3', '4'], // Split among all 4
  },
  {
    id: 'exp-2',
    title: 'Groceries Restocking',
    amount: 150,
    date: '2026-05-15',
    category: 'Groceries',
    paidById: '2', // Jordan paid
    splitWithIds: ['1', '2', '3', '4'], // Split among all
  },
  {
    id: 'exp-3',
    title: 'High-Speed Internet Broadband',
    amount: 100,
    date: '2026-05-18',
    category: 'Utilities',
    paidById: '3', // Taylor paid
    splitWithIds: ['1', '2', '3', '4'], // Split among all
  }
];

export const INITIAL_PAYMENTS: PaymentActivity[] = [
  {
    id: 'pay-1',
    fromId: '4', // Morgan paid
    toId: '1', // Alex Tan
    amount: 200,
    date: '2026-05-20',
    note: 'Initial Rent share contribution',
    status: 'completed',
  },
  {
    id: 'pay-2',
    fromId: '2', // Jordan paid
    toId: '1', // Alex Tan
    amount: 100,
    date: '2026-05-22',
    note: 'Groceries offset against rent',
    status: 'pending',
  }
];

export const EXPENSE_CATEGORIES = [
  { name: 'Rent', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { name: 'Groceries', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { name: 'Utilities', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { name: 'Houseware', color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { name: 'Maintenance', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { name: 'Other', color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

/**
 * Calculates individual net balances for each roommate.
 * Positive value: Roommate is owed money overall.
 * Negative value: Roommate owes money overall.
 */
export function calculateBalances(
  roommates: Roommate[],
  expenses: Expense[],
  payments: PaymentActivity[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize
  roommates.forEach((r) => {
    balances[r.id] = 0;
  });

  // Calculate expenses
  expenses.forEach((expense) => {
    const totalAmount = expense.amount;
    const splitWith = expense.splitWithIds;
    if (splitWith.length === 0) return;

    const share = totalAmount / splitWith.length;

    // Payer is credited the full amount
    if (balances[expense.paidById] !== undefined) {
      balances[expense.paidById] += totalAmount;
    }

    // Each participant is debited their share
    splitWith.forEach((id) => {
      if (balances[id] !== undefined) {
        balances[id] -= share;
      }
    });
  });

  // Factor in payments (only completed payments change balances directly)
  payments.forEach((payment) => {
    if (payment.status === 'completed') {
      // Receiver got money, so their net credit decreases (they are owed less)
      if (balances[payment.toId] !== undefined) {
        balances[payment.toId] -= payment.amount;
      }
      // Sender gave money, so their net debit decreases (they owe less, or are owed more)
      if (balances[payment.fromId] !== undefined) {
        balances[payment.fromId] += payment.amount;
      }
    }
  });

  return balances;
}

/**
 * Graph Settle-Up Debt Algorithm (Simplified Debt Relations)
 * Takes individual balances (which sum to 0) and computes 
 * a optimal minimal set of transactions to fully settle up.
 */
export interface DebtRelation {
  fromId: string;
  toId: string;
  amount: number;
}

export function computeSuggestedSettlements(
  roommates: Roommate[],
  balances: Record<string, number>
): DebtRelation[] {
  // Map of active balance values
  const list = Object.entries(balances)
    .map(([id, amount]) => ({ id, amount: Math.round(amount * 100) / 100 }))
    .filter((item) => Math.abs(item.amount) > 0.01);

  const debtors = list.filter((x) => x.amount < 0).sort((a, b) => a.amount - b.amount); // biggest debtors first
  const creditors = list.filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount); // biggest creditors first

  const transactions: DebtRelation[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const oweAmount = -debtor.amount;
    const creditAmount = creditor.amount;

    const settledAmount = Math.min(oweAmount, creditAmount);
    
    if (settledAmount > 0.01) {
      transactions.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: Math.round(settledAmount * 100) / 100,
      });
    }

    debtor.amount += settledAmount;
    creditor.amount -= settledAmount;

    if (Math.abs(debtor.amount) < 0.01) dIdx++;
    if (Math.abs(creditor.amount) < 0.01) cIdx++;
  }

  return transactions;
}
