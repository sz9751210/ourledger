import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Expense, Ledger, User, AppNotification, CurrencyCode, Category } from '../types';
import { MOCK_LEDGERS, USERS, DEFAULT_CATEGORIES } from '../constants';
import { Language, translations } from '../locales';

interface AppState {
  currentUser: User;
  users: User[];
  activeLedgerId: string;
  ledgers: Ledger[];
  expenses: Expense[];
  categories: Category[];
  notifications: AppNotification[];
  // Settings
  language: Language;
  darkMode: boolean;
  baseCurrency: CurrencyCode;
  rates: Record<string, number>;
  monthlyBudget: number; // New: Monthly Budget Limit
  
  // Helpers
  activeLedgerMembers: User[];
  getMember: (id: string) => User | undefined;

  // Confirm Dialog State
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive: boolean;
  };
  showConfirm: (title: string, message: string, onConfirm: () => void, isDestructive?: boolean) => void;
  hideConfirm: () => void;

  // Actions
  setActiveLedger: (id: string) => void;
  addLedger: (name: string, memberIds: string[]) => void;
  updateLedger: (id: string, updates: Partial<Ledger>) => void;
  addUser: (name: string, color: string) => string;
  deleteUser: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => string;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getLedgerExpenses: (ledgerId: string) => Expense[];
  calculateBalance: (ledgerId: string, targetUserId?: string) => number;
  settleUp: (ledgerId: string) => void;
  dismissNotification: (id: string) => void;
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  setBaseCurrency: (currency: CurrencyCode) => void;
  setMonthlyBudget: (amount: number) => void; // New Action
  convertAmount: (amount: number, from: CurrencyCode, to: CurrencyCode) => number;
  refreshRates: () => Promise<void>;
  exportData: () => void; // New Action
  t: (key: string, params?: Record<string, string>) => string;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Convert USERS map to array for initial state
  const initialUsers = Object.values(USERS);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const currentUser = users.find(u => u.id === 'u1') || users[0];

  const [activeLedgerId, setActiveLedger] = useState<string>(MOCK_LEDGERS[0].id);
  const [ledgers, setLedgers] = useState<Ledger[]>(MOCK_LEDGERS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Settings State
  const [language, setLanguage] = useState<Language>('zh');
  const [darkMode, setDarkMode] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('TWD');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(30000); // Default budget
  const [rates, setRates] = useState<Record<string, number>>({ TWD: 1, USD: 0.032, JPY: 4.7, EUR: 0.029, KRW: 42 });

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 'e1', ledgerId: 'l1', amount: 450, currency: 'TWD', description: 'Grocery Run', categoryId: 'c1', paidBy: 'u1', date: new Date().toISOString(), splitType: 'equal' },
    { id: 'e2', ledgerId: 'l1', amount: 125, currency: 'TWD', description: 'Coffee', categoryId: 'c1', paidBy: 'u2', date: new Date(Date.now() - 86400000).toISOString(), splitType: 'equal' },
    { id: 'e3', ledgerId: 'l1', amount: 1200, currency: 'TWD', description: 'Internet Bill', categoryId: 'c5', paidBy: 'u1', date: new Date(Date.now() - 172800000).toISOString(), splitType: 'equal' },
    { id: 'e4', ledgerId: 'l2', amount: 25000, currency: 'JPY', description: 'Flight Tickets', categoryId: 'c2', paidBy: 'u1', date: new Date().toISOString(), splitType: 'equal' },
  ]);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  });

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, isDestructive = false) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDestructive
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Derived state: Members of the active ledger
  const activeLedgerMembers = useMemo(() => {
    const ledger = ledgers.find(l => l.id === activeLedgerId);
    if (!ledger) return [currentUser];
    return users.filter(u => ledger.members.includes(u.id));
  }, [activeLedgerId, ledgers, users, currentUser]);

  const getMember = useCallback((id: string) => users.find(u => u.id === id), [users]);

  // Translation Helper
  const t = useCallback((key: string, params?: Record<string, string>) => {
    // Cast to any to allow dynamic key access
    let text = (translations[language] as any)[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [language]);

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'settlement' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  const refreshRates = useCallback(async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/TWD');
      const data = await res.json();
      if (data && data.rates) {
        setRates(data.rates);
        addNotification(t('ratesUpdated'), t('latestRatesFetched'), 'success');
      }
    } catch (err) {
      console.error("Failed to fetch rates", err);
      addNotification(t('error'), 'Failed to fetch rates', 'info');
    }
  }, [addNotification, t]);

  // Fetch Live Rates on Mount
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/TWD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(data.rates);
        }
      })
      .catch(err => console.error("Failed to fetch rates", err));
  }, []);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const convertAmount = useCallback((amount: number, from: CurrencyCode, to: CurrencyCode) => {
    if (from === to) return amount;
    const rateFrom = rates[from] || 1;
    const rateTo = rates[to] || 1;
    const inBase = amount / rateFrom;
    return inBase * rateTo;
  }, [rates]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addUser = (name: string, color: string) => {
    const id = `u_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id,
      name,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
      color
    };
    setUsers(prev => [...prev, newUser]);
    addNotification(t('userAdded'), `${t('added')} ${name}`, 'success');
    return id;
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
       addNotification(t('error'), t('cannotDeleteLastUser'), 'info');
       return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    
    // Remove from all ledgers
    setLedgers(prev => prev.map(l => ({
        ...l,
        members: l.members.filter(mId => mId !== id)
    })));
    
    addNotification(t('userDeleted'), t('deleted'), 'info');
  };

  const addLedger = (name: string, memberIds: string[]) => {
    const newLedger: Ledger = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'trip',
      members: memberIds.length > 0 ? memberIds : [currentUser.id]
    };
    setLedgers(prev => [...prev, newLedger]);
    setActiveLedger(newLedger.id);
    addNotification(t('newLedger'), `${t('added')} ${name}`, 'success');
  };

  const updateLedger = (id: string, updates: Partial<Ledger>) => {
    setLedgers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    addNotification(t('ledgerUpdated'), t('updated'), 'success');
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const id = `c_${Math.random().toString(36).substr(2, 9)}`;
    const newCategory: Category = {
      ...categoryData,
      id,
    };
    setCategories(prev => [...prev, newCategory]);
    addNotification(t('customCategoryAdded'), `${t('added')} ${categoryData.name}`, 'success');
    return id;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addNotification(t('updated'), t('updated'), 'success');
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) return; // Prevent deleting last category
    setCategories(prev => prev.filter(c => c.id !== id));
    addNotification(t('deleted'), t('deleted'), 'info');
  };

  const addExpense = (newExpense: Omit<Expense, 'id'>) => {
    const expense = {
      ...newExpense,
      id: Math.random().toString(36).substr(2, 9),
    };
    setExpenses(prev => [expense, ...prev]);
    if (!expense.isSettlement) {
      addNotification(t('expenseSaved'), `${t('added')} ${expense.description}`, 'success');
    }
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    addNotification(t('expenseUpdated'), `${t('updated')} ${updatedExpense.description}`, 'success');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    addNotification(t('expenseDeleted'), t('deleted'), 'info');
  };

  const getLedgerExpenses = (ledgerId: string) => {
    return expenses.filter(e => e.ledgerId === ledgerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calculateBalance = useCallback((ledgerId: string, targetUserId?: string) => {
    const userId = targetUserId || currentUser.id;
    const ledger = ledgers.find(l => l.id === ledgerId);
    if (!ledger) return 0;

    const ledgerExpenses = expenses.filter(e => e.ledgerId === ledgerId);
    let myNetBalance = 0;

    ledgerExpenses.forEach(expense => {
      const normalizedAmount = convertAmount(expense.amount, expense.currency, baseCurrency);

      if (expense.isSettlement) {
        if (expense.paidBy === userId) {
           myNetBalance += normalizedAmount;
        } else if (expense.beneficiaryId === userId) {
           myNetBalance -= normalizedAmount;
        } else if (expense.splitType === 'settlement' && !expense.beneficiaryId) {
             // In case of undefined settlement structure, assume generic contribution
             // If I paid a settlement, I am + (cleared debt or paid out).
             // If I am not paidBy, assume I am beneficiary? (Dangerous assumption but fallback)
             if (expense.paidBy !== userId) {
                 myNetBalance -= normalizedAmount; 
             }
        }
        return;
      }

      // Standard Expense (Equal)
      if (expense.splitType === 'equal') {
        const memberCount = ledger.members.length || 2;
        const splitAmount = normalizedAmount / memberCount;

        if (expense.paidBy === userId) {
          myNetBalance += (normalizedAmount - splitAmount);
        } else {
          myNetBalance -= splitAmount;
        }
      } 
      // Full for partner
      else if (expense.splitType === 'full_for_partner') {
        const beneficiary = expense.beneficiaryId;
        
        if (expense.paidBy === userId) {
            if (beneficiary !== userId) {
                myNetBalance += normalizedAmount;
            }
        } else {
            if (beneficiary === userId) {
                myNetBalance -= normalizedAmount;
            }
        }
      }
      // Percentage Split
      else if (expense.splitType === 'percentage' && expense.splits) {
         const myPercentage = expense.splits[userId] || 0;
         const myShare = normalizedAmount * (myPercentage / 100);

         if (expense.paidBy === userId) {
             // You paid full amount, but you only owe your share.
             // Net change = + (FullAmount - MyShare)
             myNetBalance += (normalizedAmount - myShare);
         } else {
             // Someone else paid, you owe your share
             // Net change = - MyShare
             myNetBalance -= myShare;
         }
      }
      // Exact Amount Split
      else if (expense.splitType === 'amount' && expense.splits) {
         const myShareRaw = expense.splits[userId] || 0;
         // The split amounts are likely in the original currency.
         // We convert that specific amount to base currency using the same rate as the total amount
         const rate = normalizedAmount / (expense.amount || 1); 
         const myShareNormalized = myShareRaw * rate;

         if (expense.paidBy === userId) {
             myNetBalance += (normalizedAmount - myShareNormalized);
         } else {
             myNetBalance -= myShareNormalized;
         }
      }

    });

    return myNetBalance;
  }, [expenses, currentUser.id, ledgers, baseCurrency, convertAmount]);

  const settleUp = (ledgerId: string) => {
    // Settle up for current user
    const balance = calculateBalance(ledgerId, currentUser.id);
    if (Math.abs(balance) < 0.01) return;
    
    const amount = Math.abs(balance);
    const amountStr = `${baseCurrency} ${amount.toFixed(2)}`;
    
    const ledger = ledgers.find(l => l.id === ledgerId);
    const otherMember = ledger?.members.find(m => m !== currentUser.id) || 'u2';

    const isMyDebt = balance < 0; 

    const settlementExpense: Omit<Expense, 'id'> = {
      ledgerId,
      amount: amount,
      currency: baseCurrency,
      description: 'Settlement Payment',
      categoryId: 'c6',
      paidBy: isMyDebt ? currentUser.id : otherMember, 
      beneficiaryId: isMyDebt ? otherMember : currentUser.id, 
      date: new Date().toISOString(),
      splitType: 'settlement',
      isSettlement: true
    };

    addExpense(settlementExpense);
    addNotification(t('allSettled'), t('settledMessage', { amount: amountStr }), 'settlement');
  };

  const exportData = () => {
    // Generate CSV content
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid By', 'Ledger', 'Split Type'];
    const rows = expenses.map(e => {
        const ledgerName = ledgers.find(l => l.id === e.ledgerId)?.name || 'Unknown Ledger';
        const payerName = users.find(u => u.id === e.paidBy)?.name || 'Unknown';
        const catName = categories.find(c => c.id === e.categoryId)?.name || 'Other';
        const translatedCat = t(catName); // Attempt to translate category key if possible
        
        return [
            new Date(e.date).toISOString().split('T')[0],
            `"${e.description.replace(/"/g, '""')}"`, // Escape quotes
            translatedCat,
            e.amount,
            e.currency,
            payerName,
            ledgerName,
            e.splitType
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ourledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification(t('success'), 'Data exported to CSV', 'success');
  };

  const value = useMemo(() => ({
    currentUser,
    users,
    activeLedgerId,
    activeLedgerMembers,
    getMember,
    ledgers,
    expenses,
    categories,
    notifications,
    language,
    darkMode,
    baseCurrency,
    monthlyBudget,
    rates,
    confirmDialog,
    showConfirm,
    hideConfirm,
    setActiveLedger,
    addLedger,
    updateLedger, 
    addUser,
    deleteUser,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getLedgerExpenses,
    calculateBalance,
    settleUp,
    dismissNotification,
    setLanguage,
    toggleDarkMode,
    setBaseCurrency,
    setMonthlyBudget,
    convertAmount,
    refreshRates,
    exportData,
    t
  }), [activeLedgerId, activeLedgerMembers, ledgers, expenses, categories, notifications, language, darkMode, baseCurrency, rates, confirmDialog, showConfirm, hideConfirm, calculateBalance, convertAmount, refreshRates, t, users, monthlyBudget]);

  return React.createElement(AppContext.Provider, { value }, children);
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};