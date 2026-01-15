import React, { useState } from 'react';
import { ChevronDown, Check, Plus, Users, X, Trash2 } from 'lucide-react';
import { useAppStore } from '../services/store';
import { AVAILABLE_COLORS } from '../constants';

export const LedgerHeader: React.FC = () => {
  const { activeLedgerId, ledgers, setActiveLedger, calculateBalance, settleUp, addLedger, updateLedger, activeLedgerMembers, currentUser, users, addUser, deleteUser, baseCurrency, showConfirm, t } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isManagingMembers, setIsManagingMembers] = useState(false); 
  
  // New User Creation inside Modal
  const [isAddingNewUser, setIsAddingNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  
  const [newLedgerName, setNewLedgerName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUser.id]);

  const activeLedger = ledgers.find(l => l.id === activeLedgerId);
  
  // Determine Debt Relationship Logic for Display
  let headerText = "";
  let balanceToShow = 0;
  let isPositive = true;
  let isZero = true;

  if (activeLedgerMembers.length === 2) {
     const m1 = activeLedgerMembers[0];
     const m2 = activeLedgerMembers[1];
     const b1 = calculateBalance(activeLedgerId, m1.id);
     
     if (Math.abs(b1) < 0.01) {
        isZero = true;
     } else {
        isZero = false;
        if (b1 > 0) {
           // m1 is owed by m2
           headerText = t('xOwesY', { x: m2.name, y: m1.name });
           balanceToShow = b1;
           // Visual color logic: Green if current user is receiving, Red if paying.
           // If I am m1 (receiver), positive. If I am m2 (payer), negative.
           isPositive = (currentUser.id === m1.id);
        } else {
           // b1 < 0 -> m1 owes m2
           headerText = t('xOwesY', { x: m1.name, y: m2.name });
           balanceToShow = Math.abs(b1);
           // If I am m2 (receiver), positive. If I am m1 (payer), negative.
           isPositive = (currentUser.id === m2.id);
        }
     }
  } else {
     // Fallback for > 2 members or 1 member
     // Show current user status with explicit name
     const myBal = calculateBalance(activeLedgerId, currentUser.id);
     balanceToShow = Math.abs(myBal);
     isZero = Math.abs(myBal) < 0.01;
     isPositive = myBal > 0;

     if (myBal > 0) {
        headerText = t('xIsOwed', { x: currentUser.name }); 
     } else {
        headerText = t('xOwes', { x: currentUser.name }); 
     }
  }

  const displayAmount = balanceToShow.toFixed(2);
  const displayString = `${baseCurrency} ${displayAmount}`;

  const handleSettleUp = () => {
    if (window.confirm(t('confirmSettle', { amount: displayString }))) {
      settleUp(activeLedgerId);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLedgerName.trim()) {
      addLedger(newLedgerName, selectedMembers);
      setNewLedgerName('');
      setSelectedMembers([currentUser.id]);
      setIsCreating(false);
      setIsMenuOpen(false);
    }
  };

  const handleUpdateMembers = () => {
     if (activeLedger) {
       updateLedger(activeLedger.id, { members: selectedMembers });
       setIsManagingMembers(false);
       setIsAddingNewUser(false);
     }
  };

  const handleQuickAddUser = () => {
    if (newUserName.trim()) {
      const color = AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)];
      const newId = addUser(newUserName, color);
      // Automatically select the new user
      setSelectedMembers(prev => [...prev, newId]);
      setNewUserName('');
      setIsAddingNewUser(false);
    }
  };

  const handleDeleteUser = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    showConfirm(
      t('confirmDelete'),
      t('confirmDeleteUser'),
      () => {
        deleteUser(userId);
        setSelectedMembers(prev => prev.filter(id => id !== userId));
      },
      true // Destructive
    );
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const openManageMembers = () => {
     if (activeLedger) {
       setSelectedMembers(activeLedger.members);
       setIsManagingMembers(true);
       setIsMenuOpen(false);
     }
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
        setIsMenuOpen(false);
        setIsCreating(false); 
        setNewLedgerName('');
        setSelectedMembers([currentUser.id]);
    } else {
        setIsMenuOpen(true);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-b-[2.5rem] md:rounded-b-none px-6 pt-12 md:pt-6 pb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none relative z-10 border-b border-transparent md:border-stone-100 dark:md:border-stone-800 transition-colors">
      {/* Ledger Selector */}
      <div className="relative mb-6 flex justify-center items-center md:justify-between">
        <div className="relative">
            <button 
            onClick={toggleMenu}
            className="inline-flex items-center space-x-2 bg-milk-100 dark:bg-stone-800 px-4 py-1.5 rounded-full text-stone-600 dark:text-stone-300 font-bold text-sm tracking-wide hover:bg-milk-200 dark:hover:bg-stone-700 transition-colors"
            >
            <span>{activeLedger?.name}</span>
            <ChevronDown size={14} className={`transform transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {/* Dropdown Menu */}
            {isMenuOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-2 w-72 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 z-50 max-h-[70vh] overflow-y-auto no-scrollbar">
                {!isCreating && ledgers.map(ledger => (
                <button
                    key={ledger.id}
                    onClick={() => {
                    setActiveLedger(ledger.id);
                    toggleMenu();
                    }}
                    className="w-full text-left px-5 py-3 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-milk-50 dark:hover:bg-stone-700 flex items-center justify-between"
                >
                    <span>{ledger.name}</span>
                    {ledger.id === activeLedgerId && <Check size={16} className="text-stone-900 dark:text-white" />}
                </button>
                ))}
                {!isCreating && <div className="h-px bg-stone-100 dark:bg-stone-700 my-1"></div>}
                
                {isCreating ? (
                <form onSubmit={handleCreateSubmit} className="px-4 py-2 space-y-3 animate-in fade-in">
                    <input
                    autoFocus
                    value={newLedgerName}
                    onChange={(e) => setNewLedgerName(e.target.value)}
                    placeholder={t('ledgerNamePlaceholder')}
                    className="w-full bg-stone-100 dark:bg-stone-700 rounded-lg px-3 py-2 text-sm font-semibold text-stone-800 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-600"
                    />
                    
                    <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{t('ledgerMembers')}</label>
                    <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
                        {users.map(u => (
                        <div 
                            key={u.id}
                            onClick={() => toggleMemberSelection(u.id)}
                            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer ${selectedMembers.includes(u.id) ? 'bg-milk-100 dark:bg-stone-700' : 'hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMembers.includes(u.id) ? 'bg-stone-800 border-stone-800 dark:bg-stone-200' : 'border-stone-300'}`}>
                            {selectedMembers.includes(u.id) && <Check size={10} className="text-white dark:text-stone-900" />}
                            </div>
                            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{u.name}</span>
                        </div>
                        ))}
                    </div>
                    </div>

                    <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="flex-1 py-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-500 text-xs font-bold"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        type="submit"
                        disabled={!newLedgerName.trim() || selectedMembers.length === 0}
                        className="flex-1 py-2 rounded-lg bg-stone-800 dark:bg-white text-white dark:text-stone-900 text-xs font-bold disabled:opacity-50"
                    >
                        {t('add')}
                    </button>
                    </div>
                </form>
                ) : (
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating(true);
                    }}
                    className="w-full text-left px-5 py-3 text-xs font-bold text-stone-400 uppercase tracking-wider hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-2"
                >
                    <Plus size={14} />
                    {t('newLedger')}
                </button>
                )}
            </div>
            )}
        </div>

        {/* Manage Members Button */}
        <button 
          onClick={openManageMembers}
          className="absolute right-0 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 md:static"
          title={t('manageLedgerMembers')}
        >
          <Users size={20} />
        </button>
      </div>

      {/* Manage Members Modal */}
      {isManagingMembers && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                 <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">{t('manageLedgerMembers')}</h3>
                 <button onClick={() => setIsManagingMembers(false)} className="p-1 text-stone-400 hover:text-stone-600">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="space-y-2 mb-4 overflow-y-auto no-scrollbar flex-1">
                  {users.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => toggleMemberSelection(u.id)}
                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${selectedMembers.includes(u.id) ? 'bg-milk-50 border border-stone-200 dark:bg-stone-800 dark:border-stone-700' : 'bg-transparent border border-transparent hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                      >
                         <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] ${u.color}`}>
                               {u.name.substring(0,2).toUpperCase()}
                            </div>
                            <span className="font-bold text-sm text-stone-700 dark:text-stone-200">{u.name}</span>
                         </div>
                         
                         <div className="flex items-center space-x-3">
                            <button 
                                onClick={(e) => handleDeleteUser(e, u.id)}
                                className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title={t('deleted')}
                            >
                                <Trash2 size={14} />
                            </button>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedMembers.includes(u.id) ? 'bg-green-500 border-green-500' : 'border-stone-300'}`}>
                               {selectedMembers.includes(u.id) && <Check size={12} className="text-white" />}
                            </div>
                         </div>
                      </div>
                  ))}
              </div>

              {/* Add New User Inline */}
              <div className="shrink-0 pt-2 pb-4 border-t border-stone-100 dark:border-stone-800">
                  {!isAddingNewUser ? (
                    <button 
                      onClick={() => setIsAddingNewUser(true)}
                      className="w-full py-2 flex items-center justify-center gap-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 text-sm font-bold border border-dashed border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    >
                      <Plus size={16} />
                      {t('addPerson')}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                       <input 
                         autoFocus
                         placeholder={t('userName')}
                         value={newUserName}
                         onChange={(e) => setNewUserName(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleQuickAddUser()}
                         className="flex-1 bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-200"
                       />
                       <button 
                         onClick={handleQuickAddUser}
                         disabled={!newUserName.trim()}
                         className="bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 p-2 rounded-xl disabled:opacity-50"
                       >
                         <Check size={18} />
                       </button>
                       <button 
                         onClick={() => setIsAddingNewUser(false)}
                         className="text-stone-400 p-2"
                       >
                         <X size={18} />
                       </button>
                    </div>
                  )}
              </div>

              <button 
                onClick={handleUpdateMembers}
                className="w-full py-3 rounded-xl bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 font-bold shadow-lg shrink-0"
              >
                {t('save')}
              </button>
           </div>
        </div>
      )}

      {/* Balance Hero */}
      <div className="text-center md:flex md:items-end md:justify-center md:gap-8 md:text-left">
        {isZero ? (
          <div className="space-y-1 md:flex md:items-center md:gap-4 md:space-y-0">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mb-3 md:mb-0">
               <Check size={32} />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('allSettled')}</h2>
                <p className="text-stone-400 text-sm">{t('noDebts')}</p>
             </div>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-6">
            <div>
                <p className="text-stone-500 dark:text-stone-400 font-semibold text-sm uppercase tracking-wider">
                {headerText}
                </p>
                <h1 className={`text-5xl font-extrabold tracking-tight ${isPositive ? 'text-softblue-600 dark:text-softblue-400' : 'text-clay-500 dark:text-clay-400'}`}>
                <span className="text-2xl align-top mr-1">{baseCurrency}</span>{displayAmount}
                </h1>
            </div>
            <div className="pt-4 md:pt-0">
              <button 
                onClick={handleSettleUp}
                className="text-xs font-bold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-6 py-3 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm"
              >
                {t('settleUp')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};