import React, { useState } from 'react';
import { AppProvider, useAppStore } from './services/store';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { LedgerHeader } from './components/LedgerHeader';
import { TransactionList } from './components/TransactionList';
import { AddExpense } from './components/AddExpense';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { ToastContainer } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Tab, Expense } from './types';

// Main content component to use Store context
const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const { darkMode } = useAppStore();

  const handleTabChange = (tab: Tab) => {
    if (tab === 'add') {
      setEditingExpense(undefined); // Clear any previous edit state
      setShowAddModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    // Delay clearing the edit state slightly so the modal doesn't flash content changes while closing
    setTimeout(() => setEditingExpense(undefined), 300);
  };

  return (
    // Apply dark class here based on store state
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-milk-100 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 selection:bg-clay-400 selection:text-white transition-colors flex overflow-hidden">
        
        <ToastContainer />
        <ConfirmDialog />
        
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative h-screen bg-milk-50 dark:bg-stone-950 shadow-2xl overflow-hidden rounded-l-[0] md:rounded-l-[2.5rem] transition-all duration-300">
          
          {/* Dynamic Header (Sticky Top) */}
          <div className="shrink-0 z-20">
             {activeTab === 'home' && <LedgerHeader />}
          </div>

          {/* Scrollable Body */}
          <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            <div className="max-w-7xl mx-auto w-full">
              {activeTab === 'home' && (
                <div className="pt-6 pb-24 md:pb-6">
                  <TransactionList onEdit={handleEditExpense} />
                </div>
              )}
              
              {activeTab === 'stats' && <StatsView />}
              
              {activeTab === 'settings' && <SettingsView />}
            </div>
          </main>

          {/* Navigation (Mobile Only) */}
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Modals */}
          {showAddModal && (
            <AddExpense 
              onClose={handleCloseModal} 
              initialExpense={editingExpense} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Root App with Providers
const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;