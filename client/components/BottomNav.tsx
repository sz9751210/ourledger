import React from 'react';
import { Home, Plus, PieChart, Settings } from 'lucide-react';
import { Tab } from '../types';
import { useAppStore } from '../services/store';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useAppStore();

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => {
    const isActive = activeTab === tab;
    
    // Special styling for the Add button
    if (tab === 'add') {
      return (
        <button
          onClick={() => onTabChange(tab)}
          className="bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 p-4 rounded-full shadow-lg shadow-stone-300 dark:shadow-none transition-transform active:scale-90"
        >
          <Icon size={28} strokeWidth={2.5} />
        </button>
      );
    }

    return (
      <button
        onClick={() => onTabChange(tab)}
        className={`flex flex-col items-center justify-center w-full py-2 space-y-1 transition-colors ${
          isActive ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'
        }`}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-semibold tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 pb-safe-area shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50 transition-colors duration-300 md:hidden">
      <div className="max-w-md mx-auto h-20 relative">
        {/* Main Grid for Navigation Items */}
        <div className="grid grid-cols-5 h-full items-center px-2">
          
          {/* Left: Ledger (Home) */}
          <div className="col-span-1 flex justify-center">
             <NavItem tab="home" icon={Home} label={t('ledger')} />
          </div>

          {/* Left-Center: Stats */}
          <div className="col-span-1 flex justify-center">
             <NavItem tab="stats" icon={PieChart} label={t('stats')} />
          </div>

          {/* Center: Spacer for Floating Add Button */}
          <div className="col-span-1"></div>

          {/* Right-Center: Spacer (Empty for balance) */}
          <div className="col-span-1 flex justify-center">
             {/* Potential slot for future features */}
          </div>

          {/* Right: Settings */}
          <div className="col-span-1 flex justify-center">
             <NavItem tab="settings" icon={Settings} label={t('settings')} />
          </div>
        </div>

        {/* Floating Add Button (Absolute Centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <NavItem tab="add" icon={Plus} label={t('add')} />
        </div>
      </div>
    </div>
  );
};