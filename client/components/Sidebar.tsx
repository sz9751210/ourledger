import React from 'react';
import { Home, PieChart, Settings, Plus, Wallet, ArrowRightLeft } from 'lucide-react';
import { Tab, Expense } from '../types';
import { useAppStore } from '../services/store';
import { PinnedExpenses } from './PinnedExpenses';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onUseTemplate?: (expense: Expense) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onUseTemplate }) => {
  const { t, currentUser } = useAppStore();

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => onTabChange(tab)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
            ? 'bg-stone-800 text-white shadow-md dark:bg-stone-100 dark:text-stone-900'
            : 'text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
          }`}
      >
        <Icon size={20} className={isActive ? 'text-white dark:text-stone-900' : 'text-stone-400 group-hover:text-stone-600 dark:text-stone-500'} />
        <span className="font-bold text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="h-screen w-64 bg-white dark:bg-stone-950 border-r border-stone-100 dark:border-stone-800 flex flex-col p-6 hidden md:flex shrink-0">
      {/* Brand */}
      <div className="flex items-center space-x-3 mb-10 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-400 rounded-xl flex items-center justify-center text-white dark:text-stone-900 shadow-lg">
          <Wallet size={20} />
        </div>
        <h1 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 tracking-tight">{t('appTitle')}</h1>
      </div>

      {/* Navigation */}
      <div className="space-y-2 flex-1">
        <NavItem tab="home" icon={Home} label={t('ledger')} />
        <NavItem tab="transfer" icon={ArrowRightLeft} label={t('transfer', { defaultValue: 'Transfer' })} />
        <NavItem tab="stats" icon={PieChart} label={t('stats')} />
        <NavItem tab="settings" icon={Settings} label={t('settings')} />
      </div>

      {/* Pinned Expenses / Templates */}
      {onUseTemplate && (
        <div className="mb-4">
          <PinnedExpenses onUseTemplate={onUseTemplate} />
        </div>
      )}

      {/* Quick Add Button */}
      <button
        onClick={() => onTabChange('add')}
        className="w-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 p-4 rounded-xl flex items-center justify-center space-x-2 font-bold transition-all mb-6 border border-stone-200 dark:border-stone-700"
      >
        <Plus size={20} />
        <span>{t('newExpense')}</span>
      </button>

      {/* User Profile Snippet */}
      <div className="flex items-center space-x-3 px-2 py-3 border-t border-stone-100 dark:border-stone-800 mt-auto">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${currentUser.color}`}>
          {currentUser.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">{currentUser.name}</p>
          <p className="text-[10px] text-stone-400 truncate">{t('proMember')}</p>
        </div>
      </div>
    </div>
  );
};