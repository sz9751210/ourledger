
/**
 * DATABASE SCHEMA DESIGN (Supabase/PostgreSQL)
 * -------------------------------------------
 * 
 * ... existing schema ...
 */

export interface User {
  id: string;
  name: string;
  avatar: string; // URL or Initials
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Ledger {
  id: string;
  name: string;
  type: 'daily' | 'trip';
  members: string[]; // User IDs
}

export type SplitType = 'equal' | 'full_for_partner' | 'full_for_me' | 'settlement' | 'percentage' | 'amount';

// Supported Currencies
export type CurrencyCode = 'TWD' | 'USD' | 'JPY' | 'EUR' | 'KRW';

export interface Expense {
  id: string;
  ledgerId: string;
  amount: number;
  currency: CurrencyCode; // The currency this expense was paid in
  description: string;
  categoryId: string;
  paidBy: string; // User ID
  beneficiaryId?: string; // User ID (Specific person who owes the money if splitType is full_for_partner)
  date: string;
  splitType: SplitType;
  isSettlement?: boolean;
  notes?: string;
  receiptImage?: string; // Base64 string or URL
  splits?: Record<string, number>; // Map of UserId -> Value (Percentage or Amount)
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'settlement';
}

// Navigation Types
export type Tab = 'home' | 'add' | 'stats' | 'settings';
