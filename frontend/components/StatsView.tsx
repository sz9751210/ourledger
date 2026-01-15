import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppStore } from '../services/store';
import { Sparkles, Loader2, Lightbulb, Calendar, TrendingUp, Target, DollarSign, X, ChevronRight } from 'lucide-react';
import { getSpendingInsights } from '../services/ai';
import Markdown from 'react-markdown';
import * as Icons from 'lucide-react';
import { Expense } from '../types';

type TimeFilter = 'all' | 'month';

export const StatsView: React.FC = () => {
  const { activeLedgerId, getLedgerExpenses, baseCurrency, convertAmount, categories, monthlyBudget, users, t, language } = useAppStore();
  const expenses = getLedgerExpenses(activeLedgerId);
  const [filter, setFilter] = useState<TimeFilter>('month');
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (e.isSettlement) return false;
      
      if (filter === 'month') {
        const expenseDate = new Date(e.date);
        const now = new Date();
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [expenses, filter]);

  // Aggregate data by category ID (to allow drill-down)
  const categoryStats = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => {
      const cat = categories.find(c => c.id === curr.categoryId);
      const catId = cat?.id || 'other';
      const rawCatName = cat?.name || 'cat_Other';
      
      if (!acc[catId]) {
        acc[catId] = {
          id: catId,
          rawName: rawCatName,
          value: 0
        };
      }
      acc[catId].value += convertAmount(curr.amount, curr.currency, baseCurrency);
      return acc;
    }, {} as Record<string, { id: string, rawName: string, value: number }>);
  }, [filteredExpenses, categories, baseCurrency, convertAmount]);

  const pieData = useMemo<{name: string, value: number, id: string}[]>(() => {
    return Object.values(categoryStats).map((stat: { id: string, rawName: string, value: number }) => ({
      name: t(stat.rawName),
      value: stat.value,
      id: stat.id // Keep ID for linking
    })).sort((a, b) => b.value - a.value);
  }, [categoryStats, t]);

  // Daily Trend Data
  const barData = useMemo(() => {
    const dailyDataMap = filteredExpenses.reduce((acc, curr) => {
       const date = new Date(curr.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
       const normalizedAmount = convertAmount(curr.amount, curr.currency, baseCurrency);
       acc[date] = (acc[date] || 0) + normalizedAmount;
       return acc;
    }, {} as Record<string, number>);

    return Object.keys(dailyDataMap).map(date => ({
       date,
       amount: dailyDataMap[date]
    })).slice(-14);
  }, [filteredExpenses, baseCurrency, convertAmount]);

  const COLORS = ['#D67D6E', '#8FBACD', '#E89F93', '#6A92A3', '#B8ABA0', '#9C8F83'];
  const total = filteredExpenses.reduce((acc, curr) => acc + convertAmount(curr.amount, curr.currency, baseCurrency), 0);

  // Budget Calculations
  const budgetProgress = Math.min((total / monthlyBudget) * 100, 100);
  const isOverBudget = total > monthlyBudget;
  const remainingBudget = Math.max(monthlyBudget - total, 0);

  // Avg Daily Calculation
  const daysInMonth = new Date().getDate(); // approximate for "this month" view
  const avgDaily = filter === 'month' ? (total / daysInMonth) : 0;

  const handleGenerateInsights = async () => {
    setIsLoadingInsight(true);
    const recentExpenses = expenses.slice(0, 15);
    const translatedCategories = categories.map(c => ({...c, name: t(c.name)}));
    const result = await getSpendingInsights(recentExpenses, baseCurrency, translatedCategories, language);
    setInsight(result);
    setIsLoadingInsight(false);
  };

  // Drill-down Logic
  const selectedCategoryName = selectedCategoryId 
    ? t(categoryStats[selectedCategoryId]?.rawName || 'cat_Other') 
    : '';
    
  const detailExpenses = useMemo<Expense[]>(() => {
    return selectedCategoryId
      ? filteredExpenses.filter(e => {
          const cId = categories.find(c => c.id === e.categoryId)?.id || 'other';
          return cId === selectedCategoryId;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];
  }, [selectedCategoryId, filteredExpenses, categories]);

  // Group detail expenses by date for better UI
  const groupedDetailExpenses = useMemo<Record<string, Expense[]>>(() => {
    const groups: Record<string, Expense[]> = {};
    detailExpenses.forEach(expense => {
      const dateObj = new Date(expense.date);
      // Use the selected language for date formatting
      const locale = language === 'zh' ? 'zh-TW' : 'en-US';
      const dateStr = dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' });
      
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(expense);
    });
    return groups;
  }, [detailExpenses, language]);

  return (
    <div className="p-6 md:p-8 pb-24 h-full overflow-y-auto no-scrollbar relative">
      
      {/* Detail Modal Overlay */}
      {selectedCategoryId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
             onClick={() => setSelectedCategoryId(null)}
           />
           
           {/* Modal Content */}
           <div className="bg-white dark:bg-stone-950 w-full max-w-md h-[85vh] sm:max-h-[85vh] sm:rounded-3xl rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-bottom-10 duration-300">
              
              {/* Modal Header (Fixed) */}
              <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950 shrink-0 z-20">
                 <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    {selectedCategoryName}
                    <span className="text-xs font-normal text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg">
                       {detailExpenses.length}
                    </span>
                 </h3>
                 <button onClick={() => setSelectedCategoryId(null)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500 hover:bg-stone-200 transition-colors">
                    <X size={18} />
                 </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 {Object.keys(groupedDetailExpenses).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-stone-400">
                        <Icons.Inbox size={48} className="opacity-20 mb-2" />
                        <p>{t('noTransactionsFound')}</p>
                    </div>
                 ) : (
                    Object.entries(groupedDetailExpenses).map(([dateStr, items]: [string, Expense[]]) => (
                      <div key={dateStr} className="space-y-2">
                          {/* Sticky Date Header */}
                          <div className="sticky top-0 z-10 bg-white/95 dark:bg-stone-950/95 backdrop-blur-sm py-2 px-1 border-b border-stone-50 dark:border-stone-900 mb-2">
                              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                  {dateStr}
                              </span>
                          </div>

                          {items.map(expense => {
                              const payer = users.find(u => u.id === expense.paidBy);
                              return (
                                <div key={expense.id} className="bg-milk-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                      <p className="font-bold text-stone-800 dark:text-stone-100 text-sm leading-tight line-clamp-2">
                                          {expense.description}
                                      </p>
                                      <span className="font-extrabold text-stone-800 dark:text-stone-100 text-sm whitespace-nowrap ml-4">
                                          {expense.currency} {expense.amount.toFixed(2)}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-1">
                                      <div className="flex items-center gap-1.5">
                                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${payer?.color || 'bg-gray-400'}`}>
                                            {payer?.name.substring(0, 1)}
                                          </div>
                                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                            {payer?.name} {t('paid')}
                                          </span>
                                      </div>
                                      {expense.splitType !== 'equal' && (
                                        <span className="text-[9px] bg-stone-200 dark:bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded-md font-bold uppercase">
                                            {t(expense.splitType === 'full_for_partner' ? 'for' : expense.splitType)}
                                        </span>
                                      )}
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                    ))
                 )}
              </div>

              {/* Modal Footer (Fixed) */}
              <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950 shrink-0 z-20 safe-area-bottom">
                 <button onClick={() => setSelectedCategoryId(null)} className="w-full py-3 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg">
                    {t('close')}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('breakdown')}</h2>
        
        <div className="bg-milk-200 dark:bg-stone-800 p-1 rounded-xl flex text-xs font-bold shadow-inner">
          <button 
            onClick={() => setFilter('month')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${filter === 'month' ? 'bg-white dark:bg-stone-600 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400'}`}
          >
            <Calendar size={14} />
            {t('thisMonth')}
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${filter === 'all' ? 'bg-white dark:bg-stone-600 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400'}`}
          >
            <TrendingUp size={14} />
            {t('allTime')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Spent Card */}
        <div className="col-span-1 bg-stone-800 dark:bg-stone-100 rounded-3xl p-6 text-white dark:text-stone-900 shadow-xl shadow-stone-200 dark:shadow-none flex flex-col justify-between">
           <div>
             <h3 className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase tracking-widest mb-1">{t('totalSpent')}</h3>
             <p className="text-4xl font-extrabold">{baseCurrency} {total.toFixed(0)}</p>
             <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 opacity-80">{filter === 'month' ? t('currentBillingCycle') : t('lifetimeTotal')}</p>
           </div>
           
           {filter === 'month' && (
              <div className="mt-6">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-xs font-bold text-stone-400 dark:text-stone-500">{t('budgetUsed')}</span>
                   <span className={`text-xs font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>{Math.round((total / monthlyBudget) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 dark:bg-black/10 rounded-full h-2 overflow-hidden">
                   <div 
                      className={`h-full rounded-full ${isOverBudget ? 'bg-red-400' : 'bg-emerald-400'}`} 
                      style={{ width: `${budgetProgress}%` }}
                   ></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                   <span>{t('budgetRemaining')}: {baseCurrency} {remainingBudget.toFixed(0)}</span>
                   <span>{t('monthlyBudget')}: {baseCurrency} {monthlyBudget}</span>
                </div>
              </div>
           )}
        </div>

        {/* AI Insight Trigger */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
             {/* Key Metrics Row */}
            <div className="grid grid-cols-2 gap-4 h-24">
                <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1 text-stone-400">
                      <Target size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('avgDailySpend')}</span>
                   </div>
                   <span className="text-2xl font-bold text-stone-800 dark:text-stone-100">{baseCurrency} {avgDaily.toFixed(0)}</span>
                </div>
                
                 {/* Placeholder for future metric */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1 text-stone-400">
                      <DollarSign size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t('countCategories', {count: pieData.length.toString()})}</span>
                   </div>
                   <span className="text-2xl font-bold text-stone-800 dark:text-stone-100">Active</span>
                </div>
            </div>

            {!insight ? (
            <button 
                onClick={handleGenerateInsights}
                disabled={isLoadingInsight || expenses.length === 0}
                className="w-full flex-1 min-h-[100px] bg-gradient-to-r from-purple-50 to-blue-50 dark:from-stone-900 dark:to-stone-900 rounded-3xl flex flex-col items-center justify-center space-y-3 text-purple-700 dark:text-purple-300 font-bold border border-purple-100 dark:border-stone-800 hover:border-purple-300 transition-all disabled:opacity-50 group"
            >
                {isLoadingInsight ? (
                <Loader2 size={24} className="animate-spin" />
                ) : (
                <div className="p-3 bg-white dark:bg-stone-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    <Sparkles size={20} />
                </div>
                )}
                <span>{isLoadingInsight ? t('aiAnalyzing') : t('generateInsights')}</span>
            </button>
            ) : (
            <div className="flex-1 min-h-[100px] bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 relative">
                <div className="flex items-center space-x-2 mb-3 text-purple-600 dark:text-purple-400">
                <Lightbulb size={18} />
                <h3 className="font-bold text-sm">{t('aiInsights')}</h3>
                </div>
                <div className="prose prose-sm prose-stone dark:prose-invert max-w-none text-xs leading-relaxed max-h-32 overflow-y-auto">
                    <Markdown>{insight}</Markdown>
                </div>
                <button onClick={() => setInsight('')} className="absolute top-4 right-4 text-stone-300 hover:text-stone-500">
                    <XIcon size={16} />
                </button>
            </div>
            )}
        </div>
      </div>

      {pieData.length === 0 ? (
        <div className="h-64 flex items-center justify-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 text-stone-400 text-sm font-medium">
          {t('noExpenses')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Pie Chart */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col">
            <h4 className="font-bold text-stone-800 dark:text-stone-100 mb-4">{t('categoryDistribution')}</h4>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${baseCurrency} ${value.toLocaleString()}`, null]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#444', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Total */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="font-bold text-stone-400 text-xs">{t('countCategories', { count: pieData.length.toString() })}</span>
              </div>
            </div>
          </div>

          {/* New Bar Chart: Spending Trend */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col">
             <h4 className="font-bold text-stone-800 dark:text-stone-100 mb-4">{t('dailyTrend')}</h4>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a8a29e'}} />
                      <Tooltip 
                         formatter={(value: number) => [`${baseCurrency} ${value.toLocaleString()}`, null]}
                         cursor={{fill: 'rgba(0,0,0,0.05)'}}
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="amount" fill="#8FBACD" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* List Breakdown */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-stone-800 dark:text-stone-100 mt-4 mb-2">{t('categoryDetails')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pieData.map((item, idx) => (
                <button 
                  key={item.name} 
                  onClick={() => setSelectedCategoryId(item.id)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-50 dark:border-stone-800 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700 transition-all text-left group"
                >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-sm font-bold text-stone-700 dark:text-stone-200 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="text-right">
                          <span className="text-sm font-bold text-stone-900 dark:text-stone-100 block">{baseCurrency} {item.value.toFixed(0)}</span>
                          <span className="text-[10px] text-stone-400">{Math.round((item.value / total) * 100)}%</span>
                       </div>
                       <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-400" />
                    </div>
                </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component
const XIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);