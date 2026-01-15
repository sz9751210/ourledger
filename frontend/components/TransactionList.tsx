import React, { useState, useMemo } from 'react';
import { useAppStore } from '../services/store';
import { Expense } from '../types';
import * as Icons from 'lucide-react';
import { Search, Filter, X } from 'lucide-react';

interface TransactionListProps {
  onEdit: (expense: Expense) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ onEdit }) => {
  const { activeLedgerId, getLedgerExpenses, currentUser, getMember, baseCurrency, convertAmount, categories, t } = useAppStore();
  const expenses = getLedgerExpenses(activeLedgerId);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            expense.amount.toString().includes(searchQuery);
      const matchesCategory = selectedCategory === 'all' || expense.categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  if (expenses.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 min-h-[50vh]">
        <div className="bg-stone-100 dark:bg-stone-900 p-6 rounded-full mb-4">
           <Icons.Receipt size={48} className="opacity-20" />
        </div>
        <p className="text-sm font-medium">{t('noExpenses')}</p>
        <p className="text-xs">{t('tapToAdd')}</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-0 z-10 bg-milk-50/90 dark:bg-stone-950/90 backdrop-blur-sm py-2">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2 hidden md:block">{t('recentActivity')}</h3>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 pl-10 pr-4 py-2.5 rounded-xl border border-stone-100 dark:border-stone-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle (Mobile/Desktop) */}
          <div className="relative">
             <select
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
               className="appearance-none bg-white dark:bg-stone-900 pl-4 pr-10 py-2.5 rounded-xl border border-stone-100 dark:border-stone-800 text-sm font-bold text-stone-600 dark:text-stone-300 focus:outline-none cursor-pointer"
             >
               <option value="all">{t('all')}</option>
               {categories.map(c => (
                 <option key={c.id} value={c.id}>{t(c.name)}</option>
               ))}
             </select>
             <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredExpenses.map((expense) => {
          const category = categories.find(c => c.id === expense.categoryId);
          const Icon = category ? (Icons as any)[category.icon] : Icons.HelpCircle;
          const payer = getMember(expense.paidBy);
          
          const isPayer = expense.paidBy === currentUser.id;
          
          // Convert to base currency for display
          const normalizedTotal = convertAmount(expense.amount, expense.currency, baseCurrency);
          
          let subtext = "";
          let amountColor = "text-stone-800 dark:text-stone-100";

          if (expense.splitType === 'equal') {
            if (isPayer) {
              subtext = `${t('you')} ${t('paid')}`;
              amountColor = "text-softblue-600 dark:text-softblue-400";
            } else {
              subtext = `${payer?.name || t('unknown')} ${t('paid')}`;
              amountColor = "text-clay-500 dark:text-clay-400";
            }
          } else if (expense.splitType === 'full_for_partner') {
            const beneficiary = getMember(expense.beneficiaryId || '');
            const beneficiaryName = beneficiary?.id === currentUser.id ? t('you') : beneficiary?.name;
            
            if (isPayer) {
              subtext = `${t('you')} ${t('paid')} ${t('for')} ${beneficiaryName}`;
              amountColor = "text-softblue-600 dark:text-softblue-400";
            } else {
              subtext = `${payer?.name} ${t('paid')} ${t('for')} ${beneficiaryName}`;
            }
          } else if (expense.isSettlement) {
            subtext = `${payer?.name} ${t('paid')} ${t('settleUp')}`;
          }

          return (
            <div 
              key={expense.id} 
              onClick={() => onEdit(expense)}
              className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm hover:shadow-md border border-stone-100 dark:border-stone-800 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${category?.color || 'bg-gray-100'}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm md:text-base line-clamp-1">{expense.description}</h4>
                  <p className="text-[10px] md:text-xs font-semibold text-stone-400 mt-0.5">{new Date(expense.date).toLocaleDateString()} • {subtext}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end pl-2">
                <span className={`block font-extrabold text-base md:text-lg ${amountColor}`}>
                  {baseCurrency} {normalizedTotal.toFixed(2)}
                </span>
                {expense.currency !== baseCurrency && (
                  <span className="text-[10px] font-semibold text-stone-400">
                    {expense.currency} {expense.amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredExpenses.length === 0 && (
         <div className="text-center py-12 text-stone-400 font-medium text-sm">
            {t('noTransactionsFound')}
         </div>
      )}
    </div>
  );
};