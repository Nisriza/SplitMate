/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Roommate {
  id: string;
  name: string;
  username: string; // Used for login
  password: string; // Used for password authentication
  avatarColor: string; // Tailwind color class like 'bg-indigo-500'
  bankName?: string;  // e.g. Maybank, CIMB, Touch n Go eWallet
  bankAccount?: string; // bank or account number
  qrType?: 'duitnow' | 'bank' | 'other';
  qrCodeDataUrl?: string; // Base64 of actual uploaded QR photo code
}

export interface Group {
  id: string;
  name: string;
  type: 'roommates' | 'housemates';
  houseNo: string;
  roommateIds: string[];
  joinCode: string; // Invite code to join the household group
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  paidById: string; // ID of the roommate who paid
  splitWithIds: string[]; // IDs of roommates sharing the cost
  receiptUrl?: string; // Mock PDF receipt
}

export interface PaymentActivity {
  id: string;
  fromId: string; // Roommate who paid
  toId: string; // Roommate who received
  amount: number;
  date: string;
  note: string;
  status: 'pending' | 'completed';
  proofUrl?: string; // Base64, mock image, or note indicating receipt proof
  proofType?: 'receipt_slip' | 'note_statement' | 'none';
  isOcr?: boolean;
  ocrFileName?: string;
  isRejected?: boolean;
}

export interface AppReminder {
  id: string;
  fromId: string; // sender
  toId: string; // target roommate
  amount: number;
  date: string;
  billTitle?: string;
  isRead: boolean;
}

export type AppPage = 'login' | 'dashboard' | 'add-expense' | 'expense-summary' | 'payment-status';

export interface SplitMateState {
  currentRoommateId: string | null;
  groups: Group[];
  activeGroupId: string;
  roommates: Roommate[];
  expenses: Expense[];
  payments: PaymentActivity[];
}
