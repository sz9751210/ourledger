import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Expense, Ledger, User, AppNotification, CurrencyCode, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants'; // 假如後端是空的，可以用這個當預設值
import { Language, translations } from '../locales';
import * as api from './api'; // 引入剛剛建立的 API

interface AppState {
  isLoading: boolean; // 新增 Loading 狀態

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
  monthlyBudget: number;
  
  // Helpers
  activeLedgerMembers: User[];
  getMember: (id: string) => User | undefined;

  // Confirm Dialog
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive: boolean;
  };
  showConfirm: (title: string, message: string, onConfirm: () => void, isDestructive?: boolean) => void;
  hideConfirm: () => void;

  // Actions (現在大多是非同步的)
  setActiveLedger: (id: string) => void;
  addLedger: (name: string, memberIds: string[]) => Promise<void>;
  updateLedger: (id: string, updates: Partial<Ledger>) => Promise<void>;
  addUser: (name: string, color: string) => Promise<string | void>;
  deleteUser: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<string | void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getLedgerExpenses: (ledgerId: string) => Expense[];
  calculateBalance: (ledgerId: string, targetUserId?: string) => number;
  settleUp: (ledgerId: string) => void;
  dismissNotification: (id: string) => void;
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  setBaseCurrency: (currency: CurrencyCode) => void;
  setMonthlyBudget: (amount: number) => void;
  convertAmount: (amount: number, from: CurrencyCode, to: CurrencyCode) => number;
  refreshRates: () => Promise<void>;
  exportData: () => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Data States (初始化為空)
  const [users, setUsers] = useState<User[]>([]);
  const [activeLedgerId, setActiveLedger] = useState<string>('');
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // UI States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, isDestructive: false
  });

  // Settings States
  const [language, setLanguage] = useState<Language>('zh');
  const [darkMode, setDarkMode] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('TWD');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(30000);
  const [rates, setRates] = useState<Record<string, number>>({ TWD: 1 });

  // 暫時的 CurrentUser 邏輯 (取列表第一位)
  const currentUser = useMemo(() => {
    return users.length > 0 ? users[0] : { id: 'loading', name: '...', avatar: '', color: '' } as User;
  }, [users]);

  // --- Helpers ---
  
  const t = useCallback((key: string, params?: Record<string, string>) => {
    let text = (translations[language] as any)[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => text = text.replace(`{${k}}`, v));
    }
    return text;
  }, [language]);

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'settlement' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, isDestructive = false) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, isDestructive });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getMember = useCallback((id: string) => users.find(u => u.id === id), [users]);

  // --- Initialization Effect ---
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        // 並行請求基礎資料
        const [usersRes, ledgersRes, categoriesRes] = await Promise.all([
          api.getUsers(),
          api.getLedgers(),
          api.getCategories()
        ]);

        setUsers(usersRes.data);
        setLedgers(ledgersRes.data);
        
        // 如果後端有分類就用後端的，沒有就用預設
        if (categoriesRes.data && categoriesRes.data.length > 0) {
          setCategories(categoriesRes.data);
        }

        // 設定預設 Active Ledger
        if (ledgersRes.data.length > 0 && !activeLedgerId) {
          setActiveLedger(ledgersRes.data[0].id);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        addNotification(t('error'), 'Failed to connect to server', 'info');
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []); // Run once on mount

  // --- Fetch Expenses on Ledger Change ---
  useEffect(() => {
    if (!activeLedgerId) return;
    
    const loadExpenses = async () => {
      try {
        const res = await api.getExpenses(activeLedgerId);
        setExpenses(res.data);
      } catch (error) {
        console.error("Load expenses failed:", error);
        addNotification(t('error'), 'Failed to load expenses', 'info');
      }
    };
    loadExpenses();
  }, [activeLedgerId]);

  // --- Async Actions ---

  const addLedger = async (name: string, memberIds: string[]) => {
    try {
      const payload = { 
        name, 
        members: memberIds.length > 0 ? memberIds : [currentUser.id],
        type: 'trip' as const
      };
      const res = await api.createLedger(payload);
      const newLedger = res.data;
      
      setLedgers(prev => [...prev, newLedger]);
      setActiveLedger(newLedger.id);
      addNotification(t('newLedger'), `${t('added')} ${name}`, 'success');
    } catch (err) {
      addNotification(t('error'), 'Failed to create ledger', 'info');
    }
  };

  const updateLedger = async (id: string, updates: Partial<Ledger>) => {
    try {
      const res = await api.updateLedger(id, updates);
      setLedgers(prev => prev.map(l => l.id === id ? res.data : l));
      addNotification(t('ledgerUpdated'), t('updated'), 'success');
    } catch (err) {
      addNotification(t('error'), 'Failed to update ledger', 'info');
    }
  };

  const addUser = async (name: string, color: string) => {
    try {
      const payload = {
        name,
        color,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
      };
      const res = await api.createUser(payload);
      const newUser = res.data;
      
      setUsers(prev => [...prev, newUser]);
      addNotification(t('userAdded'), `${t('added')} ${name}`, 'success');
      return newUser.id;
    } catch (err) {
      addNotification(t('error'), 'Failed to create user', 'info');
    }
  };

  const deleteUser = async (id: string) => {
    if (users.length <= 1) {
       addNotification(t('error'), t('cannotDeleteLastUser'), 'info');
       return;
    }
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      // 同步更新前端的 ledger 成員列表 (假設後端也會處理)
      setLedgers(prev => prev.map(l => ({
        ...l,
        members: l.members.filter(mId => mId !== id)
      })));
      addNotification(t('userDeleted'), t('deleted'), 'info');
    } catch (err) {
      addNotification(t('error'), 'Failed to delete user', 'info');
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      const res = await api.createCategory(categoryData);
      const newCategory = res.data;
      setCategories(prev => [...prev, newCategory]);
      addNotification(t('customCategoryAdded'), `${t('added')} ${categoryData.name}`, 'success');
      return newCategory.id;
    } catch (err) {
      addNotification(t('error'), 'Failed to add category', 'info');
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const res = await api.updateCategory(id, updates);
      setCategories(prev => prev.map(c => c.id === id ? res.data : c));
      addNotification(t('updated'), t('updated'), 'success');
    } catch (err) {
      addNotification(t('error'), 'Failed to update category', 'info');
    }
  };

  const deleteCategory = async (id: string) => {
    if (categories.length <= 1) return;
    try {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      addNotification(t('deleted'), t('deleted'), 'info');
    } catch (err) {
      addNotification(t('error'), 'Failed to delete category', 'info');
    }
  };

  const addExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      const res = await api.createExpense(newExpense);
      const savedExpense = res.data;
      
      setExpenses(prev => [savedExpense, ...prev]);
      if (!savedExpense.isSettlement) {
        addNotification(t('expenseSaved'), `${t('added')} ${savedExpense.description}`, 'success');
      }
    } catch (err) {
      console.error(err);
      addNotification(t('error'), 'Failed to save expense', 'info');
    }
  };

  const updateExpense = async (updatedExpense: Expense) => {
    try {
      const res = await api.updateExpense(updatedExpense.id, updatedExpense);
      setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? res.data : e));
      addNotification(t('expenseUpdated'), `${t('updated')} ${updatedExpense.description}`, 'success');
    } catch (err) {
      addNotification(t('error'), 'Failed to update expense', 'info');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      addNotification(t('expenseDeleted'), t('deleted'), 'info');
    } catch (err) {
      addNotification(t('error'), 'Failed to delete expense', 'info');
    }
  };

  // --- Pure Logic Helpers (No API needed) ---

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

  // Fetch rates on mount
  useEffect(() => {
    refreshRates();
  }, []);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const convertAmount = useCallback((amount: number, from: CurrencyCode, to: CurrencyCode) => {
    if (from === to) return amount;
    const rateFrom = rates[from] || 1;
    const rateTo = rates[to] || 1;
    const inBase = amount / rateFrom;
    return inBase * rateTo;
  }, [rates]);

  const activeLedgerMembers = useMemo(() => {
    const ledger = ledgers.find(l => l.id === activeLedgerId);
    if (!ledger) return users.length > 0 ? [users[0]] : [];
    // 這裡增加一個 Set 檢查，避免重複或找不到
    return users.filter(u => ledger.members.includes(u.id));
  }, [activeLedgerId, ledgers, users]);

  const getLedgerExpenses = (ledgerId: string) => {
    // 這裡我們假設 expenses 已經是當前 Ledger 的資料 (由 useEffect 載入)
    // 如果要更嚴謹，可以 filter，但通常 expenses state 只存 activeLedger 的資料
    return expenses
      .filter(e => e.ledgerId === ledgerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        } else if (expense.splitType === 'settlement' && !expense.beneficiaryId && expense.paidBy !== userId) {
             myNetBalance -= normalizedAmount; 
        }
        return;
      }

      if (expense.splitType === 'equal') {
        const memberCount = ledger.members.length || 2;
        const splitAmount = normalizedAmount / memberCount;
        if (expense.paidBy === userId) {
          myNetBalance += (normalizedAmount - splitAmount);
        } else {
          myNetBalance -= splitAmount;
        }
      } 
      else if (expense.splitType === 'full_for_partner') {
        const beneficiary = expense.beneficiaryId;
        if (expense.paidBy === userId && beneficiary !== userId) {
          myNetBalance += normalizedAmount;
        } else if (expense.paidBy !== userId && beneficiary === userId) {
          myNetBalance -= normalizedAmount;
        }
      }
      else if (expense.splitType === 'percentage' && expense.splits) {
         const myPercentage = expense.splits[userId] || 0;
         const myShare = normalizedAmount * (myPercentage / 100);
         if (expense.paidBy === userId) {
             myNetBalance += (normalizedAmount - myShare);
         } else {
             myNetBalance -= myShare;
         }
      }
      else if (expense.splitType === 'amount' && expense.splits) {
         const myShareRaw = expense.splits[userId] || 0;
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
    const balance = calculateBalance(ledgerId, currentUser.id);
    if (Math.abs(balance) < 0.01) return;
    
    const amount = Math.abs(balance);
    const ledger = ledgers.find(l => l.id === ledgerId);
    const otherMember = ledger?.members.find(m => m !== currentUser.id) || 'u2';
    const isMyDebt = balance < 0; 

    const settlementExpense: Omit<Expense, 'id'> = {
      ledgerId,
      amount: amount,
      currency: baseCurrency,
      description: 'Settlement Payment',
      categoryId: 'c6', // 確保你有 ID 為 c6 的分類，或從 categories 尋找 'Settlement'
      paidBy: isMyDebt ? currentUser.id : otherMember, 
      beneficiaryId: isMyDebt ? otherMember : currentUser.id, 
      date: new Date().toISOString(),
      splitType: 'settlement',
      isSettlement: true
    };

    addExpense(settlementExpense); // 這會觸發 API
    // Notification 在 addExpense 裡會被過濾掉 (因為 isSettlement)，這裡手動加
    addNotification(t('allSettled'), t('settledMessage', { amount: `${baseCurrency} ${amount.toFixed(2)}` }), 'settlement');
  };

  const exportData = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid By', 'Ledger', 'Split Type'];
    const rows = expenses.map(e => {
        const ledgerName = ledgers.find(l => l.id === e.ledgerId)?.name || 'Unknown Ledger';
        const payerName = users.find(u => u.id === e.paidBy)?.name || 'Unknown';
        const catName = categories.find(c => c.id === e.categoryId)?.name || 'Other';
        const translatedCat = t(catName);
        return [
            new Date(e.date).toISOString().split('T')[0],
            `"${e.description.replace(/"/g, '""')}"`,
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
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification(t('success'), 'Data exported to CSV', 'success');
  };

  const value = useMemo(() => ({
    isLoading,
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
  }), [isLoading, activeLedgerId, activeLedgerMembers, ledgers, expenses, categories, notifications, language, darkMode, baseCurrency, rates, confirmDialog, showConfirm, hideConfirm, calculateBalance, convertAmount, refreshRates, t, users, monthlyBudget]);

  return React.createElement(AppContext.Provider, { value }, children);
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};