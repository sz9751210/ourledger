// components/TransferView.tsx
import React, { useState } from 'react';
import { useAppStore } from '../services/store';
import { ArrowRight, Calendar, Wallet, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export const TransferView: React.FC = () => {
  const { 
    currentUser, 
    activeLedgerMembers, 
    addExpense, 
    activeLedgerId, 
    baseCurrency,
    t 
  } = useAppStore();

  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(currentUser.id);
  // 預設收款人為列表中的另一個人
  const [receiverId, setReceiverId] = useState(
    activeLedgerMembers.find(m => m.id !== currentUser.id)?.id || ''
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !payerId || !receiverId) return;

    // 建立轉帳紀錄
    // 我們利用既有的 addExpense，但標記為結算 (isSettlement)
    await addExpense({
      ledgerId: activeLedgerId,
      amount: parseFloat(amount),
      currency: baseCurrency,
      description: note || t('transfer', {defaultValue: 'Transfer'}),
      categoryId: 'transfer', // 建議在後端或常量中增加一個 'transfer' 分類 ID，或使用 'c6' (settlement)
      paidBy: payerId,
      beneficiaryId: receiverId, // 這是收款人
      date: new Date(date).toISOString(),
      splitType: 'settlement', // 關鍵：這會讓系統知道這是還款
      isSettlement: true,      // 關鍵：標記為結清/轉帳
      notes: note
    });

    setIsSubmitted(true);
    // 2秒後重置，方便連續輸入
    setTimeout(() => {
        setAmount('');
        setNote('');
        setIsSubmitted(false);
    }, 2000);
  };

  return (
    <div className="p-6 pt-10 h-full overflow-y-auto no-scrollbar flex flex-col items-center">
      <div className="max-w-md w-full">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-8 text-center">
            {t('transferMoney', {defaultValue: 'Transfer Money'})}
        </h2>

        {isSubmitted ? (
            <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-3xl flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-300">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">{t('transferSuccess', {defaultValue: 'Transfer Successful'})}</h3>
                <p className="text-stone-500 dark:text-stone-400">{t('recorded', {defaultValue: 'Transaction recorded'})}</p>
                <Button onClick={() => setIsSubmitted(false)} variant="secondary" className="mt-4">
                    {t('makeAnother', {defaultValue: 'Make another transfer'})}
                </Button>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 space-y-6">
            
            {/* Amount */}
            <div className="text-center space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('amount')}</label>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-stone-400">{baseCurrency}</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        autoFocus
                        className="w-48 text-center text-5xl font-extrabold bg-transparent text-stone-800 dark:text-white focus:outline-none placeholder-stone-200"
                    />
                </div>
            </div>

            {/* From -> To */}
            <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl flex items-center justify-between gap-2">
                {/* Payer */}
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">{t('from', {defaultValue: 'From'})}</label>
                    <select 
                        value={payerId}
                        onChange={(e) => setPayerId(e.target.value)}
                        className="w-full bg-white dark:bg-stone-900 p-3 rounded-xl font-bold text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:outline-none"
                    >
                        {activeLedgerMembers.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 text-stone-300">
                    <ArrowRight size={24} />
                </div>

                {/* Receiver */}
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">{t('to', {defaultValue: 'To'})}</label>
                    <select 
                        value={receiverId}
                        onChange={(e) => setReceiverId(e.target.value)}
                        className="w-full bg-white dark:bg-stone-900 p-3 rounded-xl font-bold text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800 focus:outline-none"
                    >
                        {activeLedgerMembers.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Date */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 ml-1 flex items-center gap-1">
                    <Calendar size={12} /> {t('date')}
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-950 rounded-xl px-4 py-3 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800"
                />
            </div>

            {/* Note */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 ml-1">{t('notes')}</label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('transferNotePlaceholder', {defaultValue: 'e.g. Lunch money repayment'})}
                    className="w-full bg-stone-50 dark:bg-stone-950 rounded-xl px-4 py-3 font-semibold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800"
                />
            </div>

            <Button 
                type="submit" 
                size="lg" 
                className="w-full mt-4"
                disabled={!amount || !payerId || !receiverId || payerId === receiverId}
            >
                <Wallet className="mr-2" size={18} />
                {t('confirmTransfer', {defaultValue: 'Confirm Transfer'})}
            </Button>

            </form>
        )}
      </div>
    </div>
  );
};